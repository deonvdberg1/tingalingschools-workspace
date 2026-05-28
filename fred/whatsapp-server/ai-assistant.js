// AutoEffortless AI Assistant v7.1 — Per-Client Agent Routing + Conversation Memory
// Routes AI requests to dedicated OpenClaw agents (one per client)
// Maintains conversation history per phone number for context

const http = require('http');
const fs = require('fs');
const path = require('path');

const GATEWAY_URL = 'http://localhost:18789/v1/chat/completions';

// ── Conversation memory (persisted to disk) ──────────────────────────────────
const AI_CONV_FILE = path.join(__dirname, 'ai-conversations.json');
const MAX_HISTORY = 20;

function loadHistory() {
  try {
    if (fs.existsSync(AI_CONV_FILE)) {
      const data = fs.readFileSync(AI_CONV_FILE, 'utf8');
      const parsed = JSON.parse(data);
      const map = new Map();
      for (const [key, val] of Object.entries(parsed)) {
        map.set(key, val);
      }
      return map;
    }
  } catch (e) {
    console.error('[AI] Failed to load conversation history:', e.message);
  }
  return new Map();
}

function saveHistory() {
  try {
    const obj = {};
    for (const [key, val] of conversationHistory) {
      obj[key] = val;
    }
    fs.writeFileSync(AI_CONV_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    console.error('[AI] Failed to save conversation history:', e.message);
  }
}

const conversationHistory = loadHistory();

function getHistory(phone) {
  if (!conversationHistory.has(phone)) conversationHistory.set(phone, []);
  return conversationHistory.get(phone);
}

function callGateway(messages) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      model: 'openclaw/tingai',
      messages: messages,
      stream: false,
      max_tokens: 400,
      temperature: 0.1
    });

    const req = http.request({
      hostname: 'localhost',
      port: 18789,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'x-openclaw-light-context': 'true'
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(body);
          const content = j.choices?.[0]?.message?.content;
          resolve(content || null);
        } catch(e) {
          console.error('[AI] Parse error:', e.message);
          resolve(null);
        }
      });
    });
    req.on('error', (e) => {
      console.error('[AI] Request error:', e.message);
      resolve(null);
    });
    req.write(data);
    req.end();
  });
}

function buildMessages(phone, message) {
  const history = getHistory(phone);
  const msgs = [];

  // Add recent conversation history for context (up to last 6 turns)
  const recent = history.slice(-6);
  for (const m of recent) {
    msgs.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content });
  }

  msgs.push({ role: 'user', content: message });
  return msgs;
}

// ── Public API ────────────────────────────────────────────────────────────
async function getAIAutoReply(messageText, fromNumber, clientContext) {
  const msg = (messageText || '').toLowerCase().trim();

  // Opt-out handled by server, but just in case
  if (/^stop$|^unsubscribe$|^opt.?out$|^cancel$/.test(msg)) return null;
  if (/^start$|^resubscribe$|^opt.?in$/i.test(msg)) return null;

  if (!clientContext || !clientContext.clientId) {
    console.error('[AI] No client context provided — cannot route to agent');
    return null;
  }

  const agentId = clientContext.agentId;
  if (!agentId) {
    console.error(`[AI] No agent configured for client ${clientContext.clientId} (${clientContext.clientName})`);
    return null;
  }

  console.log(`[AI] Routing to agent "${agentId}" for ${clientContext.clientName} (client ${clientContext.clientId})`);

  // Build messages with conversation history
  const messages = buildMessages(fromNumber, messageText);
  const reply = await callGateway(messages);

  if (reply && reply.length > 0) {
    // Store in conversation history
    const history = getHistory(fromNumber);
    history.push({ role: 'user', content: messageText });
    history.push({ role: 'assistant', content: reply });
    if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
    saveHistory();

    return { text: reply, type: 'text', source: 'ai' };
  }

  return null;
}

module.exports = { getAIAutoReply };
