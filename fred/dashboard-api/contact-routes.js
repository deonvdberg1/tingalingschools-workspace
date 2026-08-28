// ── Contact / lead capture routes (public form on autoeffortless.com) ──
// Saves lead to DB, appends to CSV spreadsheet, emails client an ack with a
// reference code, emails info@autoeffortless.com the lead, and (if configured)
// appends the row to a Google Sheet.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOG = '/opt/homebrew/bin/gog';
const ACCOUNT = 'info@autoeffortless.com';
const INBOX_EMAIL = 'info@autoeffortless.com';
const LEADS_CSV = '/Users/deonvandenberg/.openclaw/workspace/fred/leads/leads.csv';
const SHEETS_CONF = path.join(__dirname, 'data', 'leads-sheet.json');

const ipHits = new Map();
const VALID_NEEDS = ['AI Solutions', 'Custom App', 'Website Design & Deployment', 'AI Email & Calendar Syncing', 'AI Booking System', 'WhatsApp Assistant (add-on)', 'Something else / Not sure'];

function rateLimited(ip) {
  const now = Date.now();
  const hit = ipHits.get(ip) || { count: 0, reset: now + 60000 };
  if (now > hit.reset) { hit.count = 0; hit.reset = now + 60000; }
  hit.count += 1;
  ipHits.set(ip, hit);
  return hit.count > 5; // max 5 submissions/min per IP
}

function csvEscape(v) {
  const s = String(v == null ? '' : v);
  return '"' + s.replace(/"/g, '""') + '"';
}

function sendGmail(to, subject, body) {
  return new Promise((resolve) => {
    const child = execFile(GOG, ['gmail', 'send', '--account', ACCOUNT, '--to', to, '--subject', subject, '--body-file', '-'], { timeout: 30000 }, (err) => {
      if (err) console.error('[Contact] gog send error:', err.message);
      resolve(!err);
    });
    child.stdin.write(body);
    child.stdin.end();
  });
}

function appendGoogleSheet(row) {
  return new Promise((resolve) => {
    let conf = null;
    try { conf = JSON.parse(fs.readFileSync(SHEETS_CONF, 'utf8')); } catch { resolve(false); return; }
    if (!conf || !conf.spreadsheetId) { resolve(false); return; }
    const values = JSON.stringify([row]);
    execFile(GOG, ['sheets', 'append', conf.spreadsheetId, 'Leads!A:G', '--values-json', values, '--account', ACCOUNT], { timeout: 30000 }, (err) => {
      if (err) console.error('[Contact] sheets append error:', err.message);
      resolve(!err);
    });
  });
}

function appendCsv(row) {
  try {
    const header = 'Timestamp,Ref Code,Need,Description,Email,Phone,Country Code\n';
    if (!fs.existsSync(LEADS_CSV)) fs.writeFileSync(LEADS_CSV, header);
    fs.appendFileSync(LEADS_CSV, row.map(csvEscape).join(',') + '\n');
  } catch (e) { console.error('[Contact] csv error:', e.message); }
}

function makeRefCode() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AE-${ymd}-${rand}`;
}

export function setupContactRoutes(app, { query, run, saveDb }) {
  let leadsReady = false;
  function ensureTable() {
    if (leadsReady) return;
    run(`CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ref_code TEXT,
      need TEXT,
      description TEXT,
      email TEXT,
      phone TEXT,
      country_code TEXT,
      created_at TEXT
    )`);
    leadsReady = true;
  }

  // GET /api/leads — admin view
  app.get('/api/leads', (req, res, next) => {
    if (!req.user || req.user.role !== 'overlord') return res.status(403).json({ error: 'Forbidden' });
    ensureTable();
    const rows = query('SELECT * FROM leads ORDER BY id DESC LIMIT 200');
    res.json(rows);
  });

  // POST /api/contact — public form (global express.json() already applies)
  app.post('/api/contact', (req, res) => {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || '';
    if (rateLimited(ip)) return res.status(429).json({ error: 'Too many messages. Please try again in a minute.' });

    const { need, description = '', email, phone, countryCode = '+27' } = req.body || {};
    if (!need || !VALID_NEEDS.includes(need)) return res.status(400).json({ error: 'Please choose what you need from the list.' });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) return res.status(400).json({ error: 'Please enter a valid email address.' });
    if (!phone || !/^\+?[0-9\s-]{6,20}$/.test(String(phone).trim())) return res.status(400).json({ error: 'Please enter a valid phone number.' });

    const refCode = makeRefCode();
    const now = new Date().toISOString();
    const cleanEmail = String(email).trim();
    const cleanPhone = String(phone).trim();
    const cleanDesc = String(description).trim().slice(0, 2000);

    try {
      ensureTable();
      run('INSERT INTO leads (ref_code, need, description, email, phone, country_code, created_at) VALUES (?,?,?,?,?,?,?)',
        [refCode, need, cleanDesc, cleanEmail, cleanPhone, countryCode, now]);
      saveDb();
    } catch (e) { console.error('[Contact] db error:', e.message); }

    const fullPhone = `${countryCode} ${cleanPhone}`;
    appendCsv([now, refCode, need, cleanDesc, cleanEmail, fullPhone, countryCode]);
    appendGoogleSheet([now, refCode, need, cleanDesc, cleanEmail, fullPhone, countryCode]);

    // Ack email to the enquirer
    const ackSubject = `Your enquiry — AutoEffortless (Ref: ${refCode})`;
    const ackBody = `Hi there,\n\nThanks for reaching out to AutoEffortless!\n\nYour reference code is: ${refCode}\n\nWhat we received:\n• Need: ${need}\n• Email: ${cleanEmail}\n• Phone: ${fullPhone}\n${cleanDesc ? `• Message: ${cleanDesc}\n` : ''}\n\nA member of our team will get back to you within hours (7 days a week).\n\nIf you'd prefer to chat right now, WhatsApp us on 061 527 4429.\n\nBest regards,\nThe AutoEffortless Team\nwww.autoeffortless.com`;
    sendGmail(cleanEmail, ackSubject, ackBody);

    // Lead email to AutoEffortless
    const leadSubject = `[LEAD] ${refCode} — ${need}`;
    const leadBody = `New lead via autoeffortless.com\n\nRef Code: ${refCode}\nNeed: ${need}\nDescription: ${cleanDesc || '(none)'}\nEmail: ${cleanEmail}\nPhone: ${fullPhone}\nCountry Code: ${countryCode}\nReceived: ${now}\n\nReply to the client directly at ${cleanEmail}.`;
    sendGmail(INBOX_EMAIL, leadSubject, leadBody);

    console.log(`[Contact] lead ${refCode} (${need}) from ${cleanEmail}`);
    res.json({ ok: true, refCode });
  });
}
