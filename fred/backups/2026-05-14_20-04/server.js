require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
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

// ── Ting-A-Ling auto-reply rules ──────────────────────────────────────────
function getAutoReply(messageText) {
  const msg = (messageText || '').toLowerCase().trim();

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

  if (!messages || messages.length === 0) {
    console.log('[WEBHOOK] No messages in this update (status update probably)');
    return;
  }

  for (const msg of messages) {
    const from = msg.from; // sender phone number
    const contact = contacts?.[0];
    const name = contact?.profile?.name || 'Unknown';

    // Only handle text messages for now
    if (msg.type === 'text') {
      const text = msg.text.body;
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

app.get('/dashboard', (req, res) => {
  const convList = Object.values(conversations);
  convList.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));

  const totalMsgs = convList.reduce((s, c) => s + c.messages.length, 0);
  const humanReqs = convList.reduce((s, c) => s + c.humanRequests, 0);

  let html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Ting-A-Ling Schools — WhatsApp Communication</title>
    <link rel="manifest" href="/manifest.json">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Ting-A-Ling">
    <meta name="theme-color" content="#0d9488">
    <style>
      :root { --primary: #0d9488; --primary-light: #14b8a6; --primary-dark: #0f766e; --bg: #f8fafc; --sidebar-bg: #fff; --text: #0f172a; --text-muted: #64748b; --border: #e2e8f0; --green: #10b981; --amber: #f59e0b; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif; background: var(--bg); color: var(--text); height: 100vh; overflow: hidden; }
      
      .app { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
      
      /* ── Top navigation ── */
      .nav { background: var(--primary); color: #fff; padding: 0 24px; display: flex; align-items: center; height: 56px; flex-shrink: 0; gap: 16px; }
      .nav h1 { font-size: 17px; font-weight: 600; letter-spacing: -0.2px; }
      .nav .badge { background: rgba(255,255,255,0.15); padding: 4px 12px; border-radius: 20px; font-size: 12px; }
      .nav .spacer { flex: 1; }
      .nav .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block; margin-right: 6px; }
      .nav .meta-info { font-size: 12px; opacity: 0.8; }
      
      /* ── Layout ── */
      .layout { display: flex; flex: 1; overflow: hidden; min-height: 0; }
      
      /* ── Sidebar ── */
      .sidebar { width: 360px; min-width: 360px; background: var(--sidebar-bg); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
      .sidebar-stats { display: flex; padding: 14px 18px; gap: 16px; border-bottom: 1px solid var(--border); }
      .stat-item { flex: 1; }
      .stat-item .num { font-size: 20px; font-weight: 700; color: var(--primary); }
      .stat-item .label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
      .search-bar { padding: 10px 18px; }
      .search-bar input { width: 100%; padding: 9px 14px; border: 1px solid var(--border); border-radius: 8px; font-size: 13px; outline: none; background: var(--bg); }
      .search-bar input:focus { border-color: var(--primary-light); }
      
      .conv-list { flex: 1; overflow-y: auto; }
      .conv-item { padding: 14px 18px; border-bottom: 1px solid #f3f4f6; cursor: pointer; display: flex; gap: 14px; align-items: center; transition: background 0.1s; }
      .conv-item:hover { background: #f9fafb; }
      .conv-item.active { background: #eef2ff; border-left: 3px solid var(--primary); }
      .conv-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 600; flex-shrink: 0; }
      .conv-info { flex: 1; min-width: 0; }
      .conv-name { font-size: 14px; font-weight: 600; color: var(--text); }
      .conv-preview { font-size: 13px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 3px; }
      .conv-meta { text-align: right; flex-shrink: 0; }
      .conv-time { font-size: 11px; color: var(--text-muted); }
      .conv-tag { font-size: 10px; padding: 2px 8px; border-radius: 10px; margin-top: 4px; display: inline-block; font-weight: 500; }
      .conv-tag.bot { background: #dbeafe; color: #1d4ed8; }
      .conv-tag.human { background: #fef3c7; color: #92400e; }
      
      .empty-sidebar { padding: 60px 30px; text-align: center; color: var(--text-muted); }
      .empty-sidebar .icon { font-size: 40px; margin-bottom: 12px; }
      .empty-sidebar p { font-size: 13px; line-height: 1.5; }
      
      /* ── Main panel ── */
      .main { flex: 1; display: flex; flex-direction: column; background: var(--bg); min-height: 0; }
      
      .empty-main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; text-align: center; }
      .empty-main .icon { font-size: 48px; margin-bottom: 16px; opacity: 0.4; }
      .empty-main h2 { font-size: 18px; color: var(--text); margin-bottom: 8px; }
      .empty-main p { font-size: 13px; color: var(--text-muted); max-width: 380px; line-height: 1.6; }
      
      /* ── Chat panel ── */
      .chat-panel { flex: 1; display: none; flex-direction: column; min-height: 0; }
      .chat-header { padding: 14px 20px; background: #fff; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
      .chat-header .back { display: none; cursor: pointer; font-size: 20px; color: var(--text-muted); text-decoration: none; }
      .chat-header .name { font-size: 15px; font-weight: 600; }
      .chat-header .phone { font-size: 12px; color: var(--text-muted); }
      
      .chat-msgs { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 20px 24px; position: relative; min-height: 0; -webkit-overflow-scrolling: touch; }
      .scroll-btn { position: absolute; bottom: 20px; right: 30px; width: 40px; height: 40px; border-radius: 50%; background: var(--primary); color: #fff; border: none; font-size: 18px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2); display: none; align-items: center; justify-content: center; z-index: 10; transition: opacity 0.2s; }
      .scroll-btn:hover { background: var(--primary-light); }
      .scroll-btn.visible { display: flex; }
      .msg { margin-bottom: 10px; padding: 10px 16px; border-radius: 12px; max-width: 70%; font-size: 14px; line-height: 1.45; word-wrap: break-word; position: relative; }
      .msg.in { background: #fff; margin-right: auto; border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
      .msg.out { background: #dbeafe; margin-left: auto; border-bottom-right-radius: 4px; }
      .msg .time { font-size: 10px; color: var(--text-muted); text-align: right; margin-top: 6px; }
      .msg .sender-label { font-size: 11px; font-weight: 600; color: var(--primary); margin-bottom: 3px; }
      .msg.out .sender-label { color: #1d4ed8; }
      
      .chat-input { padding: 14px 20px; background: #fff; border-top: 1px solid var(--border); display: flex; gap: 10px; align-items: flex-end; }
      .chat-input textarea { flex: 1; padding: 10px 16px; border: 1px solid var(--border); border-radius: 10px; font-size: 14px; font-family: inherit; outline: none; resize: none; max-height: 100px; line-height: 1.4; }
      .chat-input textarea:focus { border-color: var(--primary-light); }
      .chat-input button { background: var(--primary); color: #fff; border: none; width: 42px; height: 42px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.15s; }
      .chat-input button:hover { background: var(--primary-light); }
      
      /* ── Toast ── */
      .toast { position: fixed; bottom: 24px; right: 24px; background: var(--text); color: #fff; padding: 12px 20px; border-radius: 10px; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transform: translateY(80px); opacity: 0; transition: 0.3s; }
      .toast.show { transform: translateY(0); opacity: 1; }
      .toast.success { background: #065f46; }
      .toast.error { background: #991b1b; }
      
      /* ── Responsive ── */
      @media (max-width: 768px) {
        .sidebar { width: 100%; min-width: 100%; }
        .main { display: none; }
        body.show-chat .sidebar { display: none; }
        body.show-chat .main { display: flex; }
        .chat-header .back { display: inline-flex !important; }
        .chat-msgs { padding: 16px; }
        .msg { max-width: 85%; }
      }
    </style>
  </head>
  <body>
    <div class="app">
      <!-- Nav -->
      <div class="nav">
        <img src="/logo" style="height:32px;width:32px;border-radius:6px;object-fit:cover;flex-shrink:0;">
        <div>
          <div style="font-size:15px;font-weight:600;">Ting-A-Ling Schools</div>
          <div style="font-size:10px;opacity:0.8;margin-top:-1px;">WhatsApp Communication</div>
        </div>
        <div class="spacer"></div>
        <span class="meta-info"><span class="status-dot"></span>${humanReqs > 0 ? humanReqs + ' need reply' : 'All caught up'}</span>
      </div>
      
      <div class="layout">
        <!-- Sidebar -->
        <div class="sidebar">
          <div class="sidebar-stats">
            <div class="stat-item"><div class="num">${convList.length}</div><div class="label">Chats</div></div>
            <div class="stat-item"><div class="num">${totalMsgs}</div><div class="label">Messages</div></div>
            <div class="stat-item"><div class="num">${humanReqs}</div><div class="label">Awaiting You</div></div>
            <div style="display:flex;align-items:center;">
              <button onclick="newConversation()" style="background:var(--primary);color:#fff;border:none;width:32px;height:32px;border-radius:8px;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;" title="New Conversation">+</button>
            </div>
          </div>
          
          <div class="search-bar">
            <input type="text" placeholder="Search conversations or phone number..." oninput="filterConvs(this.value)">
          </div>
          
          <div class="conv-list" id="convList">
            ${convList.length === 0 ? `
            <div class="empty-sidebar">
              <div class="icon">💬</div>
              <p><strong>No conversations yet</strong><br>When parents message the Ting-A-Ling number, their chats will appear here.</p>
            </div>` : ''}
            ${convList.map((conv, idx) => {
              const lastMsg = conv.messages[conv.messages.length - 1];
              const needsHuman = conv.humanRequests > conv.autoReplied;
              return `
            <div class="conv-item" data-idx="${idx}" onclick="showChat(${idx})">
              <div class="conv-avatar">${(conv.name !== 'Unknown' ? conv.name : conv.phone)[0].toUpperCase()}</div>
              <div class="conv-info">
                <div class="conv-name">${conv.name !== 'Unknown' ? conv.name : 'Parent (' + conv.phone + ')'}</div>
                <div class="conv-preview">${lastMsg ? (lastMsg.direction === 'out' ? 'You: ' : '') + (lastMsg.text || '').substring(0, 50) + (lastMsg.text?.length > 50 ? '...' : '') : ''}</div>
              </div>
              <div class="conv-meta">
                <div class="conv-time">${lastMsg ? new Date(lastMsg.timestamp).toLocaleString('en-ZA', { month: 'short', day: 'numeric' }) : ''}</div>
                <span class="conv-tag ${needsHuman ? 'human' : 'bot'}">${needsHuman ? 'You' : 'Auto'}</span>
              </div>
            </div>`;
            }).join('')}
          </div>
        </div>
        
        <!-- Main -->
        <div class="main" id="mainPanel">
          <div class="empty-main" id="emptyMain">
            <div class="icon">📱</div>
            <h2>Ting-A-Ling Schools</h2>
            <p>Your WhatsApp messages will appear here. Select a conversation from the sidebar to view and reply, or use the send form below.</p>
            <div style="margin-top:24px;background:#fff;border:1px solid var(--border);border-radius:12px;padding:20px;width:100%;max-width:400px;text-align:left;">
              <h3 style="font-size:14px;margin-bottom:12px;color:var(--text);">✏️ Send a Message</h3>
              <input type="tel" id="phoneInput" placeholder="Phone number (e.g. 27615274429)" style="width:100%;padding:9px 14px;border:1px solid var(--border);border-radius:8px;font-size:13px;margin-bottom:8px;outline:none;">
              <textarea id="msgInput" rows="2" placeholder="Type your message..." style="width:100%;padding:9px 14px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:inherit;outline:none;resize:none;margin-bottom:8px;"></textarea>
              <button onclick="sendMsg()" style="background:var(--primary);color:#fff;border:none;padding:9px 18px;border-radius:8px;font-size:13px;cursor:pointer;width:100%;font-weight:500;">Send as Ting-A-Ling</button>
              <div id="sendStatus" style="font-size:12px;color:var(--text-muted);text-align:center;margin-top:6px;"></div>
            </div>
          </div>
          
          <div class="chat-panel" id="chatPanel">
            <div class="chat-header">
              <a href="#" class="back" id="backBtn" onclick="backToSidebar()">←</a>
              <div class="conv-avatar" id="chatAvatar" style="width:38px;height:38px;font-size:15px;">?</div>
              <div>
                <div class="name" id="chatName">Name</div>
                <div class="phone" id="chatPhone">Phone</div>
              </div>
            </div>
            <div class="chat-msgs" id="chatMsgs">
              <button class="scroll-btn" id="scrollBtn" onclick="scrollToBottom()">↓</button>
            </div>
            <div class="chat-input">
              <textarea id="replyInput" rows="1" placeholder="Type your reply..."
                onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendReply()}"></textarea>
              <button onclick="sendReply()" title="Send">➤</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="toast" id="toast"></div>
    
    <script>
    const convs = ${JSON.stringify(convList.map(c => ({
      name: c.name,
      phone: c.phone,
      messages: c.messages.slice(-50),
      autoReplied: c.autoReplied,
      humanRequests: c.humanRequests
    })))};
    let current = -1;
    
    function toast(text, type) {
      const t = document.getElementById('toast');
      t.textContent = text;
      t.className = 'toast ' + (type || '') + ' show';
      clearTimeout(t._timeout);
      t._timeout = setTimeout(() => t.classList.remove('show'), 2500);
    }
    
    function showChat(idx) {
      current = idx;
      const conv = convs[idx];
      document.getElementById('emptyMain').style.display = 'none';
      document.getElementById('chatPanel').style.display = 'flex';
      document.getElementById('backBtn').style.display = window.innerWidth <= 768 ? 'inline-flex' : 'none';
      document.getElementById('chatAvatar').textContent = (conv.name !== 'Unknown' ? conv.name : conv.phone)[0].toUpperCase();
      document.getElementById('chatName').textContent = conv.name !== 'Unknown' ? conv.name : 'Parent';
      document.getElementById('chatPhone').textContent = conv.phone;
      document.body.classList.add('show-chat');
      renderMsgs();
      
      // highlight active in sidebar
      document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('active'));
      document.querySelector('.conv-item[data-idx="' + idx + '"]')?.classList.add('active');
    }
    
    function backToSidebar() {
      document.getElementById('chatPanel').style.display = 'none';
      document.getElementById('emptyMain').style.display = 'flex';
      document.body.classList.remove('show-chat');
    }
    
    function renderMsgs() {
      const conv = convs[current];
      if (!conv) return;
      const el = document.getElementById('chatMsgs');
      el.innerHTML = conv.messages.map(m => {
        const isOut = m.direction === 'out';
        const time = new Date(m.timestamp).toLocaleString('en-ZA', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
        return '<div class="msg ' + (isOut ? 'out' : 'in') + '">' +
          '<div class="sender-label">' + (isOut ? 'Ting-A-Ling' : (conv.name !== 'Unknown' ? conv.name : 'Parent')) + '</div>' +
          '<div>' + m.text + '</div>' +
          '<div class="time">' + time + '</div></div>';
      }).join('');
      el.scrollTop = el.scrollHeight;
      
      // Scroll-to-bottom button detection
      el.addEventListener('scroll', function() {
        const btn = document.getElementById('scrollBtn');
        const isNearBottom = this.scrollHeight - this.scrollTop - this.clientHeight < 100;
        btn.classList.toggle('visible', !isNearBottom);
      });
    }
    
    function scrollToBottom() {
      const el = document.getElementById('chatMsgs');
      el.scrollTop = el.scrollHeight;
      document.getElementById('scrollBtn').classList.remove('visible');
    }
    
    function filterConvs(q) {
      q = q.toLowerCase();
      document.querySelectorAll('.conv-item').forEach(el => {
        const text = el.textContent.toLowerCase();
        el.style.display = !q || text.includes(q) ? 'flex' : 'none';
      });
    }
    
    function newConversation() {
      backToSidebar();
      // Focus the phone input after a brief delay
      setTimeout(() => {
        const el = document.getElementById('phoneInput');
        if (el) el.focus();
      }, 100);
    }
    
    async function sendMsg() {
      const phone = document.getElementById('phoneInput')?.value.trim();
      const msg = document.getElementById('msgInput')?.value.trim();
      if (!phone || !msg) { toast('Fill in both fields', 'error'); return; }
      const success = await doSend(phone, msg, document.getElementById('sendStatus'));
      if (success) {
        // Find and switch to the conversation
        const idx = convs.findIndex(c => c.phone === phone);
        if (idx >= 0) showChat(idx);
      }
    }
    
    async function sendReply() {
      const input = document.getElementById('replyInput');
      const msg = input.value.trim();
      if (!msg || current < 0) return;
      const phone = convs[current].phone;
      input.value = '';
      await doSend(phone, msg);
    }
    
    async function doSend(phone, msg, statusEl) {
      if (statusEl) statusEl.textContent = 'Sending...';
      try {
        const res = await fetch('/send', {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({to: phone, text: msg})
        });
        const data = await res.json();
        if (data.success) {
          toast('Message sent ✅', 'success');
          const now = new Date().toISOString();
          let conv = convs.find(c => c.phone === phone);
          if (!conv) {
            conv = { name: 'Parent', phone: phone, messages: [], autoReplied: 0, humanRequests: 0 };
            convs.push(conv);
          }
          conv.messages.push({ direction: 'out', text: msg, timestamp: now });
          if (current >= 0 && convs[current]?.phone === phone) {
            renderMsgs();
          }
          if (statusEl) statusEl.textContent = '';
          document.getElementById('msgInput')?.value && (document.getElementById('msgInput').value = '');
          document.getElementById('phoneInput')?.value && (document.getElementById('phoneInput').value = '');
          return true;
        } else {
          toast('Failed: ' + (data.error || 'Unknown error'), 'error');
          if (statusEl) statusEl.textContent = '❌ Failed';
          return false;
        }
      } catch(e) {
        toast('Network error', 'error');
        if (statusEl) statusEl.textContent = '❌ Network error';
        return false;
      }
    }
    
    // ── Smart background polling (no disruptive reload) ──
    let lastMsgCount = convs.reduce((s,c) => s + c.messages.length, 0);
    let lastConvCount = convs.length;
    
    async function pollUpdates() {
      try {
        const res = await fetch('/dashboard-data');
        const data = await res.json();
        if (data.count !== lastConvCount || data.total !== lastMsgCount) {
          location.reload();
        }
      } catch(e) {}
    }
    
    setInterval(pollUpdates, 12000);
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    </script>
  </body>
  </html>`;

  res.send(html);
});

// ── Meta App Review Pages ───────────────────────────────────────────────

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
