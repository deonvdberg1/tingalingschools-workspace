// Ting-A-Ling AI Assistant v4
// Uses DeepSeek V4 Flash via OpenClaw Gateway (OpenAI-compatible API)
// Knowledge base loaded from external markdown file for easy editing

const http = require('http');
const fs = require('fs');
const path = require('path');

const GATEWAY_URL = 'http://localhost:18789/v1/chat/completions';
const MODEL = 'openclaw/default';
const BACKEND_MODEL = 'deepseek/deepseek-v4-flash';

// ═══════════════════════════════════════════════════════════════════════════
// KNOWLEDGE BASE — loaded from external file for easy editing
// Edit: tingaling-knowledge-base.md
// ═══════════════════════════════════════════════════════════════════════════

let KNOWLEDGE = '';

function loadKnowledgeBase() {
  const kbPath = path.join(__dirname, 'tingaling-knowledge-base.md');
  try {
    const content = fs.readFileSync(kbPath, 'utf8');
    // Extract the knowledge content (everything except the AI rules section at the bottom)
    const match = content.match(/## ⚙️ AI ASSISTANT RULES/);
    if (match) {
      KNOWLEDGE = content.substring(0, match.index);
    } else {
      KNOWLEDGE = content;
    }
    console.log(`[AI] Knowledge base loaded (${KNOWLEDGE.length} chars from ${kbPath})`);
  } catch (e) {
    console.error(`[AI] Failed to load knowledge base: ${e.message}`);
    KNOWLEDGE = `Ting-A-Ling Schools in Meerensee, Richards Bay.
Contact: info@tingalingschools.com`;
  }
}

// Load on startup
loadKnowledgeBase();

// Watch for changes to the knowledge base file
try {
  fs.watchFile(path.join(__dirname, 'tingaling-knowledge-base.md'), (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      console.log('[AI] Knowledge base changed — reloading...');
      loadKnowledgeBase();
    }
  });
} catch (e) {
  // File watching not critical
}

const SYSTEM_PROMPT = () => `You are TingAI, the official AI assistant for Ting-A-Ling Schools in Meerensee, Richards Bay, South Africa.

## ABSOLUTE RULES (every response MUST follow these):
1. You have NO knowledge other than what is written below in the KNOWLEDGE section. You were not trained on information about Ting-A-Ling Schools — you only know what is written below.
2. READ the KNOWLEDGE section for EVERY response. Do not answer from memory or from your training data. Only answer from the text below.
3. Never add commentary like "I wish I had" or "unfortunately" or "I hear you" or "I understand". Just state what the knowledge base says, worded naturally.
4. If the KNOWLEDGE section does not contain the answer, say EXACTLY: "I don't have that specific information. Please contact the school office at info@tingalingschools.com, 0615274429 / 0724561282, or visit during office hours (07:00-15:30 weekdays) and they'll be happy to help."
5. Whenever the answer differs between the Pre-Primary School and the Special Needs School, you MUST first ask which school before giving any details.
6. Keep responses brief — 2 to 3 sentences maximum. No long explanations.
7. Use South African English.
8. Never make up phone numbers, addresses, amounts, or any details.
9. If a parent asks to speak to a person or sounds frustrated: give them the office contact info.
10. Use emojis sparingly (one per message maximum).

## KNOWLEDGE
${KNOWLEDGE}`;

// ── Conversation memory ───────────────────────────────────────────────────
const conversations = new Map();
const MAX_HISTORY = 20;

function getHistory(phone) {
  if (!conversations.has(phone)) conversations.set(phone, []);
  return conversations.get(phone);
}

function callDeepSeek(messages) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      model: MODEL,
      messages: messages,
      stream: false,
      max_tokens: 300,
      temperature: 0.1
    });

    const req = http.request({
      hostname: 'localhost', port: 18789, path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'x-openclaw-model': BACKEND_MODEL
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
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.write(data);
    req.end();
  });
}

function buildMessages(phone, message) {
  const history = getHistory(phone);
  const msgs = [{ role: 'system', content: SYSTEM_PROMPT() }];

  // Add recent conversation history
  const recent = history.slice(-6);
  for (const m of recent) {
    msgs.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content });
  }

  msgs.push({ role: 'user', content: message });
  return msgs;
}

// ── Public API ────────────────────────────────────────────────────────────
async function getAIAutoReply(messageText, fromNumber) {
  const msg = (messageText || '').toLowerCase().trim();

  // Opt-out handled by server, but just in case
  if (/^stop$|^unsubscribe$|^opt.?out$|^cancel$/.test(msg)) return null;
  if (/^start$|^resubscribe$|^opt.?in$/i.test(msg)) return null;

  // Always reload knowledge base from file before every response.
  // This guarantees the AI always uses the latest content, even if the
  // dashboard saved new data between messages. No stale cache.
  loadKnowledgeBase();

  const messages = buildMessages(fromNumber, messageText);
  const reply = await callDeepSeek(messages);

  if (reply && reply.length > 0) {
    const history = getHistory(fromNumber);
    history.push({ role: 'user', content: messageText });
    history.push({ role: 'assistant', content: reply });
    if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
    return { text: reply, type: 'text', source: 'ai' };
  }

  return null;
}

module.exports = { getAIAutoReply };
