// Ting-A-Ling AI Assistant v3
// Uses DeepSeek V4 Flash via OpenClaw Gateway (OpenAI-compatible API)
// STRICT knowledge-only mode: only answers from the provided knowledge base

const http = require('http');

const GATEWAY_URL = 'http://localhost:18789/v1/chat/completions';
const MODEL = 'openclaw/default';
const BACKEND_MODEL = 'deepseek/deepseek-v4-flash';

// ═══════════════════════════════════════════════════════════════════════════
// KNOWLEDGE BASE — ONLY source of truth for answers
// ═══════════════════════════════════════════════════════════════════════════

const KNOWLEDGE = `
## SCHOOL OVERVIEW
Ting-A-Ling Schools in Meerensee, Richards Bay offers two dedicated schools:
1. Pre-Primary School — 74 Krewilkring, Meerensee (ages 2-6)
2. Special Needs School — 18 Elweboog, Meerensee

## PRE-PRIMARY SCHOOL
- Ages: 2 to 6 years
- Play-based learning approach
- English language nurturing integrated into daily programme
- School readiness programme
- Focus: building confidence, creativity, and school readiness
- Half-day options available

## SPECIAL NEEDS SCHOOL
- Individualised care and education for children with diverse learning needs
- Dedicated team of specialists creating personalised programmes
- Therapy support available
- Inclusive environment

## OPERATING HOURS
- School Day: 07:30 - 14:00 (Monday to Friday)
- Office: 07:00 - 15:30 (Monday to Friday)
- Aftercare: Available until 17:00
- Daily pickup times: 13:00, 13:30, 15:00, 17:00
- Holiday programmes: Available during school breaks

## CONTACT
- Email: info@tingalingschools.com
- Pre-Primary Address: 74 Krewilkring, Meerensee, Richards Bay
- Special Needs Address: 18 Elweboog, Meerensee, Richards Bay
- Office Hours: 07:00 - 15:30 weekdays
- For urgent matters, parents should call the office during working hours

## ENROLMENT
- Available for both Pre-Primary and Special Needs
- Online enrolment via the Ting-A-Ling Schools website (parent portal)
- Alternatively, visit the school office for a registration pack
- Required documents: child's birth certificate, parent ID, latest school report
- Registration fee applies
- Online form has 7 sections: Student Info, Parent Info, Emergency Contacts, Medical, Pick-up Authorisation, Fees & Consent, Terms, Signature

## FEES
- Monthly fee amount set per student
- Payment methods: EFT, Debit Order, Cash, Other
- Fees due on the 2nd of each month
- Payable for 11 months (January to November)
- Registration fee applies
- For specific fee structures, contact office or email info@tingalingschools.com

## ABSENTEE REPORTING
- Call the school office to report absence
- Alternatively, send message with child's NAME, GRADE and REASON
- Office hours: 07:00 - 15:30 weekdays

## UNIFORM
- Uniforms available from the school shop
- Full uniform list and pricelist available from the office

## EVENTS
- Communicated via parent WhatsApp groups
- Weekly newsletter (Fridays)
- Notice board at school gate
`;

const SYSTEM_PROMPT = `You are TingAI, the official AI assistant for Ting-A-Ling Schools in Meerensee, Richards Bay, South Africa.

## CRITICAL RULES (you must follow these exactly):
1. ONLY answer using the KNOWLEDGE section below. Do NOT use any other knowledge.
2. If the KNOWLEDGE section doesn't have the answer, say: "I don't have that information available. Please contact the school office at info@tingalingschools.com or visit during office hours (07:00-15:30 weekdays) and they'll be happy to help."
3. Keep responses brief and warm — 2 to 3 sentences maximum.
4. Use South African English.
5. Never make up phone numbers, addresses, or any details not in the KNOWLEDGE section.
6. If a parent asks to speak to a person or sounds frustrated: give them info@tingalingschools.com
7. Use emojis sparingly (one per message maximum).

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
      temperature: 0.3
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
  const msgs = [{ role: 'system', content: SYSTEM_PROMPT }];

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
