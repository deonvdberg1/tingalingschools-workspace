// AutoEffortless AI Assistant v6 — Multi-Client
// Uses DeepSeek via OpenClaw Gateway with per-client knowledge bases
// Accepts client context so each business gets its own AI personality

const http = require('http');
const fs = require('fs');
const path = require('path');

const GATEWAY_URL = 'http://localhost:18789/v1/chat/completions';
const MODEL = 'openclaw/default';
const BACKEND_MODEL = 'deepseek/deepseek-v4-flash';

// ── Conversation memory (persisted to disk) ──────────────────────────────────
const AI_CONV_FILE = path.join(__dirname, 'ai-conversations.json');
const MAX_HISTORY = 20;

function loadAIConversations() {
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

function saveAIConversations() {
  try {
    const obj = {};
    for (const [key, val] of conversations) {
      obj[key] = val;
    }
    fs.writeFileSync(AI_CONV_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    console.error('[AI] Failed to save conversation history:', e.message);
  }
}

const conversations = loadAIConversations();

function getHistory(phone) {
  if (!conversations.has(phone)) conversations.set(phone, []);
  return conversations.get(phone);
}

// ── System prompt builder — fully dynamic per client ──────────────────────
function buildSystemPrompt(clientContext) {
  const name = clientContext?.clientName || 'our business';
  const email = clientContext?.contactEmail || '';
  const phone = clientContext?.contactPhone || '';
  const kb = clientContext?.knowledge_base || '';
  const type = clientContext?.clientType || 'business';

  // Extract just the knowledge content (exclude AI rules section if present)
  const kbMatch = kb.match(/## ⚙️ AI ASSISTANT RULES/);
  const cleanKb = kbMatch ? kb.substring(0, kbMatch.index) : kb;

  return `You are the AI assistant for ${name}.

## ABSOLUTE RULES (every response MUST follow these):
1. You have NO knowledge other than what is written below in the KNOWLEDGE section below.
2. READ the KNOWLEDGE section for EVERY response. Only answer from the text below.
3. Never add commentary like "I wish I had" or "unfortunately" or "I hear you" or "I understand".
4. If the KNOWLEDGE section does not contain the answer, say: "I don't have that specific information. Please contact ${name} at ${email || 'the office'}, ${phone || ''} during office hours and they'll be happy to help."
5. Keep responses brief — 2 to 3 sentences maximum.
6. Use South African English.
7. Never make up phone numbers, addresses, amounts, or any details.
8. If a person asks to speak to a human or sounds frustrated: give them the contact info.
9. Use emojis sparingly (one per message maximum).
10. Never address anyone by name unless they tell you their name first.

## KNOWLEDGE
${cleanKb || 'No specific knowledge base provided. Please direct queries to the contact information above.'}`;
}

function callDeepSeek(messages) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      model: MODEL,
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
        'x-openclaw-model': BACKEND_MODEL,
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

function buildMessages(phone, message, clientContext) {
  const history = getHistory(phone);
  const msgs = [{ role: 'system', content: buildSystemPrompt(clientContext) }];

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

  if (!clientContext) {
    console.error('[AI] No client context provided — cannot generate response');
    return null;
  }

  const messages = buildMessages(fromNumber, messageText, clientContext);
  const reply = await callDeepSeek(messages);

  if (reply && reply.length > 0) {
    const history = getHistory(fromNumber);
    history.push({ role: 'user', content: messageText });
    history.push({ role: 'assistant', content: reply });
    if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
    saveAIConversations();
    return { text: reply, type: 'text', source: 'ai' };
  }

  return null;
}

module.exports = { getAIAutoReply };
