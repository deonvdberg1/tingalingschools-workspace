// ── Attendance & Time Tracking app ──
// Staff clock in/out via QR code scan (Clock Station), tap, or manual code.
// Admin dashboard: who's in now, timesheets, per-staff summaries, CSV export.
// Entitlement: active 'attendance' purchase (store buyer) OR overlord OR
// client subscribed product 'attendance' (e.g. Ting-A-Ling pilot).

import express from 'express'
import crypto from 'crypto'
import QRCode from 'qrcode'
import { execFile } from 'child_process'
import { promisify } from 'util'
import PDFDocument from 'pdfkit'

const execFileP = promisify(execFile)
const router = express.Router()
const PUBLIC_BASE = 'https://app.autoeffortless.com'

function hasEntitlement(query, user) {
  if (!user) return false
  if (user.role === 'overlord') return true
  const owned = query(
    "SELECT id FROM purchases WHERE email = ? AND product_key = 'attendance' AND status = 'active'",
    [user.email]
  ).length > 0
  if (owned) return true
  if (user.client_id) {
    const cp = query(
      "SELECT id FROM client_products WHERE client_id = ? AND product_key = 'attendance' AND status = 'active'",
      [user.client_id]
    ).length > 0
    return cp > 0
  }
  return false
}

function genCode() {
  // Unique-ish short code: e.g. "X7K2QP" (no 0/O/1/I to avoid scanning confusion)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i++) out += alphabet[crypto.randomInt(alphabet.length)]
  return out
}

// ── Email via gog CLI (Gmail, info@autoeffortless.com) ──
async function sendEmail(to, subject, body) {
  try {
    await execFileP('/opt/homebrew/bin/gog', ['gmail', 'send', '--account', 'info@autoeffortless.com', '--to', to, '--subject', subject, '--body', body], { timeout: 30000 })
    return true
  } catch (e) {
    console.warn('[Attendance] email failed to', to, ':', e.message?.slice(0, 120))
    return false
  }
}

// ── Create a staff portal account + email login details ──
// Returns { user, isNew, emailSent }. Links attendance_staff.user_id → users.id.
async function createStaffAccount({ query, run, saveDb }, { name, email, ownerName, ownerEmail }) {
  const em = String(email || '').trim().toLowerCase()
  if (!em || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return { user: null, isNew: false, emailSent: false, reason: 'no-email' }
  // Never create an account for the owner themselves
  if (em === String(ownerEmail || '').trim().toLowerCase()) return { user: null, isNew: false, emailSent: false, reason: 'owner' }
  const existing = query('SELECT * FROM users WHERE email = ?', [em])[0]
  if (existing) return { user: existing, isNew: false, emailSent: false, reason: 'exists' }

  const password = crypto.randomBytes(6).toString('base64url').slice(0, 10)
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex')
  run('INSERT INTO users (email, password, name, role, client_id) VALUES (?, ?, ?, ?, NULL)', [em, passwordHash, name || em.split('@')[0], 'staff'])
  if (saveDb) saveDb()
  const user = query('SELECT * FROM users WHERE email = ?', [em])[0]

  const body = [
    `Hi ${user.name},`,
    '',
    `Your staff account for ${ownerName || 'AutoEffortless'} attendance is ready.`,
    'Use it to clock in and out from your phone or any device.',
    '',
    'Sign in here:',
    'https://app.autoeffortless.com',
    '',
    'Your login details:',
    `Email: ${em}`,
    `Password: ${password}`,
    '',
    'You can change your password after logging in.',
    '',
    'Questions? Just reply to this email.',
    '',
    '— The AutoEffortless Team'
  ].join('\n')
  const emailSent = await sendEmail(em, 'Your staff account is ready ✅', body)
  return { user, isNew: true, emailSent }
}

// Serialize a record row with computed hours + staff name (shared by several endpoints)
function withStaff(query, rows) {
  return rows.map((r) => {
    const staff = r.staff_id ? query('SELECT name, position, code FROM attendance_staff WHERE id = ?', [r.staff_id])[0] : null
    let hours = 0
    if (r.clock_in && r.clock_out) {
      hours = Math.max(0, (new Date(r.clock_out.replace(' ', 'T') + 'Z').getTime() - new Date(r.clock_in.replace(' ', 'T') + 'Z').getTime()) / 3600000)
    }
    return {
      ...r,
      staff_name: staff?.name || 'Unknown',
      staff_position: staff?.position || '',
      staff_code: staff?.code || '',
      hours: Math.round(hours * 100) / 100,
      duration_min: Math.round(hours * 60),
    }
  })
}

export default function setupAttendanceRoutes(app, { query, run, saveDb, requireAuth }) {
  // Registry of apps that have a STAFF side. Staff only ever see these — and
  // only the ones the admin has enabled. The staff view is the staff-facing
  // route, NEVER the admin view.
  const STAFF_APPS = [
    { key: 'attendance', name: 'Attendance & Time', icon: 'clock', staffPath: '/staff-clock', blurb: 'Clock in and out and view your shifts.' },
    // Future admin/staff apps (e.g. HR leave requests) get added here when built.
  ]

  let tableChecked = false
  function ensureTable() {
    if (tableChecked) return
    run(`CREATE TABLE IF NOT EXISTS attendance_staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      position TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      code TEXT UNIQUE NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )`)
    // v2: staff email + linked portal account (added 2026-08-30)
    const attCols = query('PRAGMA table_info(attendance_staff)').map((c) => c.name)
    if (!attCols.includes('staff_email')) run("ALTER TABLE attendance_staff ADD COLUMN staff_email TEXT DEFAULT ''")
    if (!attCols.includes('user_id')) run('ALTER TABLE attendance_staff ADD COLUMN user_id INTEGER')
    run(`CREATE TABLE IF NOT EXISTS attendance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      clock_in TEXT NOT NULL,
      clock_out TEXT,
      method TEXT DEFAULT 'tap',
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )`)
    run('CREATE INDEX IF NOT EXISTS idx_att_records_staff ON attendance_records(staff_id)')
    run('CREATE INDEX IF NOT EXISTS idx_att_records_email ON attendance_records(email, clock_in)')
    // Staff app enablement: which staff-capable apps the admin has allowed for staff
    run(`CREATE TABLE IF NOT EXISTS staff_apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_email TEXT NOT NULL,
      client_id INTEGER,
      product_key TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )`)
    run('CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_apps_scope ON staff_apps(owner_email, product_key)')
    if (saveDb) saveDb()
    tableChecked = true
  }

  function requireEntitlement(req, res, next) {
    if (!hasEntitlement(query, req.user)) {
      return res.status(403).json({ error: 'Attendance purchase required' })
    }
    next()
  }

  const utcNow = () => new Date().toISOString().slice(0, 19).replace('T', ' ')

  // ── Staff CRUD ──
  app.get('/api/app/attendance/staff', requireAuth, requireEntitlement, (req, res) => {
    ensureTable()
    const rows = query(
      'SELECT id, name, position, phone, code, active, staff_email, user_id, created_at FROM attendance_staff WHERE email = ? ORDER BY name COLLATE NOCASE',
      [req.user.email]
    )
    // Attach open-record flag (is currently clocked in)
    const out = rows.map((s) => {
      const open = query('SELECT id FROM attendance_records WHERE staff_id = ? AND clock_out IS NULL', [s.id])[0]
      return { ...s, clocked_in: !!open, open_record_id: open?.id || null }
    })
    res.json(out)
  })

  // Shared: insert one staff row + (optional) linked portal account
  async function insertStaff(ownerEmail, { name, position, phone, staffEmail }) {
    ensureTable()
    const cleanName = String(name || '').trim().slice(0, 120)
    if (!cleanName) return { error: 'Name is required' }
    const cleanPosition = String(position || '').trim().slice(0, 120)
    const cleanPhone = String(phone || '').trim().slice(0, 40)
    const cleanEmail = String(staffEmail || '').trim().toLowerCase().slice(0, 200)
    let code = genCode()
    for (let i = 0; i < 5; i++) {
      const exists = query('SELECT id FROM attendance_staff WHERE code = ?', [code])[0]
      if (!exists) break
      code = genCode()
    }
    run('INSERT INTO attendance_staff (email, name, position, phone, code, staff_email) VALUES (?, ?, ?, ?, ?, ?)',
      [ownerEmail, cleanName, cleanPosition, cleanPhone, code, cleanEmail])
    if (saveDb) saveDb()
    const staff = query('SELECT * FROM attendance_staff WHERE email = ? ORDER BY id DESC LIMIT 1', [ownerEmail])[0]

    // Create a staff portal account when an email was given
    let account = null
    if (cleanEmail) {
      const owner = query('SELECT name FROM users WHERE email = ?', [ownerEmail])[0]
      account = await createStaffAccount({ query, run, saveDb }, {
        name: cleanName,
        email: cleanEmail,
        ownerName: owner?.name || 'AutoEffortless',
        ownerEmail: ownerEmail,
      })
      if (account.user) {
        run('UPDATE attendance_staff SET user_id = ? WHERE id = ?', [account.user.id, staff.id])
        if (saveDb) saveDb()
        // Auto-enable Attendance for staff when the first staff account is created
        ensureTable()
        const owner = query('SELECT client_id FROM users WHERE email = ?', [ownerEmail])[0]
        run('INSERT OR IGNORE INTO staff_apps (owner_email, client_id, product_key) VALUES (?, ?, \'attendance\')',
          [ownerEmail, owner?.client_id || null])
        if (saveDb) saveDb()
      }
    }
    return { staff, account }
  }

  app.post('/api/app/attendance/staff', requireAuth, requireEntitlement, async (req, res) => {
    try {
      const { staff, account } = await insertStaff(req.user.email, {
        name: req.body?.name,
        position: req.body?.position,
        phone: req.body?.phone,
        staffEmail: req.body?.email,
      })
      if (!staff) return res.status(400).json({ error: 'Name is required' })
      res.json({ ...staff, account: account ? { created: account.isNew, email_sent: account.emailSent } : null })
    } catch (e) {
      console.error('[Attendance] staff add error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  // ── BULK add staff (one request, many rows; each with optional email → account) ──
  app.post('/api/app/attendance/staff/bulk', requireAuth, requireEntitlement, async (req, res) => {
    try {
      ensureTable()
      const items = Array.isArray(req.body?.staff) ? req.body.staff : null
      if (!items || items.length === 0) return res.status(400).json({ error: 'Send at least one staff member' })
      if (items.length > 100) return res.status(400).json({ error: 'Max 100 staff per batch' })

      const created = []
      const errors = []
      let accounts = 0
      let emailsSent = 0
      for (const it of items) {
        try {
          const { staff, account } = await insertStaff(req.user.email, {
            name: it?.name,
            position: it?.position,
            phone: it?.phone,
            staffEmail: it?.email,
          })
          if (!staff) {
            errors.push({ name: it?.name || '?', error: 'Name is required' })
            continue
          }
          created.push(staff)
          if (account?.isNew) accounts++
          if (account?.emailSent) emailsSent++
        } catch (e) {
          errors.push({ name: it?.name || '?', error: e.message })
        }
      }
      res.json({ created, errors, accounts_created: accounts, emails_sent: emailsSent })
    } catch (e) {
      console.error('[Attendance] bulk add error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  app.put('/api/app/attendance/staff/:id', requireAuth, requireEntitlement, (req, res) => {
    try {
      ensureTable()
      const staff = query('SELECT id FROM attendance_staff WHERE id = ? AND email = ?', [req.params.id, req.user.email])[0]
      if (!staff) return res.status(404).json({ error: 'Staff member not found' })
      const name = String(req.body?.name ?? '').trim().slice(0, 120)
      const position = String(req.body?.position ?? '').trim().slice(0, 120)
      const phone = String(req.body?.phone ?? '').trim().slice(0, 40)
      const active = req.body?.active === undefined ? 1 : (req.body.active ? 1 : 0)
      run('UPDATE attendance_staff SET name = ?, position = ?, phone = ?, active = ? WHERE id = ? AND email = ?',
        [name || query('SELECT name FROM attendance_staff WHERE id = ?', [req.params.id])[0].name, position, phone, active, req.params.id, req.user.email])
      if (saveDb) saveDb()
      res.json(query('SELECT * FROM attendance_staff WHERE id = ?', [req.params.id])[0])
    } catch (e) {
      console.error('[Attendance] staff update error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  app.delete('/api/app/attendance/staff/:id', requireAuth, requireEntitlement, (req, res) => {
    ensureTable()
    const staff = query('SELECT id FROM attendance_staff WHERE id = ? AND email = ?', [req.params.id, req.user.email])[0]
    if (!staff) return res.status(404).json({ error: 'Staff member not found' })
    // Close any open record before deleting
    run('UPDATE attendance_records SET clock_out = datetime(\'now\') WHERE staff_id = ? AND clock_out IS NULL', [req.params.id])
    run('DELETE FROM attendance_staff WHERE id = ? AND email = ?', [req.params.id, req.user.email])
    if (saveDb) saveDb()
    res.json({ ok: true })
  })

  // ── QR code for a staff member (PNG data URL — printable) ──
  app.get('/api/app/attendance/staff/:id/qrcode', requireAuth, requireEntitlement, async (req, res) => {
    try {
      ensureTable()
      const staff = query('SELECT * FROM attendance_staff WHERE id = ? AND email = ?', [req.params.id, req.user.email])[0]
      if (!staff) return res.status(404).json({ error: 'Staff member not found' })
      const payload = `ATT:${staff.code}`
      const dataUrl = await QRCode.toDataURL(payload, { width: 512, margin: 2, errorCorrectionLevel: 'M' })
      res.json({ code: staff.code, payload, qr: dataUrl, name: staff.name, position: staff.position })
    } catch (e) {
      console.error('[Attendance] qrcode error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  // ── Clock in / out (the one action the station + staff use) ──
  // Body: { code?: string, staffId?: number, method?: 'qr'|'tap'|'code'|'app', note?: string }
  // Staff-role users can ONLY clock themselves (their linked attendance profile).
  app.post('/api/app/attendance/clock', requireAuth, (req, res) => {
    try {
      ensureTable()
      const isStaff = req.user.role === 'staff'
      if (!isStaff && !hasEntitlement(query, req.user)) {
        return res.status(403).json({ error: 'Attendance purchase required' })
      }
      const { code, staffId, method, note } = req.body || {}

      if (isStaff) {
        // Staff can only clock for their own linked profile
        const linked = query('SELECT * FROM attendance_staff WHERE user_id = ?', [req.user.id])[0]
        if (!linked) return res.status(404).json({ error: 'No attendance profile linked to your account' })
        const result = doClock(linked.email, { staffId: linked.id, method, note })
        if (result.error) return res.status(result.status || 400).json({ error: result.error })
        return res.json(result)
      }

      // Owner / admin path: pick any of their staff by id or code
      const result = doClock(req.user.email, { staffId, code, method, note })
      if (result.error) return res.status(result.status || 400).json({ error: result.error })
      res.json(result)
    } catch (e) {
      console.error('[Attendance] clock error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  // ── Staff self-service: my profile + today's shifts (role: staff) ──
  app.get('/api/app/attendance/me', requireAuth, (req, res) => {
    try {
      ensureTable()
      if (req.user.role !== 'staff') return res.status(403).json({ error: 'Staff account required' })
      const linked = query('SELECT * FROM attendance_staff WHERE user_id = ?', [req.user.id])[0]
      if (!linked) return res.status(404).json({ error: 'No attendance profile linked to your account' })
      const open = query('SELECT * FROM attendance_records WHERE staff_id = ? AND clock_out IS NULL ORDER BY clock_in DESC', [linked.id])[0]
      const today = query(
        "SELECT * FROM attendance_records WHERE staff_id = ? AND clock_in >= date('now') ORDER BY clock_in DESC",
        [linked.id]
      )
      res.json({
        staff: { id: linked.id, name: linked.name, position: linked.position, code: linked.code },
        clocked_in: !!open,
        open_record: open ? withStaff(query, [open])[0] : null,
        today: withStaff(query, today),
      })
    } catch (e) {
      console.error('[Attendance] me error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  // ── Staff app access (admin side): which staff-capable apps staff may use ──
  app.get('/api/app/attendance/staff-apps', requireAuth, requireEntitlement, (req, res) => {
    ensureTable()
    const rows = query('SELECT product_key, enabled FROM staff_apps WHERE owner_email = ? ORDER BY product_key', [req.user.email])
    const enabled = new Set(rows.filter((r) => r.enabled).map((r) => r.product_key))
    res.json({
      enabled: STAFF_APPS.map((a) => ({ ...a, enabled: enabled.has(a.key) })),
    })
  })

  app.post('/api/app/attendance/staff-apps/:productKey', requireAuth, requireEntitlement, (req, res) => {
    try {
      ensureTable()
      const key = String(req.params.productKey || '')
      if (!STAFF_APPS.some((a) => a.key === key)) return res.status(400).json({ error: 'Unknown staff app' })
      const owner = query('SELECT client_id FROM users WHERE email = ?', [req.user.email])[0]
      run('INSERT OR IGNORE INTO staff_apps (owner_email, client_id, product_key) VALUES (?, ?, ?)', [req.user.email, owner?.client_id || null, key])
      run('UPDATE staff_apps SET enabled = 1 WHERE owner_email = ? AND product_key = ?', [req.user.email, key])
      if (saveDb) saveDb()
      res.json({ ok: true, product_key: key, enabled: true })
    } catch (e) {
      console.error('[Attendance] staff-apps enable error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  app.delete('/api/app/attendance/staff-apps/:productKey', requireAuth, requireEntitlement, (req, res) => {
    try {
      ensureTable()
      const key = String(req.params.productKey || '')
      run('UPDATE staff_apps SET enabled = 0 WHERE owner_email = ? AND product_key = ?', [req.user.email, key])
      if (saveDb) saveDb()
      res.json({ ok: true, product_key: key, enabled: false })
    } catch (e) {
      console.error('[Attendance] staff-apps disable error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  // ── Staff's own apps (staff side): ONLY what the admin enabled, staff view only ──
  app.get('/api/app/attendance/my-apps', requireAuth, (req, res) => {
    try {
      ensureTable()
      if (req.user.role !== 'staff') return res.status(403).json({ error: 'Staff account required' })
      const linked = query('SELECT * FROM attendance_staff WHERE user_id = ?', [req.user.id])[0]
      if (!linked) return res.status(404).json({ error: 'No attendance profile linked to your account' })
      const ownerEmail = linked.email
      const owner = query('SELECT client_id FROM users WHERE email = ?', [ownerEmail])[0]
      // Enabled apps: owner-email scope OR owner's client scope
      let rows = query('SELECT product_key, enabled FROM staff_apps WHERE owner_email = ?', [ownerEmail])
      if (owner?.client_id) {
        rows = rows.concat(query('SELECT product_key, enabled FROM staff_apps WHERE client_id = ?', [owner.client_id]))
      }
      const enabled = new Set(rows.filter((r) => r.enabled).map((r) => r.product_key))
      res.json(STAFF_APPS.filter((a) => enabled.has(a.key)))
    } catch (e) {
      console.error('[Attendance] my-apps error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  // ── Shared clock logic (used by the authed endpoint and the public kiosk QR) ──
  function doClock(ownerEmail, { staffId, code, method, note }) {
    ensureTable()
    let staff = null
    if (staffId) {
      staff = query('SELECT * FROM attendance_staff WHERE id = ? AND email = ?', [staffId, ownerEmail])[0]
    } else if (code) {
      const c = String(code).trim().toUpperCase()
      const bare = c.startsWith('ATT:') ? c.slice(4) : c
      staff = query('SELECT * FROM attendance_staff WHERE code = ? AND email = ?', [bare, ownerEmail])[0]
    }
    if (!staff) return { error: 'Staff member not found — check the code', status: 404 }
    if (!staff.active) return { error: 'This staff member is inactive', status: 400 }
    const m = String(method || 'tap').slice(0, 10)
    const noteText = String(note || '').trim().slice(0, 500)
    const open = query('SELECT * FROM attendance_records WHERE staff_id = ? AND clock_out IS NULL', [staff.id])[0]
    if (open) {
      run("UPDATE attendance_records SET clock_out = datetime('now'), method = ?, note = ? WHERE id = ?", [m, noteText, open.id])
      if (saveDb) saveDb()
      const rec = withStaff(query, [query('SELECT * FROM attendance_records WHERE id = ?', [open.id])[0]])[0]
      return { action: 'out', record: rec, staff: { id: staff.id, name: staff.name } }
    }
    const now = utcNow()
    run('INSERT INTO attendance_records (staff_id, email, clock_in, method, note) VALUES (?, ?, ?, ?, ?)', [staff.id, ownerEmail, now, m, noteText])
    if (saveDb) saveDb()
    const rec = query('SELECT * FROM attendance_records WHERE staff_id = ? ORDER BY id DESC LIMIT 1', [staff.id])[0]
    return { action: 'in', record: withStaff(query, [rec])[0], staff: { id: staff.id, name: staff.name } }
  }

  // ── The shared "anyone can clock in" QR + PDF poster (admin side) ──
  app.get('/api/app/attendance/clock-in-qr', requireAuth, requireEntitlement, async (req, res) => {
    try {
      ensureTable()
      const url = `${PUBLIC_BASE}/clock-in?o=${encodeURIComponent(req.user.email)}`
      const qr = await QRCode.toDataURL(url, { width: 512, margin: 2, errorCorrectionLevel: 'M' })
      res.json({ url, qr })
    } catch (e) {
      console.error('[Attendance] clock-in qr error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  app.get('/api/app/attendance/clock-in-poster.pdf', requireAuth, requireEntitlement, async (req, res) => {
    try {
      ensureTable()
      const url = `${PUBLIC_BASE}/clock-in?o=${encodeURIComponent(req.user.email)}`
      const owner = query('SELECT name FROM users WHERE email = ?', [req.user.email])[0]
      const qrPng = await QRCode.toBuffer(url, { width: 640, margin: 2, errorCorrectionLevel: 'M' })

      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 48 })
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename="attendance-clock-in-poster.pdf"')
      doc.pipe(res)

      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#faf8f3')
      doc
        .fontSize(40)
        .fillColor('#14142a')
        .font('Helvetica-Bold')
        .text('CLOCK IN / OUT', { align: 'center' })
      doc
        .fontSize(16)
        .fillColor('#6b7280')
        .font('Helvetica')
        .text(`Scan this code with your phone camera — then tap your name. (${owner?.name || ''})`, { align: 'center', width: 500 })
      doc.moveDown(1.2)
      doc.image(qrPng, (doc.page.width - 330) / 2, doc.y, { width: 330 })
      doc.moveDown(0.3)
      doc
        .fontSize(12)
        .fillColor('#9ca3af')
        .text('No app needed — works in any phone camera.', { align: 'center' })
      doc.end()
    } catch (e) {
      console.error('[Attendance] poster pdf error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  // ── Public kiosk: roster (names only, no codes) + clock in/out (no login) ──
  app.get('/api/clock-in/roster', (req, res) => {
    try {
      ensureTable()
      const ownerEmail = String(req.query.o || '').trim()
      if (!ownerEmail) return res.status(400).json({ error: 'Missing owner' })
      const owner = query('SELECT name FROM users WHERE email = ?', [ownerEmail])[0]
      if (!owner) return res.status(404).json({ error: 'Unknown roster' })
      const staff = query(
        'SELECT id, name, position FROM attendance_staff WHERE email = ? AND active = 1 ORDER BY name COLLATE NOCASE',
        [ownerEmail]
      )
      // Attach who's currently on shift
      const out = staff.map((s) => {
        const open = query('SELECT id FROM attendance_records WHERE staff_id = ? AND clock_out IS NULL', [s.id])[0]
        return { ...s, clocked_in: !!open }
      })
      res.json({ owner: owner.name, staff: out })
    } catch (e) {
      console.error('[Attendance] public roster error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  app.post('/api/clock-in/public', (req, res) => {
    try {
      ensureTable()
      const ownerEmail = String(req.body?.o || '').trim()
      if (!ownerEmail) return res.status(400).json({ error: 'Missing owner' })
      const result = doClock(ownerEmail, { staffId: req.body?.staffId, method: 'qr', note: 'public-qr' })
      if (result.error) return res.status(result.status || 400).json({ error: result.error })
      res.json(result)
    } catch (e) {
      console.error('[Attendance] public clock error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  // ── Who's clocked in right now ──
  app.get('/api/app/attendance/status', requireAuth, requireEntitlement, (req, res) => {
    ensureTable()
    const rows = query(
      `SELECT r.*, s.name AS staff_name, s.position FROM attendance_records r
       JOIN attendance_staff s ON s.id = r.staff_id
       WHERE r.email = ? AND r.clock_out IS NULL ORDER BY r.clock_in DESC`,
      [req.user.email]
    )
    res.json(withStaff(query, rows))
  })

  // ── Timesheet records (date range filter, optional staff filter) ──
  app.get('/api/app/attendance/records', requireAuth, requireEntitlement, (req, res) => {
    ensureTable()
    const { from, to, staff_id } = req.query
    let sql = 'SELECT r.* FROM attendance_records r JOIN attendance_staff s ON s.id = r.staff_id WHERE r.email = ?'
    const params = [req.user.email]
    if (from) { sql += ' AND r.clock_in >= ?'; params.push(`${from} 00:00:00`) }
    if (to) { sql += ' AND r.clock_in <= ?'; params.push(`${to} 23:59:59`) }
    if (staff_id) { sql += ' AND r.staff_id = ?'; params.push(parseInt(staff_id, 10)) }
    sql += ' ORDER BY r.clock_in DESC LIMIT 2000'
    const rows = query(sql, params)
    res.json(withStaff(query, rows))
  })

  // ── Per-staff summary over a range (days worked, total hours, avg/day) ──
  app.get('/api/app/attendance/summary', requireAuth, requireEntitlement, (req, res) => {
    ensureTable()
    const { from, to } = req.query
    const staff = query('SELECT id, name, position, active FROM attendance_staff WHERE email = ? ORDER BY name COLLATE NOCASE', [req.user.email])
    let sql = 'SELECT r.staff_id, r.clock_in, r.clock_out FROM attendance_records r WHERE r.email = ?'
    const params = [req.user.email]
    if (from) { sql += ' AND r.clock_in >= ?'; params.push(`${from} 00:00:00`) }
    if (to) { sql += ' AND r.clock_in <= ?'; params.push(`${to} 23:59:59`) }
    const records = query(sql, params)

    const byStaff = {}
    for (const s of staff) {
      byStaff[s.id] = {
        staff_id: s.id, name: s.name, position: s.position, active: s.active,
        days: 0, total_hours: 0, total_min: 0, late_days: 0, open: 0,
      }
    }
    const seenDays = {} // staff_id -> Set(day)
    for (const r of records) {
      const row = byStaff[r.staff_id]
      if (!row) continue
      if (!r.clock_out) { row.open++; continue }
      const mins = Math.max(0, Math.round((new Date(r.clock_out.replace(' ', 'T') + 'Z').getTime() - new Date(r.clock_in.replace(' ', 'T') + 'Z').getTime()) / 60000))
      row.total_min += mins
      row.total_hours = Math.round((row.total_min / 60) * 100) / 100
      const day = r.clock_in.slice(0, 10)
      if (!seenDays[r.staff_id]) seenDays[r.staff_id] = new Set()
      if (!seenDays[r.staff_id].has(day)) { seenDays[r.staff_id].add(day); row.days++ }
    }
    res.json(Object.values(byStaff).sort((a, b) => b.total_min - a.total_min))
  })

  // ── Correction: admin edits a record's times ──
  app.put('/api/app/attendance/records/:id', requireAuth, requireEntitlement, (req, res) => {
    try {
      ensureTable()
      const rec = query('SELECT * FROM attendance_records WHERE id = ? AND email = ?', [req.params.id, req.user.email])[0]
      if (!rec) return res.status(404).json({ error: 'Record not found' })
      const ts = (v) => {
        if (!v) return null
        const s = String(v).trim()
        // Accept "YYYY-MM-DD HH:MM" (assume :00) or full "YYYY-MM-DD HH:MM:SS"
        const full = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(s)
        if (!full) return null
        return s.length === 16 ? `${s}:00` : s
      }
      const clockIn = ts(req.body?.clock_in)
      const clockOut = ts(req.body?.clock_out)
      if (clockIn) run('UPDATE attendance_records SET clock_in = ? WHERE id = ?', [clockIn, rec.id])
      if (req.body?.clock_out !== undefined) {
        run('UPDATE attendance_records SET clock_out = ? WHERE id = ?', [clockOut, rec.id])
      }
      const note = req.body?.note !== undefined ? String(req.body.note).trim().slice(0, 500) : null
      if (note !== null) run('UPDATE attendance_records SET note = ? WHERE id = ?', [note, rec.id])
      if (saveDb) saveDb()
      const updated = query('SELECT * FROM attendance_records WHERE id = ?', [rec.id])[0]
      res.json(withStaff(query, [updated])[0])
    } catch (e) {
      console.error('[Attendance] record update error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  app.delete('/api/app/attendance/records/:id', requireAuth, requireEntitlement, (req, res) => {
    ensureTable()
    const rec = query('SELECT id FROM attendance_records WHERE id = ? AND email = ?', [req.params.id, req.user.email])[0]
    if (!rec) return res.status(404).json({ error: 'Record not found' })
    run('DELETE FROM attendance_records WHERE id = ? AND email = ?', [req.params.id, req.user.email])
    if (saveDb) saveDb()
    res.json({ ok: true })
  })

  // ── CSV export ──
  app.get('/api/app/attendance/export', requireAuth, requireEntitlement, (req, res) => {
    ensureTable()
    const { from, to } = req.query
    let sql = 'SELECT r.* FROM attendance_records r JOIN attendance_staff s ON s.id = r.staff_id WHERE r.email = ?'
    const params = [req.user.email]
    if (from) { sql += ' AND r.clock_in >= ?'; params.push(`${from} 00:00:00`) }
    if (to) { sql += ' AND r.clock_in <= ?'; params.push(`${to} 23:59:59`) }
    sql += ' ORDER BY r.clock_in ASC'
    const rows = withStaff(query, query(sql, params))
    const lines = ['Staff,Position,Date,Clock In,Clock Out,Hours,Method,Note']
    for (const r of rows) {
      const date = (r.clock_in || '').slice(0, 10)
      const h = String(r.hours).replace('.', ',') // SA Excel decimal comma
      lines.push(`"${r.staff_name}","${r.staff_position}",${date},"${r.clock_in}","${r.clock_out || ''}",${h},${r.method},"${(r.note || '').replace(/"/g, '""')}"`)
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="attendance-${from || 'all'}-${to || ''}.csv"`)
    res.send(lines.join('\n'))
  })

  return {}
}
