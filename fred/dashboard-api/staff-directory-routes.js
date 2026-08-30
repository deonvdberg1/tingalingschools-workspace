// ── Staff Directory (central staff management for every client/business) ──
// One place to upload staff, set their role (staff | admin) and choose which
// apps each person can use. Apps pull from this directory — no re-adding.
// Attendance auto-links: a member granted 'attendance' gets an attendance
// roster row + code so the clock app just works.

import express from 'express'
import crypto from 'crypto'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileP = promisify(execFile)

// ── Email via gog CLI (Gmail, info@autoeffortless.com) ──
async function sendEmail(to, subject, body) {
  try {
    await execFileP('/opt/homebrew/bin/gog', ['gmail', 'send', '--account', 'info@autoeffortless.com', '--to', to, '--subject', subject, '--body', body], { timeout: 30000 })
    return true
  } catch (e) {
    console.warn('[StaffDirectory] email failed to', to, ':', e.message?.slice(0, 120))
    return false
  }
}

// ── Create a portal account for a directory member ──
// role 'staff' → users.role 'staff' (limited staff portal)
// role 'admin' → users.role 'client_admin' with the owner's client_id (full admin portal)
async function createMemberAccount({ query, run, saveDb }, { name, email, role, ownerEmail, ownerClientId }) {
  const em = String(email || '').trim().toLowerCase()
  if (!em || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return { user: null, reason: 'no-email' }
  if (em === String(ownerEmail || '').trim().toLowerCase()) return { user: null, reason: 'owner' }
  const existing = query('SELECT * FROM users WHERE email = ?', [em])[0]
  if (existing) return { user: existing, reason: 'exists' }

  const password = crypto.randomBytes(6).toString('base64url').slice(0, 10)
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex')
  const portalRole = role === 'admin' ? 'client_admin' : 'staff'
  run('INSERT INTO users (email, password, name, role, client_id) VALUES (?, ?, ?, ?, ?)',
    [em, passwordHash, name || em.split('@')[0], portalRole, role === 'admin' ? (ownerClientId || null) : null])
  if (saveDb) saveDb()
  const user = query('SELECT * FROM users WHERE email = ?', [em])[0]

  const roleLine = role === 'admin'
    ? 'You have admin access to your business apps.'
    : 'Use it to open the apps your employer has given you.'
  const body = [
    `Hi ${user.name},`,
    '',
    role === 'admin'
      ? `Your admin account for ${ownerEmail.split('@')[0]} is ready.`
      : `Your staff account for ${ownerEmail.split('@')[0]} is ready.`,
    roleLine,
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
    '— The AutoEffortless Team',
  ].join('\n')
  const emailSent = await sendEmail(em, role === 'admin' ? 'Your admin account is ready ✅' : 'Your staff account is ready ✅', body)
  return { user, emailSent }
}

export default function setupStaffDirectoryRoutes(app, { query, run, saveDb, requireAuth }) {
  let tableChecked = false
  function ensureTable() {
    if (tableChecked) return
    run(`CREATE TABLE IF NOT EXISTS staff_directory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_email TEXT NOT NULL,
      client_id INTEGER,
      name TEXT NOT NULL,
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      position TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'staff',
      active INTEGER DEFAULT 1,
      user_id INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    )`)
    run(`CREATE TABLE IF NOT EXISTS staff_directory_apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      owner_email TEXT NOT NULL,
      product_key TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )`)
    run('CREATE UNIQUE INDEX IF NOT EXISTS idx_sd_apps ON staff_directory_apps(staff_id, product_key)')
    if (saveDb) saveDb()
    tableChecked = true
  }

  function requireDirectoryAccess(req, res, next) {
    // Clients (client_admin) manage their own directory; overlord manages all
    if (req.user.role === 'overlord') return next()
    if (req.user.role === 'client_admin') return next()
    return res.status(403).json({ error: 'Not allowed' })
  }

  const APP_NAME_MAP = {
    attendance: 'Attendance & Time',
    whatsapp: 'WhatsApp AI Assistant',
    instagram: 'Instagram Auto-Reply',
    tracking: 'Live Delivery Tracking',
    site_analytics: 'Website Analytics',
    docchat: 'DocChat',
    'contract-generator': 'Contract & Quote Generator',
    'content-studio': 'AI Content Studio',
    'website-builder': 'AI Website Builder',
    'form-builder': 'AI Form Builder',
    'invoice-app': 'Invoice & Quote App',
    'simple-crm': 'Simple CRM',
    'stock-inventory': 'Stock & Inventory',
    'small-team-hr': 'Small Team HR',
    'booking-calendar': 'Booking & Calendar',
    'school-admin': 'School Admin',
    'church-manager': 'Church / Org Manager',
    'property-manager': 'Property Manager',
    'salon-booking': 'Salon / Clinic Booking',
    'sports-club-manager': 'Sports Club Manager',
  }

  // ── The owner's apps (client products or purchases) — what can be granted ──
  function ownerApps(user) {
    const out = []
    const seen = new Set()
    if (user.client_id) {
      for (const p of query("SELECT product_key, product_name FROM client_products WHERE client_id = ? AND status = 'active'", [user.client_id])) {
        out.push({ key: p.product_key, name: p.product_name || APP_NAME_MAP[p.product_key] || p.product_key })
        seen.add(p.product_key)
      }
    }
    for (const p of query("SELECT DISTINCT product_key FROM purchases WHERE email = ? AND status = 'active'", [user.email])) {
      if (!seen.has(p.product_key)) out.push({ key: p.product_key, name: APP_NAME_MAP[p.product_key] || p.product_key })
    }
    // Attendance is always grantable (the directory powers the clock app)
    if (!out.some((o) => o.key === 'attendance')) out.unshift({ key: 'attendance', name: 'Attendance & Time' })
    return out
  }

  // ── Provision an attendance roster row for a member granted 'attendance' ──
  function provisionAttendance(member) {
    const existing = query('SELECT id FROM attendance_staff WHERE email = ? AND user_id = ?', [member.owner_email, member.user_id || 0])
    if (existing[0]) return existing[0].id
    const code = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let newCode = ''
    for (let i = 0; i < 6; i++) newCode += code[crypto.randomInt(code.length)]
    run('INSERT INTO attendance_staff (email, name, position, phone, code, staff_email, user_id, scan_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [member.owner_email, member.name, member.position || '', member.phone || '', newCode, member.email || '', member.user_id || null, crypto.randomBytes(16).toString('hex')])
    if (saveDb) saveDb()
    return query('SELECT id FROM attendance_staff WHERE email = ? ORDER BY id DESC LIMIT 1', [member.owner_email])[0].id
  }

  function unprovisionAttendance(member) {
    if (!member.user_id) return
    run('UPDATE attendance_records SET clock_out = datetime(\'now\') WHERE staff_id IN (SELECT id FROM attendance_staff WHERE user_id = ? AND clock_out IS NULL)', [member.user_id])
    run('DELETE FROM attendance_staff WHERE email = ? AND user_id = ?', [member.owner_email, member.user_id])
    if (saveDb) saveDb()
  }

  // ── List directory (with per-person app access) ──
  app.get('/api/staff-directory', requireAuth, requireDirectoryAccess, (req, res) => {
    try {
      ensureTable()
      const owner = req.user.role === 'overlord' ? (req.query.owner || '') : req.user.email
      const rows = query('SELECT * FROM staff_directory WHERE owner_email = ? ORDER BY name COLLATE NOCASE', [owner])
      const apps = ownerApps(owner ? { email: owner, client_id: query('SELECT client_id FROM users WHERE email = ?', [owner])[0]?.client_id || null } : req.user)
      const out = rows.map((m) => {
        const grants = query('SELECT product_key FROM staff_directory_apps WHERE staff_id = ? AND enabled = 1', [m.id])
        return { ...m, apps: grants.map((g) => g.product_key) }
      })
      res.json({ staff: out, available_apps: apps })
    } catch (e) {
      console.error('[StaffDirectory] list error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  // ── Add one or many staff members ──
  app.post('/api/staff-directory', requireAuth, requireDirectoryAccess, async (req, res) => {
    try {
      ensureTable()
      const items = Array.isArray(req.body?.staff) ? req.body.staff : [req.body]
      if (!items.length || items.length > 100) return res.status(400).json({ error: 'Send 1–100 staff' })
      const ownerClientId = query('SELECT client_id FROM users WHERE email = ?', [req.user.email])[0]?.client_id || null
      const created = []
      const errors = []
      let accounts = 0
      let emailsSent = 0
      for (const it of items) {
        try {
          const name = String(it?.name || '').trim().slice(0, 120)
          if (!name) { errors.push({ name: it?.name || '?', error: 'Name is required' }); continue }
          const role = it?.role === 'admin' ? 'admin' : 'staff'
          const email = String(it?.email || '').trim().toLowerCase().slice(0, 200)
          const phone = String(it?.phone || '').trim().slice(0, 40)
          const position = String(it?.position || '').trim().slice(0, 120)
          const appKeys = Array.isArray(it?.apps) ? it.apps.filter((k) => typeof k === 'string').slice(0, 50) : []

          const acct = await createMemberAccount({ query, run, saveDb }, { name, email, role, ownerEmail: req.user.email, ownerClientId })
          if (acct?.user) accounts++
          if (acct?.emailSent) emailsSent++

          run('INSERT INTO staff_directory (owner_email, client_id, name, email, phone, position, role, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.email, ownerClientId, name, email, phone, position, role, acct?.user?.id || null])
          if (saveDb) saveDb()
          const member = query('SELECT * FROM staff_directory WHERE owner_email = ? ORDER BY id DESC LIMIT 1', [req.user.email])[0]

          for (const key of appKeys) {
            run('INSERT OR IGNORE INTO staff_directory_apps (staff_id, owner_email, product_key) VALUES (?, ?, ?)', [member.id, req.user.email, key])
            run('UPDATE staff_directory_apps SET enabled = 1 WHERE staff_id = ? AND product_key = ?', [member.id, key])
          }
          if (saveDb) saveDb()
          // Attendance auto-link
          if (appKeys.includes('attendance') && member.user_id) provisionAttendance(member)
          created.push({ ...member, apps: appKeys })
        } catch (e) {
          errors.push({ name: it?.name || '?', error: e.message })
        }
      }
      res.json({ created, errors, accounts_created: accounts, emails_sent: emailsSent })
    } catch (e) {
      console.error('[StaffDirectory] add error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  // ── Update a member (name/phone/position/role/active) ──
  app.put('/api/staff-directory/:id', requireAuth, requireDirectoryAccess, (req, res) => {
    try {
      ensureTable()
      const member = query('SELECT * FROM staff_directory WHERE id = ? AND owner_email = ?', [req.params.id, req.user.email])[0]
      if (!member) return res.status(404).json({ error: 'Staff member not found' })
      const name = String(req.body?.name ?? member.name).trim().slice(0, 120) || member.name
      const phone = String(req.body?.phone ?? member.phone).trim().slice(0, 40)
      const position = String(req.body?.position ?? member.position).trim().slice(0, 120)
      const role = req.body?.role === 'admin' ? 'admin' : (req.body?.role === 'staff' ? 'staff' : member.role)
      const active = req.body?.active === undefined ? member.active : (req.body.active ? 1 : 0)
      run('UPDATE staff_directory SET name = ?, phone = ?, position = ?, role = ?, active = ? WHERE id = ? AND owner_email = ?',
        [name, phone, position, role, active, req.params.id, req.user.email])
      if (saveDb) saveDb()
      // Keep the linked portal account's role in sync when toggled
      if (member.user_id && req.body?.role && role !== member.role) {
        const u = query('SELECT * FROM users WHERE id = ?', [member.user_id])[0]
        if (u && u.role !== 'overlord') {
          const portalRole = role === 'admin' ? 'client_admin' : 'staff'
          const clientId = role === 'admin' ? (u.client_id || query('SELECT client_id FROM users WHERE email = ?', [req.user.email])[0]?.client_id || null) : null
          run('UPDATE users SET role = ?, client_id = ? WHERE id = ?', [portalRole, clientId, member.user_id])
          if (saveDb) saveDb()
        }
      }
      // Deactivate → close open shifts + remove attendance link
      if (!active && member.active) unprovisionAttendance(member)
      res.json(query('SELECT * FROM staff_directory WHERE id = ?', [req.params.id])[0])
    } catch (e) {
      console.error('[StaffDirectory] update error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  // ── Set a member's app access (full replace of their grant list) ──
  app.put('/api/staff-directory/:id/apps', requireAuth, requireDirectoryAccess, (req, res) => {
    try {
      ensureTable()
      const member = query('SELECT * FROM staff_directory WHERE id = ? AND owner_email = ?', [req.params.id, req.user.email])[0]
      if (!member) return res.status(404).json({ error: 'Staff member not found' })
      const appKeys = Array.isArray(req.body?.apps) ? req.body.apps.filter((k) => typeof k === 'string').slice(0, 50) : []
      // Valid keys only (owner's apps)
      const valid = new Set(ownerApps({ email: req.user.email, client_id: query('SELECT client_id FROM users WHERE email = ?', [req.user.email])[0]?.client_id || null }).map((a) => a.key))
      const finalKeys = appKeys.filter((k) => valid.has(k))
      run('DELETE FROM staff_directory_apps WHERE staff_id = ?', [member.id])
      for (const key of finalKeys) {
        run('INSERT OR IGNORE INTO staff_directory_apps (staff_id, owner_email, product_key) VALUES (?, ?, ?)', [member.id, req.user.email, key])
      }
      if (saveDb) saveDb()
      // Attendance auto-link/unlink
      if (finalKeys.includes('attendance') && member.user_id) provisionAttendance(member)
      if (!finalKeys.includes('attendance')) unprovisionAttendance(member)
      res.json({ id: member.id, apps: finalKeys })
    } catch (e) {
      console.error('[StaffDirectory] apps error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  // ── Remove a member ──
  app.delete('/api/staff-directory/:id', requireAuth, requireDirectoryAccess, (req, res) => {
    try {
      ensureTable()
      const member = query('SELECT * FROM staff_directory WHERE id = ? AND owner_email = ?', [req.params.id, req.user.email])[0]
      if (!member) return res.status(404).json({ error: 'Staff member not found' })
      unprovisionAttendance(member)
      run('DELETE FROM staff_directory_apps WHERE staff_id = ?', [member.id])
      run('DELETE FROM staff_directory WHERE id = ?', [member.id])
      if (saveDb) saveDb()
      res.json({ ok: true })
    } catch (e) {
      console.error('[StaffDirectory] delete error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  // ── Staff side: my granted apps (per-person, via directory) ──
  app.get('/api/staff-directory/my-apps', requireAuth, (req, res) => {
    try {
      ensureTable()
      if (req.user.role !== 'staff') return res.status(403).json({ error: 'Staff account required' })
      const member = query('SELECT * FROM staff_directory WHERE user_id = ?', [req.user.id])[0]
      // Legacy fallback: attendance owner-wide staff_apps (pre-directory staff)
      const fallback = query(
        "SELECT sa.product_key FROM staff_apps sa JOIN attendance_staff as2 ON as2.user_id = ? WHERE sa.owner_email = as2.email AND sa.enabled = 1",
        [req.user.id]
      ).map((r) => r.product_key)
      const grants = member
        ? query('SELECT product_key FROM staff_directory_apps WHERE staff_id = ? AND enabled = 1', [member.id]).map((r) => r.product_key)
        : fallback
      const registry = new Map(STAFF_APPS_MAP.map((a) => [a.key, a]))
      res.json(grants.map((key) => {
        const reg = registry.get(key)
        return { key, name: APP_NAME_MAP[key] || key, icon: reg?.icon || 'box', staffPath: reg?.staffPath || null, blurb: reg?.blurb || 'Access granted — the staff view is on its way.' }
      }))
    } catch (e) {
      console.error('[StaffDirectory] my-apps error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  return {}
}

// Registry of apps with a STAFF side (staffPath) — same as attendance-routes
const STAFF_APPS_MAP = [
  { key: 'attendance', name: 'Attendance & Time', icon: 'clock', staffPath: '/staff-clock', blurb: 'Clock in and out and view your shifts.' },
]
