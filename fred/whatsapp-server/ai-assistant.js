// AutoEffortless AI Assistant v7 — Per-Client Agent Routing
// Routes AI requests to dedicated OpenClaw agents (one per client)
// Each client gets its own isolated agent with its own identity + KB

const http = require('http');

const GATEWAY_URL = 'http://localhost:18789/v1/chat/completions';
const DEFAULT_MODEL = 'openclaw/default';

// ── Agent lookup ───────────────────────────────────────────────────────────
// Agent IDs come from the dashboard API (stored per-client in the DB).
// Currently: client 6 → tingai (Ting-A-Ling Schools)

function callGateway(messages, agentId) {
  const model = agentId ? `openclaw/${agentId}` : DEFAULT_MODEL;

  return new Promise((resolve) => {
    const data = JSON.stringify({
      model: model,
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

// ── Public API ────────────────────────────────────────────────────────────
// messageText: raw message from user
// fromNumber: sender's phone number (for context, not always used)
// clientContext: { clientId, clientName, aiEnabled, ... } from resolveClient()
async function getAIAutoReply(messageText, fromNumber, clientContext) {
  const msg = (messageText || '').toLowerCase().trim();

  // Opt-out handled by server, but just in case
  if (/^stop$|^unsubscribe$|^opt.?out$|^cancel$/.test(msg)) return null;
  if (/^start$|^resubscribe$|^opt.?in$/i.test(msg)) return null;

  if (!clientContext || !clientContext.clientId) {
    console.error('[AI] No client context provided — cannot route to agent');
    return null;
  }

  // Find which agent handles this client (stored in DB, fetched from dashboard API)
  const agentId = clientContext.agentId;
  if (!agentId) {
    console.error(`[AI] No agent configured for client ${clientContext.clientId} (${clientContext.clientName})`);
    return null;
  }

  console.log(`[AI] Routing to agent "${agentId}" for ${clientContext.clientName} (client ${clientContext.clientId})`);

  // Let the dedicated agent handle this — it has its own identity, KB, and rules
  const messages = [
    { role: 'user', content: messageText }
  ];

  const reply = await callGateway(messages, agentId);

  if (reply && reply.length > 0) {
    return { text: reply, type: 'text', source: 'ai' };
  }

  return null;
}

module.exports = { getAIAutoReply };
