// Ting-A-Ling AI Assistant v5
// Uses DeepSeek via OpenClaw Gateway with light-context isolation
// Prevents Fred's agent context from leaking into school responses

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
    console.log(`[TINGAI] Knowledge base loaded (${KNOWLEDGE.length} chars from ${kbPath})`);
  } catch (e) {
    console.error(`[TINGAI] Failed to load knowledge base: ${e.message}`);
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
      console.log('[TINGAI] Knowledge base changed — reloading...');
      loadKnowledgeBase();
    }
  });
} catch (e) {
  // File watching not critical
}

// ── System prompt with embedded KB ────────────────────────────────────────
// Built fresh every call so KB changes take effect immediately
function buildSystemPrompt() {
  return `You are TingAI, the official AI assistant for Ting-A-Ling Schools in Meerensee, Richards Bay, South Africa.

## ABSOLUTE RULES (every response MUST follow these):
1. You have NO knowledge other than what is written below in the KNOWLEDGE section.
2. READ the KNOWLEDGE section for EVERY response. Only answer from the text below.
3. Never add commentary like "I wish I had" or "unfortunately" or "I hear you" or "I understand".
4. If the KNOWLEDGE section does not contain the answer, say: "I don't have that specific information. Please contact the school office at info@tingalingschools.com, 0615274429 / 0724561282, or visit during office hours (07:00-15:30 weekdays) and they'll be happy to help."
5. Whenever the answer differs between the Pre-Primary School and the Special Needs School, first ask which school.
6. Keep responses brief — 2 to 3 sentences maximum.
7. Use South African English.
8. Never make up phone numbers, addresses, amounts, or any details.
9. If a parent asks to speak to a person or sounds frustrated: give them the office contact info.
10. Use emojis sparingly (one per message maximum).
11. Never address anyone by name unless they tell you their name first.

## KNOWLEDGE
${KNOWLEDGE}`;
}

// ── Conversation memory (persisted to disk) ──────────────────────────────────
const AI_CONV_FILE = path.join(__dirname, 'ai-conversations.json');
const MAX_HISTORY = 20;

function loadAIConversations() {
  try {
    if (fs.existsSync(AI_CONV_FILE)) {
      const data = fs.readFileSync(AI_CONV_FILE, 'utf8');
      const parsed = JSON.parse(data);
      // Convert back to Map
      const map = new Map();
      for (const [key, val] of Object.entries(parsed)) {
        map.set(key, val);
      }
      return map;
    }
  } catch (e) {
    console.error('[TINGAI] Failed to load conversation history:', e.message);
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
    console.error('[TINGAI] Failed to save conversation history:', e.message);
  }
}

const conversations = loadAIConversations();

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
        'x-openclaw-light-context': 'true'  // Prevents Fred context leakage
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
          console.error('[TINGAI] Parse error:', e.message);
          resolve(null);
        }
      });
    });
    req.on('error', (e) => {
      console.error('[TINGAI] Request error:', e.message);
      resolve(null);
    });
    req.write(data);
    req.end();
  });
}

function buildMessages(phone, message) {
  const history = getHistory(phone);
  const msgs = [{ role: 'system', content: buildSystemPrompt() }];

  // Add recent conversation history for context
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

  // Always reload knowledge base from file before every response
  loadKnowledgeBase();

  const messages = buildMessages(fromNumber, messageText);
  const reply = await callDeepSeek(messages);

  if (reply && reply.length > 0) {
    const history = getHistory(fromNumber);
    history.push({ role: 'user', content: messageText });
    history.push({ role: 'assistant', content: reply });
    if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
    // Persist after every AI response
    saveAIConversations();
    return { text: reply, type: 'text', source: 'ai' };
  }

  return null;
}

module.exports = { getAIAutoReply };
