require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

// ── Config ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'tingaling-verify';

const META_API = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;

// ── In-memory conversation log (will upgrade to storage later) ─────────────
const conversations = {};
const MAX_CONV_LOG = 50;

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

// ── Dashboard: View conversations ─────────────────────────────────────────
app.get('/dashboard', (req, res) => {
  const convList = Object.values(conversations);
  convList.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));

  let html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Ting-A-Ling WhatsApp Dashboard</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f5; padding: 20px; }
      h1 { color: #1a1a2e; margin-bottom: 8px; }
      .subtitle { color: #666; margin-bottom: 20px; }
      .stats { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
      .stat-card { background: white; border-radius: 10px; padding: 16px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); flex: 1; min-width: 120px; }
      .stat-card h3 { font-size: 14px; color: #666; margin-bottom: 4px; }
      .stat-card .num { font-size: 28px; font-weight: bold; color: #1a1a2e; }
      .conversation { background: white; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 12px; overflow: hidden; }
      .conv-header { padding: 14px 18px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
      .conv-header h3 { font-size: 16px; color: #1a1a2e; }
      .conv-header .meta { font-size: 12px; color: #888; }
      .conv-messages { padding: 14px 18px; }
      .msg { margin-bottom: 10px; padding: 10px 14px; border-radius: 8px; max-width: 80%; }
      .msg.in { background: #e3f2fd; margin-right: auto; }
      .msg.out { background: #dcf8c6; margin-left: auto; }
      .msg .sender { font-size: 11px; color: #888; margin-bottom: 3px; }
      .msg .time { font-size: 10px; color: #aaa; margin-top: 4px; text-align: right; }
      .human-badge { background: #fff3cd; color: #856404; font-size: 11px; padding: 2px 8px; border-radius: 4px; }
      .auto-badge { background: #d1e7dd; color: #0f5132; font-size: 11px; padding: 2px 8px; border-radius: 4px; }
    </style>
  </head>
  <body>
    <h1>📊 Ting-A-Ling WhatsApp</h1>
    <p class="subtitle">Real-time conversation dashboard</p>
    <div class="stats">
      <div class="stat-card">
        <h3>Total Conversations</h3>
        <div class="num">${convList.length}</div>
      </div>
      <div class="stat-card">
        <h3>Auto-Replied</h3>
        <div class="num">${convList.reduce((sum, c) => sum + c.autoReplied, 0)}</div>
      </div>
      <div class="stat-card">
        <h3>Human Requests</h3>
        <div class="num">${convList.reduce((sum, c) => sum + c.humanRequests, 0)}</div>
      </div>
    </div>
    ${convList.length === 0 ? '<p style="color:#888;text-align:center;padding:40px;">No conversations yet. Waiting for parents to message...</p>' : ''}
    ${convList.map(conv => {
      const lastMsg = conv.messages[conv.messages.length - 1];
      const lastTime = lastMsg ? new Date(lastMsg.timestamp).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' }) : '';
      return `
      <div class="conversation">
        <div class="conv-header">
          <div>
            <h3>${conv.name}</h3>
            <div class="meta">${conv.phone} • ${lastTime}</div>
          </div>
          <div>
            ${conv.humanRequests > 0 ? '<span class="human-badge">Needs human</span>' : '<span class="auto-badge">Auto-replied</span>'}
          </div>
        </div>
        <div class="conv-messages">
          ${conv.messages.slice(-6).map(m => `
            <div class="msg ${m.direction}">
              <div class="sender">${m.direction === 'in' ? conv.name : 'Ting-A-Ling Bot'}</div>
              ${m.text}
              <div class="time">${new Date(m.timestamp).toLocaleTimeString('en-ZA', { timeZone: 'Africa/Johannesburg' })}</div>
            </div>
          `).join('')}
        </div>
      </div>`;
    }).join('')}
  </body>
  </html>`;

  res.send(html);
});

// ── Meta App Review Pages ───────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

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
