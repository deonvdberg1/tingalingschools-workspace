// ── Site AI chat routes (public widget on autoeffortless.com) ──
// POST /api/ai/chat — proxies visitor messages to the aesite OpenClaw agent,
// stores conversations, and captures leads (DB + CSV + email to info@).
// GET  /api/ai/chats — admin (overlord) view of site conversations.

import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GATEWAY_HOST = 'localhost';
const GATEWAY_PORT = 18789;
const AGENT_MODEL = 'openclaw/aesite';
const MAX_TOKENS = 400;
const TEMPERATURE = 0.1;

const ACCOUNT = 'info@autoeffortless.com';
const LEADS_CSV = '/Users/deonvandenberg/.openclaw/workspace/fred/leads/leads.csv';
const AI_LEADS_CSV = '/Users/deonvandenberg/.openclaw/workspace/fred/leads/ai-chat-leads.csv';

const ipHits = new Map();
const WINDOW_MS = 10 * 60 * 1000;   // 10 min
const MAX_PER_WINDOW = 30;          // 30 messages / 10 min / IP

function rateLimited(ip) {
  const now = Date.now();
  const hit = ipHits.get(ip) || { count: 0, reset: now + WINDOW_MS };
  if (now > hit.reset) { hit.count = 0; hit.reset = now + WINDOW_MS; }
  hit.count += 1;
  ipHits.set(ip, hit);
  return hit.count > MAX_PER_WINDOW;
}

function csvEscape(v) {
  const s = String(v == null ? '' : v);
  return '"' + s.replace(/"/g, '""') + '"';
}

function sendGmail(to, subject, body) {
  return new Promise((resolve) => {
    const child = execFile('/opt/homebrew/bin/gog', ['gmail', 'send', '--account', ACCOUNT, '--to', to, '--subject', subject, '--body-file', '-'], { timeout: 30000 }, (err) => {
      if (err) console.error('[SiteAI] gog send error:', err.message);
      resolve(!err);
    });
    child.stdin.write(body);
    child.stdin.end();
  });
}

function appendCsv(file, row) {
  try {
    const header = 'Timestamp,Ref Code,Need,Description,Email,Phone,Country Code\n';
    if (!fs.existsSync(file)) fs.writeFileSync(file, header);
    fs.appendFileSync(file, row.map(csvEscape).join(',') + '\n');
  } catch (e) { console.error('[SiteAI] csv error:', e.message); }
}

function makeRefCode() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AI-${ymd}-${rand}`;
}

function callGateway(messages) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      model: AGENT_MODEL,
      messages,
      stream: false,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE
    });
    const req = http.request({
      hostname: GATEWAY_HOST,
      port: GATEWAY_PORT,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'x-openclaw-light-context': 'true'
      }
    }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          const j = JSON.parse(body);
          resolve(j.choices?.[0]?.message?.content || null);
        } catch (e) {
          console.error('[SiteAI] gateway parse error:', e.message);
          resolve(null);
        }
      });
    });
    req.on('error', (e) => { console.error('[SiteAI] gateway error:', e.message); resolve(null); });
    req.setTimeout(45000, () => { req.destroy(new Error('gateway timeout')); });
    req.write(data);
    req.end();
  });
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(\+?[0-9][0-9\s-]{8,16})/;

export function setupSiteAIRoutes(app, { query, run, saveDb }) {
  let aiReady = false;
  function ensureTables() {
    if (aiReady) return;
    run(`CREATE TABLE IF NOT EXISTS site_ai_chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      ref_code TEXT,
      messages TEXT,
      lead_json TEXT,
      created_at TEXT
    )`);
    aiReady = true;
  }

  // Admin view of site AI conversations
  app.get('/api/ai/chats', (req, res, next) => {
    if (!req.user || req.user.role !== 'overlord') return res.status(403).json({ error: 'Forbidden' });
    ensureTables();
    const rows = query('SELECT * FROM site_ai_chats ORDER BY id DESC LIMIT 100');
    rows.forEach((r) => { try { r.messages = JSON.parse(r.messages); } catch {} try { r.lead_json = r.lead_json ? JSON.parse(r.lead_json) : null; } catch {} });
    res.json(rows);
  });

  // Public chat endpoint used by the website widget
  app.post('/api/ai/chat', async (req, res) => {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || '';
    if (rateLimited(ip)) return res.status(429).json({ error: 'You are chatting too fast. Please wait a moment.' });

    const { messages, lead = null, sessionId = '' } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
      return res.status(400).json({ error: 'messages must be a non-empty array (max 20)' });
    }

    const clean = [];
    for (const m of messages) {
      const role = m && m.role === 'assistant' ? 'assistant' : 'user';
      const content = String(m && m.content || '').trim().slice(0, 2000);
      if (!content) continue;
      clean.push({ role, content });
    }
    if (clean.length === 0) return res.status(400).json({ error: 'No message content' });

    // Pass the last 10 turns for context
    const history = clean.slice(-10);
    const lastUser = [...clean].reverse().find((m) => m.role === 'user');

    const reply = await callGateway(history);
    if (!reply) {
      return res.status(502).json({ error: 'The assistant is busy right now — please try again in a moment, or WhatsApp us at https://wa.me/27615274429' });
    }

    // Lead detection: explicit payload OR email/phone typed in the last user message
    let leadInfo = null;
    const lastText = lastUser ? lastUser.content : '';
    const foundEmail = EMAIL_RE.exec(lastText);
    const foundPhone = PHONE_RE.exec(lastText);
    const wantHuman = /quote|price|cost|meeting|call me|talk to|human|demo|hire|start|get started/i.test(lastText) || !!lead;

    if (lead && (lead.email || lead.phone || lead.name)) {
      leadInfo = {
        name: String(lead.name || '').trim().slice(0, 120),
        email: String(lead.email || '').trim().slice(0, 160),
        phone: String(lead.phone || '').trim().slice(0, 40),
        source: 'ai-chat-lead-form'
      };
    } else if (wantHuman && (foundEmail || foundPhone)) {
      leadInfo = {
        name: '',
        email: foundEmail ? foundEmail[0] : '',
        phone: foundPhone ? foundPhone[0].trim() : '',
        source: 'ai-chat-detected'
      };
    }

    let refCode = null;
    if (leadInfo && (leadInfo.email || leadInfo.phone)) {
      refCode = makeRefCode();
      const now = new Date().toISOString();
      try {
        ensureTables();
        run('INSERT INTO leads (ref_code, need, description, email, phone, country_code, created_at) VALUES (?,?,?,?,?,?,?)',
          [refCode, 'Website AI Chat', lastText.slice(0, 2000), leadInfo.email, leadInfo.phone, '', now]);
        const row = [now, refCode, 'Website AI Chat', lastText.slice(0, 500), leadInfo.email, leadInfo.phone, ''];
        appendCsv(LEADS_CSV, row);
        appendCsv(AI_LEADS_CSV, row);

        // Notify the team with chat context
        const transcript = clean.map((m) => `${m.role === 'user' ? 'Visitor' : 'AI'}: ${m.content}`).join('\n\n');
        sendGmail('info@autoeffortless.com',
          `💬 New AI chat lead ${refCode} — ${leadInfo.name || leadInfo.email || leadInfo.phone}`,
          `A visitor on autoeffortless.com left contact details in the AI chat.\n\n` +
          `Ref: ${refCode}\nName: ${leadInfo.name || '—'}\nEmail: ${leadInfo.email || '—'}\nPhone: ${leadInfo.phone || '—'}\nSource: ${leadInfo.source}\n\n` +
          `--- Chat so far ---\n${transcript.slice(0, 4000)}\n\nReply within hours.`);
      } catch (e) {
        console.error('[SiteAI] lead save error:', e.message);
      }
    }

    try {
      ensureTables();
      run('INSERT INTO site_ai_chats (session_id, ref_code, messages, lead_json, created_at) VALUES (?,?,?,?,?)',
        [String(sessionId || '').slice(0, 80), refCode, JSON.stringify(clean), leadInfo ? JSON.stringify(leadInfo) : null, new Date().toISOString()]);
      if (saveDb) saveDb();
    } catch (e) {
      console.error('[SiteAI] chat save error:', e.message);
    }

    res.json({ reply, refCode, leadSaved: !!leadInfo });
  });
}
