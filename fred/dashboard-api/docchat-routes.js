// ── DocChat v2 — RAG-powered AI document chat ──
// Upload a document (PDF/DOCX/TXT/MD) → extract text → chunk → embed locally
// (Ollama qwen3-embedding) → retrieve relevant chunks per question → DeepSeek
// answers WITH source citations [n] + retrievable source snippets.
// Entitlement: active 'docchat' purchase required.

import express from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import os from 'os'
import http from 'http'
import crypto from 'crypto'
import { execFile } from 'child_process'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')
const mammoth = require('mammoth')
const { OfficeParser } = require('officeparser')

const GATEWAY_URL = 'http://localhost:18789/v1/chat/completions'
const OLLAMA_URL = 'http://localhost:11434/api/embeddings'
const EMBED_MODEL = 'qwen3-embedding:0.6b'
const UPLOAD_DIR = path.join(process.cwd(), 'data', 'docchat-uploads')
const THUMB_DIR = path.join(process.cwd(), 'data', 'docchat-thumbs')
const CHUNK_SIZE = 1200
const CHUNK_OVERLAP = 150
const TOP_K = 5
const MAX_DOC_CHARS = 300000 // hard cap on indexed text per document
const MAX_HISTORY = 12

fs.mkdirSync(UPLOAD_DIR, { recursive: true })
fs.mkdirSync(THUMB_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 8)
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(pdf|docx|xlsx|pptx|csv|txt|md|rtf|odt)$/i.test(file.originalname)
    if (ok) cb(null, true)
    else cb(new Error('Supported: PDF, DOCX, XLSX, PPTX, CSV, TXT, MD, RTF, ODT'))
  },
})

function hasDocChatEntitlement(query, email) {
  return query(
    "SELECT id FROM purchases WHERE email = ? AND product_key = 'docchat' AND status = 'active'",
    [email]
  ).length > 0
}

// ── Text extraction ──
async function extractText(filePath, ext) {
  if (ext === '.pdf') {
    const data = await pdfParse(fs.readFileSync(filePath))
    return data.text || ''
  }
  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value || ''
  }
  if (ext === '.xlsx' || ext === '.pptx' || ext === '.odt' || ext === '.rtf') {
    const res = await OfficeParser.parseOffice(filePath)
    const t = typeof res?.toText === 'function' ? res.toText() : String(res?.content || '')
    return t || ''
  }
  return fs.readFileSync(filePath, 'utf8')
}

// ── Cover thumbnail via macOS QuickLook (fire-and-forget at upload) ──
function generateThumb(filename) {
  const filePath = path.join(UPLOAD_DIR, filename)
  execFile('qlmanage', ['-t', '-s', '320', '-o', THUMB_DIR, filePath], { timeout: 20000 }, (err) => {
    if (err) console.warn(`[DocChat] thumb failed for ${filename}:`, err.message?.slice(0, 120))
  })
}

// ── OCR fallback for scanned/image PDFs (pdftoppm + tesseract) ──
const PDFTOPPM = '/opt/homebrew/bin/pdftoppm'
const TESSERACT = '/opt/homebrew/bin/tesseract'

function ocrPdf(filePath) {
  return new Promise((resolve) => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docchat-ocr-'))
    const base = path.join(tmpDir, 'page')
    execFile(PDFTOPPM, ['-r', '200', '-png', filePath, base], { timeout: 120000 }, async (err) => {
      if (err) {
        console.warn('[DocChat] pdftoppm failed:', err.message?.slice(0, 120))
        fs.rmSync(tmpDir, { recursive: true, force: true })
        return resolve('')
      }
      const files = fs.readdirSync(tmpDir).filter((f) => f.endsWith('.png')).sort()
      let all = ''
      for (const f of files) {
        const out = await new Promise((res2) => {
          execFile(TESSERACT, [path.join(tmpDir, f), 'stdout'], { timeout: 60000 }, (e2, stdout) => {
            res2(e2 ? '' : String(stdout))
          })
        })
        if (out.trim()) all += out.trim() + '\n\n'
      }
      fs.rmSync(tmpDir, { recursive: true, force: true })
      resolve(all.trim())
    })
  })
}

// ── Chunking (paragraph-aware, with overlap) ──
function chunkText(text) {
  const chunks = []
  let start = 0
  while (start < text.length) {
    let end = start + CHUNK_SIZE
    if (end < text.length) {
      const window = text.slice(start, end)
      const lastBreak = Math.max(window.lastIndexOf('\n\n'), window.lastIndexOf('\n'))
      if (lastBreak > CHUNK_SIZE * 0.5) end = start + lastBreak
    }
    const piece = text.slice(start, end).trim()
    if (piece.length > 20) chunks.push(piece)
    if (end >= text.length) break
    start = Math.max(end - CHUNK_OVERLAP, start + 1)
  }
  return chunks
}

// ── Ollama local embedding (free, on this Mac) ──
function embedText(text) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ model: EMBED_MODEL, prompt: text.slice(0, 8000) })
    const req = http.request({
      hostname: 'localhost',
      port: 11434,
      path: '/api/embeddings',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let body = ''
      res.on('data', (c) => (body += c))
      res.on('end', () => {
        try {
          const j = JSON.parse(body)
          if (j.embedding) resolve(j.embedding)
          else reject(new Error(j.error || 'Ollama embedding failed'))
        } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.setTimeout(30000, () => req.destroy(new Error('Ollama timeout')))
    req.write(data)
    req.end()
  })
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1)
}

// ── DeepSeek via OpenClaw Gateway ──
function callDeepSeek(messages, maxTokens = 800) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'openclaw/docchat',
      messages,
      stream: false,
      max_tokens: maxTokens,
      temperature: 0.1,
    })
    const req = http.request({
      hostname: 'localhost',
      port: 18789,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'x-openclaw-light-context': 'true',
        'Authorization': 'Bearer ' + (process.env.OPENCLAW_GATEWAY_TOKEN || ''),
      },
    }, (res) => {
      let body = ''
      res.on('data', (c) => (body += c))
      res.on('end', () => {
        try {
          const j = JSON.parse(body)
          const content = j.choices?.[0]?.message?.content
          if (content) resolve(content)
          else reject(new Error(j.error?.message || 'Empty AI response'))
        } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.setTimeout(90000, () => req.destroy(new Error('AI gateway timeout')))
    req.write(data)
    req.end()
  })
}

export default function setupDocChatRoutes(app, { query, run, saveDb, requireAuth }) {
  let tableChecked = false
  function ensureTable() {
    if (tableChecked) return
    run(`CREATE TABLE IF NOT EXISTS docchat_docs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      filename TEXT NOT NULL,
      chars INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`)
    const cols = query('PRAGMA table_info(docchat_docs)')
    if (!cols.some((c) => c.name === 'text')) {
      run('ALTER TABLE docchat_docs ADD COLUMN text TEXT')
    }
    run(`CREATE TABLE IF NOT EXISTS docchat_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_id INTEGER NOT NULL,
      chunk_index INTEGER DEFAULT 0,
      text TEXT,
      embedding TEXT
    )`)
    run(`CREATE TABLE IF NOT EXISTS docchat_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`)
    run(`CREATE TABLE IF NOT EXISTS docchat_annotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      page INTEGER DEFAULT 0,
      quote TEXT NOT NULL,
      note TEXT DEFAULT '',
      color TEXT DEFAULT '#fde68a',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`)
    if (saveDb) saveDb()
    tableChecked = true
  }

  // Index a document: chunk + embed + persist (idempotent — skips if already indexed)
  async function indexDoc(docId, text) {
    const existing = query('SELECT COUNT(*) AS n FROM docchat_chunks WHERE doc_id = ?', [docId])[0]
    if (existing.n > 0) return
    const chunks = chunkText(text)
    for (let i = 0; i < chunks.length; i++) {
      const emb = await embedText(chunks[i])
      run('INSERT INTO docchat_chunks (doc_id, chunk_index, text, embedding) VALUES (?, ?, ?, ?)',
        [docId, i, chunks[i], JSON.stringify(emb)])
    }
    if (saveDb) saveDb()
    console.log(`[DocChat] indexed doc ${docId}: ${chunks.length} chunks`)
  }

  // ── Upload a document ──
  app.post('/api/app/docchat/upload', requireAuth, (req, res, next) => {
    if (!hasDocChatEntitlement(query, req.user?.email)) {
      return res.status(403).json({ error: 'DocChat purchase required' })
    }
    next()
  }, upload.single('file'), async (req, res) => {
    try {
      ensureTable()
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
      const ext = path.extname(req.file.originalname).toLowerCase()
      let text = await extractText(req.file.path, ext)
      // Scanned PDFs / image-only docs: try OCR
      if (text.trim().length < 20 && ext === '.pdf') {
        const ocr = await ocrPdf(req.file.path)
        if (ocr.trim().length >= 20) text = ocr
      }
      if (!text || text.trim().length < 20) {
        fs.unlinkSync(req.file.path)
        return res.status(422).json({ error: 'No readable text found in this document (it may be a scanned file with no OCR-able text)' })
      }
      const capped = text.slice(0, MAX_DOC_CHARS)
      run('INSERT INTO docchat_docs (email, name, filename, chars, text) VALUES (?, ?, ?, ?, ?)',
        [req.user.email, req.file.originalname, req.file.filename, capped.length, capped])
      if (saveDb) saveDb()
      generateThumb(req.file.filename)
      const doc = query('SELECT * FROM docchat_docs WHERE email = ? ORDER BY id DESC LIMIT 1', [req.user.email])[0]
      // Index asynchronously so the upload responds fast; chat lazily indexes if not done yet
      indexDoc(doc.id, capped).catch((e) => console.error(`[DocChat] index doc ${doc.id} failed:`, e.message))
      res.json({ id: doc.id, name: doc.name, chars: doc.chars, preview: capped.slice(0, 300) })
    } catch (e) {
      console.error('[DocChat] upload error:', e.message)
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path) } catch {}
      }
      res.status(500).json({ error: e.message })
    }
  })

  // ── List my documents ──
  app.get('/api/app/docchat/documents', requireAuth, (req, res) => {
    if (!hasDocChatEntitlement(query, req.user?.email)) {
      return res.status(403).json({ error: 'DocChat purchase required' })
    }
    ensureTable()
    res.json(query(
      'SELECT id, name, chars, created_at FROM docchat_docs WHERE email = ? ORDER BY id DESC',
      [req.user.email]
    ))
  })

  // ── Cover thumbnail (QuickLook PNG; 404 → client falls back to icon) ──
  app.get('/api/app/docchat/documents/:id/thumb', requireAuth, (req, res) => {
    try {
      if (!hasDocChatEntitlement(query, req.user?.email)) {
        return res.status(403).json({ error: 'DocChat purchase required' })
      }
      ensureTable()
      const doc = query('SELECT filename FROM docchat_docs WHERE id = ? AND email = ?', [req.params.id, req.user.email])[0]
      if (!doc) return res.status(404).json({ error: 'Document not found' })
      const thumbPath = path.join(THUMB_DIR, `${doc.filename}.png`)
      if (!fs.existsSync(thumbPath)) {
        generateThumb(doc.filename) // lazy generate (e.g. docs uploaded before v4)
        return res.status(404).json({ error: 'No thumbnail yet' })
      }
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Cache-Control', 'private, max-age=3600')
      fs.createReadStream(thumbPath).pipe(res)
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  })

  // ── Full extracted text (for the side-by-side viewer) ──
  app.get('/api/app/docchat/documents/:id/text', requireAuth, async (req, res) => {
    try {
      if (!hasDocChatEntitlement(query, req.user?.email)) {
        return res.status(403).json({ error: 'DocChat purchase required' })
      }
      ensureTable()
      const doc = query('SELECT * FROM docchat_docs WHERE id = ? AND email = ?', [req.params.id, req.user.email])[0]
      if (!doc) return res.status(404).json({ error: 'Document not found' })
      let text = doc.text || ''
      // Fall back to extracting from the stored file (docs uploaded before the text column)
      if (!text) {
        const filePath = path.join(UPLOAD_DIR, doc.filename)
        if (fs.existsSync(filePath)) {
          text = await extractText(filePath, path.extname(doc.filename).toLowerCase())
          if (text.trim().length < 20 && path.extname(doc.filename).toLowerCase() === '.pdf') {
            const ocr = await ocrPdf(filePath)
            if (ocr.trim().length >= 20) text = ocr
          }
        }
      }
      res.json({ name: doc.name, text, chars: text.length })
    } catch (e) {
      console.error('[DocChat] text error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  // ── Delete a document ──
  app.delete('/api/app/docchat/documents/:id', requireAuth, (req, res) => {
    if (!hasDocChatEntitlement(query, req.user?.email)) {
      return res.status(403).json({ error: 'DocChat purchase required' })
    }
    ensureTable()
    const doc = query('SELECT * FROM docchat_docs WHERE id = ? AND email = ?', [req.params.id, req.user.email])[0]
    if (!doc) return res.status(404).json({ error: 'Document not found' })
    const filePath = path.join(UPLOAD_DIR, doc.filename)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    run('DELETE FROM docchat_docs WHERE id = ?', [req.params.id])
    run('DELETE FROM docchat_chunks WHERE doc_id = ?', [req.params.id])
    run('DELETE FROM docchat_notes WHERE doc_id = ?', [req.params.id])
    run('DELETE FROM docchat_annotations WHERE doc_id = ?', [req.params.id])
    if (saveDb) saveDb()
    res.json({ ok: true })
  })

  // ── Annotations (highlight → note) ──
  app.get('/api/app/docchat/documents/:id/annotations', requireAuth, (req, res) => {
    if (!hasDocChatEntitlement(query, req.user?.email)) {
      return res.status(403).json({ error: 'DocChat purchase required' })
    }
    ensureTable()
    const doc = query('SELECT id FROM docchat_docs WHERE id = ? AND email = ?', [req.params.id, req.user.email])[0]
    if (!doc) return res.status(404).json({ error: 'Document not found' })
    res.json(query(
      'SELECT id, page, quote, note, color, created_at, updated_at FROM docchat_annotations WHERE doc_id = ? AND email = ? ORDER BY id ASC',
      [req.params.id, req.user.email]
    ))
  })

  app.post('/api/app/docchat/documents/:id/annotations', requireAuth, (req, res) => {
    try {
      if (!hasDocChatEntitlement(query, req.user?.email)) {
        return res.status(403).json({ error: 'DocChat purchase required' })
      }
      ensureTable()
      const doc = query('SELECT id FROM docchat_docs WHERE id = ? AND email = ?', [req.params.id, req.user.email])[0]
      if (!doc) return res.status(404).json({ error: 'Document not found' })
      const quote = String(req.body?.quote || '').trim()
      if (!quote) return res.status(400).json({ error: 'Highlighted text is empty' })
      const page = Math.max(0, parseInt(req.body?.page, 10) || 0)
      const note = String(req.body?.note || '').trim().slice(0, 10000)
      const color = /^#[0-9a-fA-F]{6}$/.test(req.body?.color || '') ? req.body.color : '#fde68a'
      run('INSERT INTO docchat_annotations (doc_id, email, page, quote, note, color) VALUES (?, ?, ?, ?, ?, ?)',
        [req.params.id, req.user.email, page, quote.slice(0, 5000), note, color])
      if (saveDb) saveDb()
      const ann = query('SELECT * FROM docchat_annotations WHERE email = ? ORDER BY id DESC LIMIT 1', [req.user.email])[0]
      res.json(ann)
    } catch (e) {
      console.error('[DocChat] annotation add error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  app.put('/api/app/docchat/annotations/:id', requireAuth, (req, res) => {
    try {
      if (!hasDocChatEntitlement(query, req.user?.email)) {
        return res.status(403).json({ error: 'DocChat purchase required' })
      }
      ensureTable()
      const ann = query('SELECT id FROM docchat_annotations WHERE id = ? AND email = ?', [req.params.id, req.user.email])[0]
      if (!ann) return res.status(404).json({ error: 'Annotation not found' })
      const note = String(req.body?.note ?? '').trim().slice(0, 10000)
      const color = /^#[0-9a-fA-F]{6}$/.test(req.body?.color || '') ? req.body.color : '#fde68a'
      run('UPDATE docchat_annotations SET note = ?, color = ?, updated_at = datetime(\'now\') WHERE id = ? AND email = ?',
        [note, color, req.params.id, req.user.email])
      if (saveDb) saveDb()
      res.json(query('SELECT * FROM docchat_annotations WHERE id = ?', [req.params.id])[0])
    } catch (e) {
      console.error('[DocChat] annotation update error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  app.delete('/api/app/docchat/annotations/:id', requireAuth, (req, res) => {
    if (!hasDocChatEntitlement(query, req.user?.email)) {
      return res.status(403).json({ error: 'DocChat purchase required' })
    }
    ensureTable()
    const ann = query('SELECT id FROM docchat_annotations WHERE id = ? AND email = ?', [req.params.id, req.user.email])[0]
    if (!ann) return res.status(404).json({ error: 'Annotation not found' })
    run('DELETE FROM docchat_annotations WHERE id = ? AND email = ?', [req.params.id, req.user.email])
    if (saveDb) saveDb()
    res.json({ ok: true })
  })

  // ── Original file (for the in-app document viewer) ──
  app.get('/api/app/docchat/documents/:id/file', requireAuth, (req, res) => {
    try {
      if (!hasDocChatEntitlement(query, req.user?.email)) {
        return res.status(403).json({ error: 'DocChat purchase required' })
      }
      ensureTable()
      const doc = query('SELECT * FROM docchat_docs WHERE id = ? AND email = ?', [req.params.id, req.user.email])[0]
      if (!doc) return res.status(404).json({ error: 'Document not found' })
      const filePath = path.join(UPLOAD_DIR, doc.filename)
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing on disk' })
      const types = {
        '.pdf': 'application/pdf',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain',
        '.md': 'text/markdown',
      }
      const ext = path.extname(doc.filename).toLowerCase()
      res.setHeader('Content-Type', types[ext] || 'application/octet-stream')
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.name)}"`)
      res.setHeader('Cache-Control', 'private, max-age=300')
      fs.createReadStream(filePath).pipe(res)
    } catch (e) {
      console.error('[DocChat] file error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  // ── Notes (one notebook per document) ──
  app.get('/api/app/docchat/documents/:id/notes', requireAuth, (req, res) => {
    if (!hasDocChatEntitlement(query, req.user?.email)) {
      return res.status(403).json({ error: 'DocChat purchase required' })
    }
    ensureTable()
    const doc = query('SELECT id FROM docchat_docs WHERE id = ? AND email = ?', [req.params.id, req.user.email])[0]
    if (!doc) return res.status(404).json({ error: 'Document not found' })
    res.json(query(
      'SELECT id, content, created_at FROM docchat_notes WHERE doc_id = ? AND email = ? ORDER BY id DESC',
      [req.params.id, req.user.email]
    ))
  })

  app.post('/api/app/docchat/documents/:id/notes', requireAuth, (req, res) => {
    try {
      if (!hasDocChatEntitlement(query, req.user?.email)) {
        return res.status(403).json({ error: 'DocChat purchase required' })
      }
      ensureTable()
      const doc = query('SELECT id FROM docchat_docs WHERE id = ? AND email = ?', [req.params.id, req.user.email])[0]
      if (!doc) return res.status(404).json({ error: 'Document not found' })
      const content = String(req.body?.content || '').trim()
      if (!content) return res.status(400).json({ error: 'Note is empty' })
      if (content.length > 10000) return res.status(400).json({ error: 'Note too long (max 10 000 chars)' })
      run('INSERT INTO docchat_notes (doc_id, email, content) VALUES (?, ?, ?)', [req.params.id, req.user.email, content])
      if (saveDb) saveDb()
      const note = query('SELECT * FROM docchat_notes WHERE email = ? ORDER BY id DESC LIMIT 1', [req.user.email])[0]
      res.json({ id: note.id, content: note.content, created_at: note.created_at })
    } catch (e) {
      console.error('[DocChat] note add error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  app.delete('/api/app/docchat/notes/:id', requireAuth, (req, res) => {
    if (!hasDocChatEntitlement(query, req.user?.email)) {
      return res.status(403).json({ error: 'DocChat purchase required' })
    }
    ensureTable()
    const note = query('SELECT id FROM docchat_notes WHERE id = ? AND email = ?', [req.params.id, req.user.email])[0]
    if (!note) return res.status(404).json({ error: 'Note not found' })
    run('DELETE FROM docchat_notes WHERE id = ? AND email = ?', [req.params.id, req.user.email])
    if (saveDb) saveDb()
    res.json({ ok: true })
  })

  // ── Search ALL notes across every document ──
  app.post('/api/app/docchat/notes/search', requireAuth, (req, res) => {
    if (!hasDocChatEntitlement(query, req.user?.email)) {
      return res.status(403).json({ error: 'DocChat purchase required' })
    }
    ensureTable()
    const q = String(req.body?.q || '').trim()
    if (!q) return res.status(400).json({ error: 'Search term required' })
    const like = `%${q.replace(/[%_]/g, (c) => '\\' + c)}%`
    res.json(query(
      `SELECT n.id AS note_id, n.content, n.created_at, n.doc_id, d.name AS doc_name
       FROM docchat_notes n JOIN docchat_docs d ON d.id = n.doc_id
       WHERE n.email = ? AND n.content LIKE ? ESCAPE '\\'
       ORDER BY n.id DESC`,
      [req.user.email, like]
    ))
  })

  // ── Search ALL documents at once (cross-doc RAG + citations) ──
  app.post('/api/app/docchat/search-all', requireAuth, async (req, res) => {
    try {
      if (!hasDocChatEntitlement(query, req.user?.email)) {
        return res.status(403).json({ error: 'DocChat purchase required' })
      }
      ensureTable()
      const { question } = req.body || {}
      if (!question || !String(question).trim()) return res.status(400).json({ error: 'Question required' })

      const docs = query('SELECT * FROM docchat_docs WHERE email = ? ORDER BY id DESC', [req.user.email])
      if (docs.length === 0) return res.json({ answer: 'You have no documents yet — upload one first.', sources: [] })

      // Lazy-index every doc that isn't chunked yet (self-healing)
      for (const doc of docs) {
        const cnt = query('SELECT COUNT(*) AS n FROM docchat_chunks WHERE doc_id = ?', [doc.id])[0]
        if (cnt.n > 0) continue
        let text = doc.text || ''
        if (!text) {
          const filePath = path.join(UPLOAD_DIR, doc.filename)
          if (fs.existsSync(filePath)) {
            text = await extractText(filePath, path.extname(doc.filename).toLowerCase())
          }
        }
        if (text) await indexDoc(doc.id, text.slice(0, MAX_DOC_CHARS))
      }

      const rows = query(
        `SELECT c.id, c.doc_id, c.chunk_index, c.text, c.embedding, d.name AS doc_name
         FROM docchat_chunks c JOIN docchat_docs d ON d.id = c.doc_id
         WHERE d.email = ?`,
        [req.user.email]
      )

      let context = '', sources = []
      if (rows.length > 0) {
        const qEmb = await embedText(String(question))
        const scored = rows
          .map((c) => ({ c, s: cosine(JSON.parse(c.embedding), qEmb) }))
          .sort((a, b) => b.s - a.s)
          .slice(0, 8)
        context = scored.map((x, i) => `[${i + 1}] (${x.c.doc_name}) ${x.c.text}`).join('\n\n---\n\n')
        sources = scored.map((x, i) => ({
          n: i + 1, doc_id: x.c.doc_id, doc_name: x.c.doc_name,
          text: x.c.text.slice(0, 600), score: Math.round(x.s * 100),
        }))
      } else {
        // No embeddings at all (Ollama down): fall back to raw LIKE across docs
        const like = `%${String(question).replace(/[%_]/g, (c) => '\\' + c)}%`
        const hits = query(
          `SELECT id AS doc_id, name AS doc_name, substr(text, 1, 800) AS text FROM docchat_docs
           WHERE email = ? AND text LIKE ? ESCAPE '\\'`,
          [req.user.email, like]
        )
        sources = hits.map((h, i) => ({ n: i + 1, ...h, score: 100 }))
        context = sources.map((s, i) => `[${i + 1}] (${s.doc_name}) ${s.text}`).join('\n\n---\n\n')
      }

      if (!context) return res.json({ answer: 'No relevant content found in any of your documents.', sources: [] })

      const system = [
        'You are DocChat, an AI assistant that answers questions ONLY from the provided document sections (which may come from multiple documents).',
        'Rules:',
        '- Answer strictly from the sections. If they do not contain the answer, say so plainly.',
        '- Each section is labelled like [1] (DocumentName). Cite inline like [1] or [2].',
        '- When sections from different documents disagree, say so and quote both.',
        '- Only cite a section that directly supports the statement. Never invent citations.',
        '- Keep answers concise. Quote the document where useful.',
        '--- SEARCHED ACROSS ALL DOCUMENTS ---',
        context,
        '--- END ---',
      ].join('\n')

      const answer = await callDeepSeek([{ role: 'system', content: system }, { role: 'user', content: String(question) }])
      res.json({ answer, sources })
    } catch (e) {
      console.error('[DocChat] search-all error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  // ── Chat with a document (RAG + citations) ──
  app.post('/api/app/docchat/chat', requireAuth, async (req, res) => {
    try {
      if (!hasDocChatEntitlement(query, req.user?.email)) {
        return res.status(403).json({ error: 'DocChat purchase required' })
      }
      ensureTable()
      const { docId, question, history, docIds } = req.body || {}
      if (!question) return res.status(400).json({ error: 'question is required' })

      // ── Multi-document chat (user selected several docs) ──
      if (Array.isArray(docIds) && docIds.length > 0) {
        const ids = docIds.slice(0, 20).map((x) => parseInt(x, 10)).filter((x) => x > 0)
        if (ids.length === 0) return res.status(400).json({ error: 'No valid documents selected' })
        const placeholders = ids.map(() => '?').join(',')
        const owned = query(
          `SELECT COUNT(*) AS n FROM docchat_docs WHERE id IN (${placeholders}) AND email = ?`,
          [...ids, req.user.email]
        )[0]
        if (owned.n !== ids.length) return res.status(404).json({ error: 'One or more documents not found' })

        const docs = query(
          `SELECT * FROM docchat_docs WHERE id IN (${placeholders}) AND email = ?`,
          [...ids, req.user.email]
        )
        // Lazy-index any that aren't chunked yet
        for (const doc of docs) {
          const cnt = query('SELECT COUNT(*) AS n FROM docchat_chunks WHERE doc_id = ?', [doc.id])[0]
          if (cnt.n > 0) continue
          let full = doc.text || ''
          if (!full) {
            const filePath = path.join(UPLOAD_DIR, doc.filename)
            if (fs.existsSync(filePath)) {
              full = await extractText(filePath, path.extname(doc.filename).toLowerCase())
            }
          }
          if (full) await indexDoc(doc.id, full.slice(0, MAX_DOC_CHARS))
        }

        const rows = query(
          `SELECT c.id, c.doc_id, c.text, c.embedding, d.name AS doc_name
           FROM docchat_chunks c JOIN docchat_docs d ON d.id = c.doc_id
           WHERE d.email = ? AND c.doc_id IN (${placeholders})`,
          [req.user.email, ...ids]
        )

        let context = '', sources = []
        if (rows.length > 0) {
          const qEmb = await embedText(String(question))
          const scored = rows
            .map((c) => ({ c, s: cosine(JSON.parse(c.embedding), qEmb) }))
            .sort((a, b) => b.s - a.s)
            .slice(0, 8)
          context = scored.map((x, i) => `[${i + 1}] (${x.c.doc_name}) ${x.c.text}`).join('\n\n---\n\n')
          sources = scored.map((x, i) => ({
            n: i + 1, doc_id: x.c.doc_id, doc_name: x.c.doc_name,
            text: x.c.text.slice(0, 600), score: Math.round(x.s * 100),
          }))
        } else {
          const like = `%${String(question).replace(/[%_]/g, (c) => '\\' + c)}%`
          const hits = query(
            `SELECT id AS doc_id, name AS doc_name, substr(text, 1, 800) AS text FROM docchat_docs
             WHERE email = ? AND id IN (${placeholders}) AND text LIKE ? ESCAPE '\\'`,
            [req.user.email, ...ids, like]
          )
          sources = hits.map((h, i) => ({ n: i + 1, ...h, score: 100 }))
          context = sources.map((s, i) => `[${i + 1}] (${s.doc_name}) ${s.text}`).join('\n\n---\n\n')
        }

        if (!context) return res.json({ answer: 'No relevant content found in the selected documents.', sources: [] })

        const system = [
          'You are DocChat, an AI assistant that answers questions ONLY from the provided document sections (which may come from multiple documents).',
          'Rules:',
          '- Answer strictly from the sections. If they do not contain the answer, say so plainly.',
          '- Each section is labelled like [1] (DocumentName). Cite inline like [1] or [2].',
          '- When sections from different documents disagree, say so and quote both.',
          '- Only cite a section that directly supports the statement. Never invent citations.',
          '- Keep answers concise. Quote the document where useful.',
          `--- SEARCHED ${ids.length} SELECTED DOCUMENTS ---`,
          context,
          '--- END ---',
        ].join('\n')
        const messages = [{ role: 'system', content: system }]
        const prior = Array.isArray(history) ? history.slice(-MAX_HISTORY) : []
        for (const m of prior) {
          if (m.role === 'user' || m.role === 'assistant') messages.push({ role: m.role, content: String(m.content).slice(0, 2000) })
        }
        messages.push({ role: 'user', content: String(question) })
        const answer = await callDeepSeek(messages)
        return res.json({ answer, sources })
      }

      // ── Single-document chat ──
      if (!docId) return res.status(400).json({ error: 'docId is required' })

      const doc = query('SELECT * FROM docchat_docs WHERE id = ? AND email = ?', [docId, req.user.email])[0]
      if (!doc) return res.status(404).json({ error: 'Document not found' })

      let fullText = doc.text || ''
      if (!fullText) {
        const filePath = path.join(UPLOAD_DIR, doc.filename)
        if (fs.existsSync(filePath)) {
          fullText = await extractText(filePath, path.extname(doc.filename).toLowerCase())
        }
      }

      // Ensure indexed (lazy index covers docs uploaded before the RAG upgrade)
      let chunks = query('SELECT * FROM docchat_chunks WHERE doc_id = ? ORDER BY chunk_index', [docId])
      if (chunks.length === 0 && fullText) {
        await indexDoc(docId, fullText.slice(0, MAX_DOC_CHARS))
        chunks = query('SELECT * FROM docchat_chunks WHERE doc_id = ? ORDER BY chunk_index', [docId])
      }

      let context, sources = []
      if (chunks.length > 0) {
        // RAG path: embed the question, retrieve top-k
        const qEmb = await embedText(question)
        const scored = chunks
          .map((c) => ({ c, s: cosine(JSON.parse(c.embedding), qEmb) }))
          .sort((a, b) => b.s - a.s)
          .slice(0, TOP_K)
        context = scored.map((x, i) => `[${i + 1}] ${x.c.text}`).join('\n\n---\n\n')
        sources = scored.map((x, i) => ({ n: i + 1, text: x.c.text.slice(0, 600), score: Math.round(x.s * 100) }))
      } else {
        // Fallback: whole document (no citations)
        context = fullText.slice(0, MAX_DOC_CHARS)
      }

      const system = [
        'You are DocChat, an AI assistant that answers questions ONLY from the provided document sections.',
        'Rules:',
        '- Answer strictly from the sections. If they do not contain the answer, say so plainly.',
        '- When you use information from a section, cite it inline like [1] or [2].',
        '- Only cite a section that directly supports the statement. Never invent citations.',
        '- Keep answers concise. Quote the document where useful.',
        `--- DOCUMENT: ${doc.name} ---`,
        context,
        '--- END ---',
      ].join('\n')

      const messages = [{ role: 'system', content: system }]
      const prior = Array.isArray(history) ? history.slice(-MAX_HISTORY) : []
      for (const m of prior) {
        if (m.role === 'user' || m.role === 'assistant') messages.push({ role: m.role, content: String(m.content).slice(0, 2000) })
      }
      messages.push({ role: 'user', content: question })

      const answer = await callDeepSeek(messages)
      res.json({ answer, sources })
    } catch (e) {
      console.error('[DocChat] chat error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  // ── Backfill thumbnails for all existing documents (runs once at startup) ──
  setTimeout(() => {
    try {
      ensureTable()
      const docs = query('SELECT filename FROM docchat_docs')
      let missing = 0
      for (const d of docs) {
        const p = path.join(THUMB_DIR, `${d.filename}.png`)
        if (!fs.existsSync(p)) {
          generateThumb(d.filename)
          missing++
        }
      }
      console.log(`[DocChat] thumb backfill: ${missing} missing of ${docs.length} docs`)
    } catch (e) {
      console.error('[DocChat] thumb backfill error:', e.message)
    }
  }, 3000)

  return {}
}
