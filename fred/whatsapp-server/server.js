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
const REQUIRED_ENV = ['WHATSAPP_TOKEN', 'PHONE_NUMBER_ID', 'BOT_PHONE_NUMBER', 'APP_ID', 'APP_SECRET'];
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
  let line;
  if (data) {
    line = `${prefix} ${message} ${typeof data === 'object' ? JSON.stringify(data).substring(0, 200) : data}\n`;
  } else {
    line = `${prefix} ${message}\n`;
  }
  // Use writeSync to bypass Node.js stdout buffering (critical when stdout is a file via LaunchAgent)
  try {
    const fs = require('fs');
    fs.writeSync(process.stdout.fd, line);
  } catch (e) {
    // Fallback if writeSync fails
    console.log(line.trim());
  }
}

// ── Config ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.WHATSAPP_TOKEN;
const DEFAULT_PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'tingaling-verify';

// Admin numbers
const ADMIN_NUMBERS = new Set([
  '27615274429',  // Mr D
]);

// Handoff forwarding — who gets notified when AI can't answer
const HANDOFF_NUMBER = '27615274429'; // Mr D (configurable)

function getMetaApi(phoneNumberId) {
  const pni = phoneNumberId || DEFAULT_PHONE_NUMBER_ID;
  return `https://graph.facebook.com/v22.0/${pni}/messages`;
}

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
const MAX_CONV_LOG = 500;

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

// ── POPIA: Data deletion & retention ─────────────────────────────────────
const DATA_RETENTION_DAYS = 90; // Auto-delete conversations older than this

function deleteConversation(phone) {
  const clean = phone.replace(/[^0-9]/g, '');
  const found = Object.keys(conversations).find(k => k.replace(/[^0-9]/g, '') === clean);
  if (found) {
    delete conversations[found];
    saveConversations();
    log('INFO', 'POPIA', `Deleted conversation for ${clean}`);
  }
}

function expireOldConversations() {
  const cutoff = Date.now() - (DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  let expired = 0;
  for (const [key, conv] of Object.entries(conversations)) {
    const lastSeen = new Date(conv.lastSeen || 0).getTime();
    if (lastSeen > 0 && lastSeen < cutoff) {
      delete conversations[key];
      expired++;
    }
  }
  if (expired > 0) {
    saveConversations();
    log('INFO', 'POPIA', `Auto-expired ${expired} conversations older than ${DATA_RETENTION_DAYS} days`);
  }
}

// Run expiry check every 6 hours
setInterval(expireOldConversations, 6 * 60 * 60 * 1000);
// Also run once on startup
expireOldConversations();

// 14. Periodic auto-save every 30 seconds (safety net for crash recovery)
setInterval(saveConversations, 30 * 1000);

// ── Client cache (phone → client resolution) ──────────────────────────────
const DASHBOARD_API = 'http://localhost:3001';

async function resolveClient(senderNumber) {
  // First try: look up the bot's own phone number (the WhatsApp number assigned to the client)
  try {
    const res = await fetch(`${DASHBOARD_API}/api/phone-lookup/${process.env.BOT_PHONE_NUMBER}`);
    if (res.ok) {
      const data = await res.json();
      return {
        clientId: data.client_id,
        clientName: data.client_name,
        aiEnabled: data.ai_enabled,
        agentId: data.agent_id,
        contactPhone: data.contact_phone,
        contactEmail: data.contact_email,
        phoneNumberId: data.phone_number_id || DEFAULT_PHONE_NUMBER_ID,
        wabaId: data.waba_id || process.env.WABA_ID,
        wabaStatus: data.waba_status || '',
      };
    }
  } catch (e) {
    log('ERROR', 'CLIENT', 'Failed to resolve client for number', e.message);
  }
  
  // Fallback: try sender's number (for admin/manual testing)
  try {
    const res = await fetch(`${DASHBOARD_API}/api/phone-lookup/${senderNumber}`);
    if (res.ok) {
      const data = await res.json();
      return {
        clientId: data.client_id,
        clientName: data.client_name,
        aiEnabled: data.ai_enabled,
        agentId: data.agent_id,
        contactPhone: data.contact_phone,
        contactEmail: data.contact_email,
        phoneNumberId: data.phone_number_id || DEFAULT_PHONE_NUMBER_ID,
        wabaId: data.waba_id || process.env.WABA_ID,
        wabaStatus: data.waba_status || '',
      };
    }
  } catch {}
  
  return null;
}

let cachedTemplates = null;
let cacheTime = 0;
const CACHE_TTL = 30000; // 30 seconds

async function fetchTemplates(clientId) {
  const now = Date.now();
  if (cachedTemplates && now - cacheTime < CACHE_TTL) {
    return cachedTemplates;
  }
  try {
    const res = await fetch(`${DASHBOARD_API}/api/clients/${clientId}/templates`);
    if (res.ok) {
      cachedTemplates = await res.json();
      cacheTime = now;
      return cachedTemplates;
    }
  } catch {}
  return cachedTemplates || [];
}


// ── Smart auto-reply: AI-first, simple contact fallback ────────────────────
async function getAutoReply(messageText, fromNumber) {
  const msg = (messageText || '').toLowerCase().trim();

  // POPIA: Data deletion request (MUST be before opt-out — data right supersedes marketing)
  if (/^delete.?my.?data$|^erase|^remove.?my.?data$/i.test(msg)) {
    const cleanNumber = (fromNumber || '').replace(/[^0-9]/g, '');
    deleteConversation(cleanNumber);
    log('INFO', 'POPIA', `Data deletion requested for ${cleanNumber}`);
    return { text: 'Your conversation history and personal information have been deleted from our systems. If you have further questions, please contact the school office directly.', type: 'text' };
  }

  // Opt-out (MUST be early — Meta policy)
  if (/^stop$|^unsubscribe$|^opt.?out$|^cancel$/i.test(msg)) {
    return { text: '✅ You have been unsubscribed.\n\nSend "START" to reactivate.', type: 'text' };
  }
  if (/^start$|^resubscribe$|^opt.?in$/i.test(msg)) {
    return { text: '✅ You have been resubscribed. Welcome back!', type: 'text' };
  }

  // Step 0: Resolve which client this message belongs to
  const cleanNumber = (fromNumber || '').replace(/[^0-9]/g, '');
  const client = await resolveClient(cleanNumber);
  
  if (!client) {
    log('WARN', 'AUTO', `No client found for sender ${cleanNumber}`);
    return null;
  }
  
  log('INFO', 'AUTO', `Resolved sender ${cleanNumber} → ${client.clientName} (ID: ${client.clientId})`);

  // Step 1: Route to AI agent first (this is what clients are paying for)
  const isAdmin = ADMIN_NUMBERS.has(cleanNumber);
  
  if (client.aiEnabled || isAdmin) {
    const aiReply = await getAIAutoReply(messageText, fromNumber, client);
    if (aiReply) {
      log('INFO', 'AUTO', `AI response for ${client.clientName} (via ${client.agentId})`);
      return aiReply;
    }
  }

  // Step 2: Fall back to simple contact-info template if AI unavailable
  // (No keyword matching — just a generic "reach us here" message)
  const fallbackTemplates = await fetchTemplates(client.clientId);
  const greeting = (fallbackTemplates || []).find(t => t.category?.toLowerCase() === 'general');
  if (greeting) {
    return { text: greeting.content, type: 'text' };
  }

  return null;
}

// ── Send Message via WhatsApp API ─────────────────────────────────────────
// Supports optional phoneNumberId for per-client routing (Option 3/BSP model)
// Falls back to DEFAULT_PHONE_NUMBER_ID from .env when not specified
async function sendWhatsAppMessage(to, messageObj, phoneNumberId) {
  const apiUrl = getMetaApi(phoneNumberId);
  try {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: messageObj.type,
      [messageObj.type]: { body: messageObj.text }
    };

    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    log('INFO', 'SEND', `To: ${to} | PNI: ${phoneNumberId || 'default'} | Type: ${messageObj.type}`);
    return response.data;
  } catch (error) {
    log('ERROR', 'SEND', `To: ${to} | PNI: ${phoneNumberId || 'default'} | Failed`, error.response?.data || error.message);
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
  
  // Async: sync to dashboard SQLite for permanent storage
  syncToDashboard(from, name, message, reply);
}

// ── Sync each message to dashboard API SQLite (non-blocking) ────────────
const DASHBOARD_SYNC_URL = 'http://localhost:3001/api/messages/sync';

function syncToDashboard(from, name, message, reply) {
  // Fire and forget — don't block message processing
  const clientPromise = resolveClient(from).catch(() => null);
  
  clientPromise.then(client => {
    const clientId = client?.clientId || null;
    const timestamp = new Date().toISOString();
    
    // Sync inbound message
    const inboundPayload = {
      client_id: clientId,
      phone: from,
      name: name || 'Unknown',
      direction: 'in',
      text: message || '',
      timestamp
    };
    
    fetch(DASHBOARD_SYNC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inboundPayload)
    }).catch(err => {
      log('WARN', 'SYNC', 'Failed to sync inbound message', err.message);
    });
    
    // Sync outbound reply
    if (reply) {
      const outboundPayload = {
        client_id: clientId,
        phone: from,
        name: name || 'Unknown',
        direction: 'out',
        text: reply.text || '',
        timestamp
      };
      
      fetch(DASHBOARD_SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(outboundPayload)
      }).catch(err => {
        log('WARN', 'SYNC', 'Failed to sync outbound message', err.message);
      });
    }
  }).catch(() => {});
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
      const errDetail = (st.errors && st.errors.length > 0)
        ? ` | Err: ${st.errors.map(e => `${e.code}:${e.title}`).join(', ')}`
        : '';
      log('INFO', 'STATUS', `${st.status} | To: ${st.recipient_id} | Msg: ${(st.id || '').substring(0, 30)}${errDetail}`);
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
        // Look up client to determine which phone_number_id to send from
        const cleanFrom = (from || '').replace(/[^0-9]/g, '');
        const replyClient = await resolveClient(cleanFrom);
        await sendWhatsAppMessage(from, reply, replyClient?.phoneNumberId);
      } else {
        // 3. Human handoff — notify admin when AI can't answer
        const clientForFallback = await resolveClient((from || '').replace(/[^0-9]/g, ''));
        const fallbackMsg = clientForFallback
          ? `Thank you for your message 🙏\n\nYour enquiry has been noted and a member of the ${clientForFallback.clientName} team will get back to you during office hours.\n\nFor urgent matters, please call ${clientForFallback.contactPhone || 'the office'}.`
          : `Thank you for your message 🙏\n\nYour enquiry has been noted. A team member will get back to you shortly.`;
        await sendWhatsAppMessage(from, { text: fallbackMsg, type: 'text' }, clientForFallback?.phoneNumberId);
        log('INFO', 'HUMAN', `Forwarding ${from} to manual handling`);
        
        // Forward the parent's message to the handoff number
        await sendWhatsAppMessage(HANDOFF_NUMBER, {
          text: `🔔 *Human handoff required*\n\nFrom: ${name} (${from})\nMessage: "${text.substring(0, 200)}"\n\nReply to this number to respond to the parent.`,
          type: 'text'
        });
        log('INFO', 'HANDOFF', `Forwarded ${from} to ${HANDOFF_NUMBER}`);
      }
    } else {
      // Non-text message types — reply with a friendly hint
      const typeLabels = { image: 'an image', audio: 'a voice note', voice: 'a voice note', video: 'a video', document: 'a document' };
      const typeLabel = typeLabels[msg.type] || 'a message';
      log('INFO', 'IN', `${name} (${from}) sent ${typeLabel} — hint sent`);
      await sendWhatsAppMessage(from, {
        text: `Thanks for sending ${typeLabel} 😊 I can only read text messages at the moment. If you have a question, please type it out and I'll be happy to help!`,
        type: 'text'
      });
    }
  }
});

// ── POPIA: Data deletion API (for web-based requests) ────────────────────
app.post('/api/delete-data', express.json(), (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });
  deleteConversation(phone);
  res.json({ success: true, message: 'Your data has been deleted.' });
});

// ── POPIA: Data export (user requests their data) ─────────────────────────
app.post('/api/export-data', express.json(), (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });
  
  const clean = phone.replace(/[^0-9]/g, '');
  const conv = Object.entries(conversations).find(([k]) => k.replace(/[^0-9]/g, '') === clean);
  
  if (!conv) return res.json({ data: null, message: 'No data found for this number' });
  
  res.json({
    data: conv[1],
    message: 'This is your conversation data. It will be deleted after 90 days of inactivity.'
  });
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
    messages: (c.messages || []).slice(-500),
    autoReplied: c.autoReplied,
    humanRequests: c.humanRequests
  })));
});

// ── Status endpoint ───────────────────────────────────────────────────────
app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    phoneNumberId: DEFAULT_PHONE_NUMBER_ID,
    wabaId: process.env.WABA_ID,
    conversations: Object.keys(conversations).length,
    totalMessages: Object.values(conversations).reduce((sum, c) => sum + c.messages.length, 0)
  });
});

// ── Today's metrics ───────────────────────────────────────────────────────
app.get('/api/metrics/today', (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.toISOString();
  
  let todayMessages = 0;
  let todayAuto = 0;
  let todayHuman = 0;
  
  for (const conv of Object.values(conversations)) {
    for (const msg of (conv.messages || [])) {
      if (msg.timestamp >= todayTs) {
        todayMessages++;
        if (msg.direction === 'out') todayAuto++;
        else todayHuman++;
      }
    }
  }
  
  res.json({
    today_messages: todayMessages,
    today_auto_replies: todayAuto,
    today_human_requests: todayHuman,
    auto_reply_rate: todayMessages > 0 ? Math.round((todayAuto / todayMessages) * 100) : 0,
    active_conversations: Object.keys(conversations).length,
  });
});

// ── Dashboard API proxy — forward dashboard API routes to port 3001 ─────
// This lets the SPA work when accessed via autoeffortless.com (port 3000)
const http = require('http');

app.use('/api', (req, res, next) => {
  // Skip routes that the WhatsApp server handles locally
  if (req.path.startsWith('/api/conversations') && req.method === 'GET') return next();
  if (req.path.startsWith('/api/metrics')) return next();
  if (req.path.startsWith('/api/delete-data')) return next();
  if (req.path.startsWith('/api/export-data')) return next();
  
  // Proxy everything else to the dashboard API
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: req.originalUrl,
    method: req.method,
    headers: { ...req.headers, host: 'localhost:3001' }
  };
  
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    log('ERROR', 'PROXY', `Dashboard API proxy error: ${err.message}`);
    res.status(502).json({ error: 'Dashboard API unavailable' });
  });
  
  req.pipe(proxyReq);
});

// ── SPA Dashboard — catch-all for non-API routes ──────────────────────────
app.use(express.static(path.join(__dirname, 'spa-dashboard')));
app.get(/^\/(?!api\/|status|send|privacy|terms|data|logo|manifest|sw|webhooks).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'spa-dashboard', 'index.html'));
});

// ── Start server ──────────────────────────────────────────────────────────
app.listen(PORT, '127.0.0.1', () => {
  log('INFO', 'INIT', `Server running on port ${PORT}`);
  log('INFO', 'INIT', `Default Phone Number ID: ${DEFAULT_PHONE_NUMBER_ID}`);
  log('INFO', 'INIT', `Webhook: https://whatsapp.autoeffortless.com/webhooks/whatsapp`);
  log('INFO', 'INIT', `Status: http://localhost:${PORT}/status`);
});
