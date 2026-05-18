require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { generateDashboard } = require('./dashboard-v2.js');
const app = express();

// ── Config ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'tingaling-verify';

const META_API = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;

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
    console.error('[PERSIST] Failed to load conversations:', e.message);
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
    console.error('[PERSIST] Failed to save conversations:', e.message);
  }
}

// Load saved conversations on startup
const conversations = loadConversations();
const processed_messages = new Set();

// ── Ting-A-Ling auto-reply rules ──────────────────────────────────────────
function getAutoReply(messageText) {
  const msg = (messageText || '').toLowerCase().trim();

  // Opt-out handling (MUST be first — Meta policy requirement)
  if (/^stop$|^unsubscribe$|^opt.?out$|^cancel$/i.test(msg)) {
    return {
      text: `✅ You have been unsubscribed from Ting-A-Ling Schools WhatsApp messages. You will no longer receive statements or announcements.

If you change your mind, just send "START" and we'll reactivate your account.`,
      type: 'text'
    };
  }

  // Opt-in handling
  if (/^start$|^resubscribe$|^opt.?in$/i.test(msg)) {
    return {
      text: `✅ You have been resubscribed to Ting-A-Ling Schools WhatsApp messages. Welcome back!`,
      type: 'text'
    };
  }

  // Fees
  if (/fee|school fee|schoolfees|payment|cost|amount|how much|price|tariff/i.test(msg)) {
    return {
      text: `🏫 *Ting-A-Ling Schools - Fee Enquiry*\n\nFor current fee structures and payment options, please contact our admin office during school hours (07:30 - 15:30 weekdays).\n\n📞 035 XXX XXXX\n✉️ admin@tingaling.co.za\n\nAlternatively, tell us which class/grade your child is in and we'll have the relevant information sent to you.`,
      type: 'text'
    };
  }

  // Hours / Times
  if (/hour|time|open|close|when|operating|school day/i.test(msg)) {
    return {
      text: `⏰ *Ting-A-Ling Schools - Operating Hours*\n\n*School Day:* 07:30 - 14:00 (Mon-Fri)\n*Office:* 07:00 - 15:30 (Mon-Fri)\n*Aftercare:* Until 17:00\n\n*Holiday Programmes:* Available during school breaks — ask us for details!`,
      type: 'text'
    };
  }

  // Uniform
  if (/uniform|dress|clothes|wear|attire/i.test(msg)) {
    return {
      text: `👔 *Ting-A-Ling Schools - Uniform*\n\nUniforms are available from:\n• The school shop (Mondays & Thursdays, 07:30-09:00)\n• [Supplier Name], [Address]\n\nPlease visit the office for a full uniform list and pricelist.`,
      type: 'text'
    };
  }

  // Absentee / sick
  if (/absent|sick|missing|absentee|ill|not coming|leaving early/i.test(msg)) {
    return {
      text: `📋 *Ting-A-Ling Schools - Absentee Reporting*\n\nPlease call the school office to report your child's absence:\n📞 035 XXX XXXX\n\nAlternatively, send a message with your child's NAME, GRADE and REASON and we'll log it for the class teacher.`,
      type: 'text'
    };
  }

  // Events / calendar
  if (/event|calendar|sports|concert|function|parent.*meeting|sport/i.test(msg)) {
    return {
      text: `📅 *Ting-A-Ling Schools - Events & Calendar*\n\nUpcoming events are communicated via:\n• Parent WhatsApp groups\n• Weekly newsletter (sent every Friday)\n• Notice board at the school gate\n\nFor specific event info, please let us know which event you're asking about!`,
      type: 'text'
    };
  }

  // Contact / phone / address
  if (/contact|phone|number|address|where|lost|found/i.test(msg)) {
    return {
      text: `📍 *Ting-A-Ling Schools - Contact Details*\n\n📞 Office: 035 XXX XXXX\n✉️ Email: admin@tingaling.co.za\n📍 [School Address, Richards Bay]\n\nOffice Hours: 07:00 - 15:30 (Weekdays)`,
      type: 'text'
    };
  }

  // Registration / enrollment
  if (/register|enrol|admission|apply|new student|new learner|enrollment/i.test(msg)) {
    return {
      text: `📝 *Ting-A-Ling Schools - Enrolment*\n\nThank you for your interest! To enrol your child:\n\n1️⃣ Visit the school office (Mon-Fri, 08:00-14:00) for a registration pack\n2️⃣ Bring: Child's birth certificate, parent ID, latest report\n3️⃣ Pay the registration fee\n\nAlternatively, request a registration form and we'll email it to you.\n\n📞 035 XXX XXXX`,
      type: 'text'
    };
  }

  // General greeting
  if (/hi|hello|good morning|good afternoon|howdy|hey/i.test(msg)) {
    return {
      text: `👋 Welcome to *Ting-A-Ling Schools*!\n\nI'm here to help with common enquiries. Just ask me about:\n\n• 💰 Fees & payments\n• ⏰ School hours\n• 👔 Uniforms\n• 📋 Absentee reporting\n• 📅 Events & calendar\n• 📍 Contact details\n• 📝 Enrolment\n\nIf you need something else, a human will be with you shortly!`,
      type: 'text'
    };
  }

  // Default: hand off to human
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

    console.log(`[SENT] To: ${to} | Type: ${messageObj.type}`);
    return response.data;
  } catch (error) {
    console.error(`[SEND ERROR] To: ${to} |`, error.response?.data || error.message);
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

  console.log('[WEBHOOK VERIFY] Mode:', mode, 'Token:', token);

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WEBHOOK] Verified successfully');
    return res.status(200).send(challenge);
  }

  console.warn('[WEBHOOK] Verification failed — token mismatch');
  return res.sendStatus(403);
});

// ── Webhook: POST (Incoming messages) ─────────────────────────────────────
app.post('/webhooks/whatsapp', express.json(), async (req, res) => {
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
      console.log(`[STATUS] ${st.status} | To: ${st.recipient_id} | Msg: ${(st.id || '').substring(0, 30)}`);
    }
    return;
  }

  if (!messages || messages.length === 0) {
    console.log('[WEBHOOK] No messages or statuses in this update');
    return;
  }

  for (const msg of messages) {
    const from = msg.from; // sender phone number
    const contact = contacts?.[0];
    const name = contact?.profile?.name || 'Unknown';

    // Only handle text messages for now
    if (msg.type === 'text') {
      if (processed_messages.has(msg.id)) { continue; }
      processed_messages.add(msg.id);
      if (processed_messages.size > 1000) { processed_messages.clear(); }      const text = msg.text.body;
      const reply = getAutoReply(text);

      logConversation(from, name, text, reply);

      console.log(`[IN] From: ${name} (${from}) | "${text.substring(0, 60)}"` + (reply ? ' → Auto-replied' : ' → Needs human'));

      if (reply) {
        await sendWhatsAppMessage(from, reply);
      } else {
        // Send "we'll get back to you" for complex queries
        await sendWhatsAppMessage(from, {
          text: `Thank you for your message, ${name} 🙏\n\nYour enquiry has been noted and a member of the Ting-A-Ling team will get back to you during office hours (07:00 - 15:30, weekdays).\n\nFor urgent matters, please call the office on 035 XXX XXXX.`,
          type: 'text'
        });
        console.log(`[HUMAN] Forwarding ${from} to manual handling`);
      }
    }
  }
});

// ── Dashboard: View + Send messages ──────────────────────────────────────
app.post('/send', express.json(), async (req, res) => {
  const { to, text } = req.body;
  if (!to || !text) {
    return res.json({ success: false, error: 'Missing phone or message' });
  }
  
  // Clean the phone number
  let cleanNumber = to.replace(/[^0-9]/g, '');
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '27' + cleanNumber.slice(1);
  } else if (!cleanNumber.startsWith('27')) {
    cleanNumber = '27' + cleanNumber;
  }
  
  const result = await sendWhatsAppMessage(cleanNumber, { text, type: 'text' });
  if (result) {
    // Log the sent message
    logConversation(cleanNumber, 'Mr D (Dashboard)', text, null);
    res.json({ success: true, id: result.messages?.[0]?.id });
  } else {
    res.json({ success: false, error: 'API request failed' });
  }
});

// ── Dashboard v2 — Professional Redesign ──
app.get('/dashboard', (req, res) => {
  const convList = Object.values(conversations);
  convList.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));

  const totalMsgs = convList.reduce((s, c) => s + c.messages.length, 0);
  const humanReqs = convList.reduce((s, c) => s + c.humanRequests, 0);

  const html = generateDashboard(convList, totalMsgs, humanReqs);
  res.send(html);
});

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

// ── Dashboard data API (for background polling) ──────────────────────────
app.get('/dashboard-data', (req, res) => {
  const convList = Object.values(conversations);
  res.json({
    count: convList.length,
    total: convList.reduce((s, c) => s + c.messages.length, 0),
    changes: convList.filter(c => new Date(c.lastSeen) > Date.now() - 16000).length
  });
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

// ── Start server ──────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Ting-A-Ling WhatsApp Server running on port ${PORT}`);
  console.log(`📞 Phone Number ID: ${PHONE_NUMBER_ID}`);
  console.log(`🔗 Webhook URL: http://YOUR_IP:${PORT}/webhooks/whatsapp`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`ℹ️  Status: http://localhost:${PORT}/status`);
});
