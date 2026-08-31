import fs from 'fs'
import path from 'path'

// ── Fred Chat — in-portal chat bot (overlord only) ────────────────────────
// Talks to the OpenClaw gateway (openclaw/fred) with full agent context,
// so Fred has the same memory/workspace as everywhere else. History is
// persisted server-side per user → survives devices/browsers.
// ───────────────────────────────────────────────────────────────────────────

const HISTORY_DIR = path.join(process.cwd(), 'data')
const HISTORY_FILE = path.join(HISTORY_DIR, 'fred-chat-history.json')
const MAX_TURNS = 40 // 20 user + 20 assistant
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || ''
const GATEWAY_URL = 'http://localhost:18789/v1/chat/completions'
const TIMEOUT_MS = 180000

function loadAll() {
  try {
    if (fs.existsSync(HISTORY_FILE)) return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'))
  } catch (e) {
    console.error('[FredChat] history load error:', e.message)
  }
  return {}
}

function saveAll(all) {
  try {
    if (!fs.existsSync(HISTORY_DIR)) fs.mkdirSync(HISTORY_DIR, { recursive: true })
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(all, null, 2), 'utf8')
  } catch (e) {
    console.error('[FredChat] history save error:', e.message)
  }
}

function getHistory(email) {
  const all = loadAll()
  return Array.isArray(all[email]) ? all[email] : []
}

function setHistory(email, messages) {
  const all = loadAll()
  all[email] = messages.slice(-MAX_TURNS)
  saveAll(all)
}

async function callFred(messages) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const resp = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + GATEWAY_TOKEN,
      },
      body: JSON.stringify({
        model: 'openclaw/fred',
        messages,
        stream: false,
        max_tokens: 800,
        temperature: 0.2,
      }),
      signal: controller.signal,
    })
    if (!resp.ok) {
      const body = await resp.text().catch(() => '')
      throw new Error(`Fred gateway ${resp.status}: ${body.slice(0, 200)}`)
    }
    const j = await resp.json()
    const content = j.choices?.[0]?.message?.content
    if (!content || !content.trim()) throw new Error('Fred returned an empty response')
    return content.trim()
  } finally {
    clearTimeout(timer)
  }
}

export default function setupFredChatRoutes(app, { requireAuth, requireRole }) {
  const overlordOnly = [requireAuth, requireRole('overlord')]

  // GET history
  app.get('/api/fred/chat', ...overlordOnly, (req, res) => {
    res.json({ messages: getHistory(req.user.email) })
  })

  // POST message → Fred
  app.post('/api/fred/chat', ...overlordOnly, async (req, res) => {
    const message = String(req.body?.message || '').trim().slice(0, 4000)
    if (!message) return res.status(400).json({ error: 'Message is empty' })

    const history = getHistory(req.user.email)
    const messages = [...history, { role: 'user', content: message }]

    try {
      const reply = await callFred(messages)
      const nextHistory = [
        ...history,
        { role: 'user', content: message },
        { role: 'assistant', content: reply },
      ]
      setHistory(req.user.email, nextHistory)
      res.json({ reply, messages: nextHistory })
    } catch (e) {
      console.error('[FredChat] gateway error:', e.message)
      res.status(502).json({ error: e.message })
    }
  })

  // DELETE history
  app.delete('/api/fred/chat', ...overlordOnly, (req, res) => {
    setHistory(req.user.email, [])
    res.json({ ok: true })
  })
}
