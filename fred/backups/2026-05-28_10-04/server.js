require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getAIAutoReply } = require('./ai-assistant.js');
const app = express();

// ═══════════════════════════════════════════════════════════════════════════
// STARTUP VALIDATION — Crash early, not mysteriously
// ═══════════════════════════════════════════════════════════════════════════
const REQUIRED_ENV = ['WHATSAPP_TOKEN', 'PHONE_NUMBER_ID', 'APP_ID', 'APP_SECRET'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
  console.error('[FATAL] Check whatsapp-server/.env has all required fields');
  process.exit(1);
}

// ── Structured Logger ────────────────────────────────────────────────────
const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.INFO;

function log(level, component, message, data) {
  if (LOG_LEVELS[level] < CURRENT_LEVEL) return;
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const prefix = `[${ts}] [${level.padEnd(5)}] [${component}]`;
  if (data) {
    console.log(`${prefix} ${message}`, typeof data === 'object' ? JSON.stringify(data).substring(0, 200) : data);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

// ── Config ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'tingaling-verify';

// Admin numbers (reserved for future selective features)
const ADMIN_NUMBERS = new Set([
  '27615274429',  // Mr D
]);

const META_API = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;

// ── Simple Rate Limiter (per-window, in-memory) ──────────────────────────
const RATE_WINDOW_MS = 1000;   // 1 second window
const RATE_MAX_REQS = 20;      // max 20 requests per window

const rateBuckets = {};
setInterval(() => {
  // Clean up old buckets every 60 seconds
  const cutoff = Date.now() - 60000;
  for (const key of Object.keys(rateBuckets)) {
    if (rateBuckets[key] < cutoff) delete rateBuckets[key];
  }
}, 60000);

function checkRateLimit() {
  const windowKey = Math.floor(Date.now() / RATE_WINDOW_MS);
  rateBuckets[windowKey] = (rateBuckets[windowKey] || 0) + 1;
  rateBuckets[windowKey + 1] = rateBuckets[windowKey + 1] || 0; // ensure next window exists
  return rateBuckets[windowKey] <= RATE_MAX_REQS;
}

// ── Persistent conversation storage ───────────────────────────────────────
const CONV_FILE = path.join(__dirname, 'conversations.json');
const MAX_CONV_LOG = 50;

function loadConversations() {
  try {
    if (fs.existsSync(CONV_FILE)) {
      const data = fs.readFileSync(CONV_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    log('ERROR', 'PERSIST', 'Failed to load conversations:', e.message);
  }
  return {};
}

function saveConversations() {
  try {
    const toSave = {};
    for (const [key, conv] of Object.entries(conversations)) {
      toSave[key] = {
        name: conv.name,
        phone: conv.phone,
        messages: conv.messages,
        firstSeen: conv.firstSeen,
        lastSeen: conv.lastSeen,
        autoReplied: conv.autoReplied,
        humanRequests: conv.humanRequests
      };
    }
    fs.writeFileSync(CONV_FILE, JSON.stringify(toSave, null, 2), 'utf8');
  } catch (e) {
    log('ERROR', 'PERSIST', 'Failed to save conversations:', e.message);
  }
}

// Load saved conversations on startup
const conversations = loadConversations();
const processed_messages = new Set();

// ── Template cache ────────────────────────────────────────────────────────
const CLIENT_NUMBER_MAP = {
  '27687548390': 6,  // Ting-A-Ling Schools (DB client ID 6)
};

let cachedTemplates = null;
let cacheTime = 0;
const CACHE_TTL = 30000; // 30 seconds

async function fetchTemplates(clientId) {
  const now = Date.now();
  if (cachedTemplates && now - cacheTime < CACHE_TTL) {
    return cachedTemplates;
  }
  try {
    const res = await fetch('http://localhost:3001/api/clients/' + clientId + '/templates');
    if (res.ok) {
      cachedTemplates = await res.json();
      cacheTime = now;
      return cachedTemplates;
    }
  } catch {}
  return cachedTemplates || [];
}

// ── Smart keyword matcher ─────────────────────────────────────────────────
function matchKeywords(message, keywordsStr) {
  if (!keywordsStr || !keywordsStr.trim()) return 0;
  const msg = message.toLowerCase().trim();
  const keywords = keywordsStr.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
  if (keywords.length === 0) return 0;
  
  let score = 0;
  for (const keyword of keywords) {
    if (!keyword) continue;
    const safeKw = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Exact word match (highest priority)
    if (new RegExp('\\b' + safeKw + '\\b', 'i').test(msg)) {
      score += 3 * keyword.length;
    }
    // Word starts with keyword (e.g. "pay" matches "payment")
    else if (new RegExp('\\b' + safeKw, 'i').test(msg)) {
      score += 2 * keyword.length;
    }
    // Keyword appears anywhere
    else if (msg.includes(keyword)) {
      score += 1 * keyword.length;
    }
  }
  return score;
}

// ── Smart auto-reply: Template-first, AI-fallback ─────────────────────────
async function getAutoReply(messageText, fromNumber) {
  const msg = (messageText || '').toLowerCase().trim();

  // Opt-out (MUST be first — Meta policy)
  if (/^stop$|^unsubscribe$|^opt.?out$|^cancel$/i.test(msg)) {
    return { text: '✅ You have been unsubscribed.\n\nSend "START" to reactivate.', type: 'text' };
  }
  if (/^start$|^resubscribe$|^opt.?in$/i.test(msg)) {
    return { text: '✅ You have been resubscribed. Welcome back!', type: 'text' };
  }

  // Step 1: Try template matching first (school-approved content)
  const cleanNumber = (fromNumber || '').replace(/[^0-9]/g, '');
  const clientId = CLIENT_NUMBER_MAP[cleanNumber];
  
  if (clientId) {
    const templates = await fetchTemplates(clientId);
    if (templates && templates.length > 0) {
      const scored = templates
        .filter(t => t.active !== 0)
        .map(t => ({ template: t, score: matchKeywords(msg, t.trigger_keyword) }))
        .sort((a, b) => b.score - a.score);
      
      if (scored.length > 0 && scored[0].score > 0) {
        return { text: scored[0].template.content, type: 'text' };
      }
      
      const greeting = templates.find(t => t.category?.toLowerCase() === 'general');
      if (greeting) {
        return { text: greeting.content, type: 'text' };
      }
    }
  }

  // Step 2: Try AI assistant for nuanced queries
  const aiReply = await getAIAutoReply(messageText, fromNumber);
  if (aiReply) {
    return aiReply;
  }

  return null;
}

// ── Send Message via WhatsApp API ─────────────────────────────────────────
async function sendWhatsAppMessage(to, messageObj) {
  try {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: messageObj.type,
      [messageObj.type]: { body: messageObj.text }
    };

    const response = await axios.post(META_API, payload, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    log('INFO', 'SEND', `To: ${to} | Type: ${messageObj.type}`);
    return response.data;
  } catch (error) {
    log('ERROR', 'SEND', `To: ${to} | Failed`, error.response?.data || error.message);
    return null;
  }
}

// ── Log a conversation ────────────────────────────────────────────────────
function logConversation(from, name, message, reply) {
  if (!conversations[from]) {
    conversations[from] = {
      name: name || 'Unknown',
      phone: from,
      messages: [],
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      autoReplied: 0,
      humanRequests: 0
    };
  }

  const conv = conversations[from];
  conv.lastSeen = new Date().toISOString();
  if (name && name !== 'Unknown') conv.name = name;

  conv.messages.push({
    direction: 'in',
    text: message,
    timestamp: new Date().toISOString()
  });

  if (reply) {
    conv.messages.push({
      direction: 'out',
      text: reply.text,
      timestamp: new Date().toISOString()
    });
    conv.autoReplied++;
  } else {
    conv.humanRequests++;
  }

  // Trim old messages
  if (conv.messages.length > MAX_CONV_LOG) {
    conv.messages = conv.messages.slice(-MAX_CONV_LOG);
  }
  
  // Persist to disk
  saveConversations();
}

// ── Webhook: GET (Meta verification) ──────────────────────────────────────
app.get('/webhooks/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    log('INFO', 'WEBHOOK', 'Verified successfully');
    return res.status(200).send(challenge);
  }

  log('WARN', 'WEBHOOK', `Verification failed — token mismatch (mode=${mode})`);
  return res.sendStatus(403);
});

// ── Webhook: POST (Incoming messages) ─────────────────────────────────────
app.post('/webhooks/whatsapp', express.json(), async (req, res) => {
  // Rate limit check
  if (!checkRateLimit()) {
    log('WARN', 'RATE', 'Rate limit exceeded — returning 429');
    return res.status(429).send('Too many requests — please slow down');
  }

  // Acknowledge receipt immediately
  res.sendStatus(200);

  const entry = req.body?.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const messages = value?.messages;
  const contacts = value?.contacts;

  // Check for status updates (delivery/read receipts)
  const statuses = value?.statuses;
  if (statuses && statuses.length > 0) {
    for (const st of statuses) {
      log('INFO', 'STATUS', `${st.status} | To: ${st.recipient_id} | Msg: ${(st.id || '').substring(0, 30)}`);
    }
    return;
  }

  if (!messages || messages.length === 0) {
    log('DEBUG', 'WEBHOOK', 'No messages or statuses in this update');
    return;
  }

  for (const msg of messages) {
    const from = msg.from;
    const contact = contacts?.[0];
    const name = contact?.profile?.name || 'Unknown';

    if (msg.type === 'text') {
      if (processed_messages.has(msg.id)) { continue; }
      processed_messages.add(msg.id);
      if (processed_messages.size > 1000) { processed_messages.clear(); }

      const text = msg.text.body;
      const reply = await getAutoReply(text, from);

      logConversation(from, name, text, reply);

      const action = reply ? '→ Auto-replied' : '→ Needs human';
      log('INFO', 'IN', `${name} (${from}) | "${text.substring(0, 60)}" ${action}`);

      if (reply) {
        await sendWhatsAppMessage(from, reply);
      } else {
        await sendWhatsAppMessage(from, {
          text: `Thank you for your message, ${name} 🙏\n\nYour enquiry has been noted and a member of the Ting-A-Ling team will get back to you during office hours (07:00 - 15:30, weekdays).\n\nFor urgent matters, please call the office.`,
          type: 'text'
        });
        log('INFO', 'HUMAN', `Forwarding ${from} to manual handling`);
      }
    }
  }
});

// ── Dashboard: Send messages ─────────────────────────────────────────────
app.post('/send', express.json(), async (req, res) => {
  const { to, text } = req.body;
  if (!to || !text) {
    return res.json({ success: false, error: 'Missing phone or message' });
  }
  
  let cleanNumber = to.replace(/[^0-9]/g, '');
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '27' + cleanNumber.slice(1);
  } else if (!cleanNumber.startsWith('27')) {
    cleanNumber = '27' + cleanNumber;
  }
  
  const result = await sendWhatsAppMessage(cleanNumber, { text, type: 'text' });
  if (result) {
    logConversation(cleanNumber, 'Mr D (Dashboard)', text, null);
    res.json({ success: true, id: result.messages?.[0]?.id });
  } else {
    res.json({ success: false, error: 'API request failed' });
  }
});

// ── Static Pages ──────────────────────────────────────────────────────────
app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy-policy.html'));
});
app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy-policy.html'));
});
app.get('/terms-of-service', (req, res) => {
  res.sendFile(path.join(__dirname, 'terms-of-service.html'));
});
app.get('/data-deletion', (req, res) => {
  res.sendFile(path.join(__dirname, 'data-deletion.html'));
});
app.get('/app-icon', (req, res) => {
  res.sendFile(path.join(__dirname, 'app-icon-1024.png'));
});
app.get('/logo', (req, res) => {
  res.sendFile(path.join(__dirname, 'logo.jpg'));
});
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'manifest.json'));
});
app.get('/sw.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'sw.js'));
});

// ── Dashboard data API (for polling) ─────────────────────────────────────
app.get('/dashboard-data', (req, res) => {
  const convList = Object.values(conversations);
  res.json({
    count: convList.length,
    total: convList.reduce((s, c) => s + c.messages.length, 0),
    changes: convList.filter(c => new Date(c.lastSeen) > Date.now() - 16000).length
  });
});

// ── Conversations API ─────────────────────────────────────────────────────
app.get('/api/conversations', (req, res) => {
  const convList = Object.values(conversations);
  convList.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
  res.json(convList.map(c => ({
    name: c.name,
    phone: c.phone,
    messages: (c.messages || []).slice(-100),
    autoReplied: c.autoReplied,
    humanRequests: c.humanRequests
  })));
});

// ── Status endpoint ───────────────────────────────────────────────────────
app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    phoneNumberId: PHONE_NUMBER_ID,
    wabaId: process.env.WABA_ID,
    conversations: Object.keys(conversations).length,
    totalMessages: Object.values(conversations).reduce((sum, c) => sum + c.messages.length, 0)
  });
});

// ── SPA Dashboard — catch-all for non-API routes ──────────────────────────
app.use(express.static(path.join(__dirname, 'spa-dashboard')));
app.get(/^\/(?!api\/|status|send|privacy|terms|data|logo|manifest|sw|webhooks).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'spa-dashboard', 'index.html'));
});

// ── Start server ──────────────────────────────────────────────────────────
app.listen(PORT, '127.0.0.1', () => {
  log('INFO', 'INIT', `Server running on port ${PORT}`);
  log('INFO', 'INIT', `Phone Number ID: ${PHONE_NUMBER_ID}`);
  log('INFO', 'INIT', `Webhook: https://whatsapp.autoeffortless.com/webhooks/whatsapp`);
  log('INFO', 'INIT', `Status: http://localhost:${PORT}/status`);
});
