// ─────────────────────────────────────────────────────────────────────────
// School-portal clock in/out (Ting-A-Ling)
//
// Teachers clock in/out on the SCHOOL's own site (tingalingschools.com) using
// the accounts they already have (tingalingschools.com/teacher). They scan a
// printed QR at the entrance → /clock → tap Clock in / Clock out.
//
// It reuses the proven Attendance engine (attendance_staff / attendance_records)
// but is keyed to the school portal teacher accounts — the school office sees
// everything in their own portal. No separate AutoEffortless login needed.
// ─────────────────────────────────────────────────────────────────────────

import crypto from 'node:crypto';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';

const SCHOOL_CLIENT_ID = 6;
const PUBLIC_BASE = 'https://tingalingschools.com';

function genCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += alphabet[crypto.randomInt(alphabet.length)];
  return out;
}

const parseUtc = (s) => (s ? new Date(String(s).replace(' ', 'T') + 'Z').getTime() : null);

export default function setupPortalClockRoutes(app, { query, run, saveDb, requireAuth, requireRole }) {
  let tableChecked = false;

  function ensureTables() {
    if (tableChecked) return;
    run(`CREATE TABLE IF NOT EXISTS attendance_staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      position TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      code TEXT UNIQUE NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )`);
    const cols = query('PRAGMA table_info(attendance_staff)').map((c) => c.name);
    if (!cols.includes('staff_email')) run("ALTER TABLE attendance_staff ADD COLUMN staff_email TEXT DEFAULT ''");
    if (!cols.includes('user_id')) run('ALTER TABLE attendance_staff ADD COLUMN user_id INTEGER');
    if (!cols.includes('scan_token')) run('ALTER TABLE attendance_staff ADD COLUMN scan_token TEXT');
    run(`CREATE TABLE IF NOT EXISTS attendance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      clock_in TEXT NOT NULL,
      clock_out TEXT,
      method TEXT DEFAULT 'tap',
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )`);
    run('CREATE INDEX IF NOT EXISTS idx_att_records_staff ON attendance_records(staff_id)');
    run('CREATE INDEX IF NOT EXISTS idx_att_records_email ON attendance_records(email, clock_in)');
    if (saveDb) saveDb();
    tableChecked = true;
  }

  const isAdmin = (role) => role === 'overlord' || role === 'client_admin';

  // The attendance tables are scoped by "owner email" = the client's admin login.
  function ownerEmailFor(clientId) {
    if (!clientId) return null;
    const u = query("SELECT email FROM users WHERE client_id = ? AND role = 'client_admin' ORDER BY id LIMIT 1", [clientId])[0];
    if (u) return u.email;
    const c = query('SELECT email FROM clients WHERE id = ?', [clientId])[0];
    return c ? c.email : null;
  }
  const targetClient = (req) => (req.user.role === 'overlord' ? SCHOOL_CLIENT_ID : req.user.client_id);
  const ownerFor = (req) => ownerEmailFor(targetClient(req)) || req.user.email;

  // Find (or create) the attendance_staff row that represents this teacher.
  function staffRow(user) {
    ensureTables();
    const owner = ownerEmailFor(user.client_id) || user.email;
    let row = query('SELECT * FROM attendance_staff WHERE staff_email = ? AND email = ?', [user.email, owner])[0];
    if (!row) row = query('SELECT * FROM attendance_staff WHERE user_id = ? AND email = ?', [user.id, owner])[0];
    if (!row) {
      let code = genCode();
      let guard = 0;
      while (query('SELECT id FROM attendance_staff WHERE code = ?', [code]).length && guard++ < 50) code = genCode();
      run('INSERT INTO attendance_staff (email, name, position, staff_email, code, scan_token, user_id, active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
        [owner, user.name || 'Teacher', '', user.email, code, crypto.randomBytes(16).toString('hex'), user.id]);
      if (saveDb) saveDb();
      row = query('SELECT * FROM attendance_staff WHERE staff_email = ? AND email = ?', [user.email, owner])[0];
    } else if (row.user_id !== user.id) {
      run('UPDATE attendance_staff SET user_id = ? WHERE id = ?', [user.id, row.id]);
      if (saveDb) saveDb();
      row.user_id = user.id;
    }
    return row;
  }

  function decorate(rows) {
    return rows.map((r) => {
      const s = r.staff_id ? query('SELECT name, position FROM attendance_staff WHERE id = ?', [r.staff_id])[0] : null;
      const a = parseUtc(r.clock_in), b = parseUtc(r.clock_out);
      const mins = a && b ? Math.max(0, Math.round((b - a) / 60000)) : 0;
      return {
        id: r.id,
        staff_id: r.staff_id,
        name: s?.name || 'Unknown',
        position: s?.position || '',
        clock_in: r.clock_in,
        clock_out: r.clock_out || null,
        open: !r.clock_out,
        minutes: mins,
        hours: Math.round((mins / 60) * 100) / 100,
        method: r.method || '',
        note: r.note || '',
      };
    });
  }

  // ── Teacher: my clock status + history ──
  app.get('/api/portal/clock/me', requireAuth, requireRole('staff'), (req, res) => {
    const s = staffRow(req.user);
    const open = query('SELECT * FROM attendance_records WHERE staff_id = ? AND clock_out IS NULL ORDER BY id DESC LIMIT 1', [s.id])[0];
    const today = query("SELECT * FROM attendance_records WHERE staff_id = ? AND date(clock_in) = date('now') ORDER BY id ASC", [s.id]);
    const recent = query('SELECT * FROM attendance_records WHERE staff_id = ? ORDER BY id DESC LIMIT 12', [s.id]);
    const t = decorate(today);
    const openRec = open ? decorate([open])[0] : null;
    let liveMinutes = 0;
    if (openRec) liveMinutes = Math.max(0, Math.round((Date.now() - parseUtc(openRec.clock_in)) / 60000));
    res.json({
      name: s.name,
      code: s.code,
      onShift: !!open,
      since: open ? open.clock_in : null,
      todayMinutes: t.reduce((n, r) => n + r.minutes, 0) + liveMinutes,
      today: t,
      recent: decorate(recent),
    });
  });

  // ── Teacher: clock in / out (auto-toggles) ──
  app.post('/api/portal/clock', requireAuth, requireRole('staff'), (req, res) => {
    const s = staffRow(req.user);
    if (!s.active) return res.status(400).json({ error: 'Your clock-in access has been disabled by the office.' });
    const method = String((req.body && req.body.method) || 'portal').slice(0, 10);
    const note = String((req.body && req.body.note) || '').slice(0, 200);
    const open = query('SELECT * FROM attendance_records WHERE staff_id = ? AND clock_out IS NULL ORDER BY id DESC LIMIT 1', [s.id])[0];
    if (open) {
      run("UPDATE attendance_records SET clock_out = datetime('now'), method = ?, note = ? WHERE id = ?", [method, note, open.id]);
      if (saveDb) saveDb();
      const rec = decorate([query('SELECT * FROM attendance_records WHERE id = ?', [open.id])[0]])[0];
      return res.json({ action: 'out', record: rec, minutes: rec.minutes });
    }
    run("INSERT INTO attendance_records (staff_id, email, clock_in, method, note) VALUES (?, ?, datetime('now'), ?, ?)", [s.id, s.email, method, note]);
    if (saveDb) saveDb();
    const rec = decorate([query('SELECT * FROM attendance_records WHERE staff_id = ? ORDER BY id DESC LIMIT 1', [s.id])[0]])[0];
    res.json({ action: 'in', record: rec });
  });

  // ── Admin: who's on shift now + today's records ──
  app.get('/api/portal/clock/today', requireAuth, requireRole('overlord', 'client_admin'), (req, res) => {
    ensureTables();
    const owner = ownerFor(req);
    const open = query("SELECT * FROM attendance_records WHERE email = ? AND clock_out IS NULL ORDER BY clock_in ASC", [owner]);
    const today = query("SELECT * FROM attendance_records WHERE email = ? AND date(clock_in) = date('now') ORDER BY clock_in ASC", [owner]);
    // "Teachers set up" = the school-portal teacher logins (not just those who
    // happen to have an attendance row yet).
    const cid = targetClient(req);
    const teachers = query("SELECT id, name, email FROM users WHERE client_id = ? AND role = 'staff' AND (status IS NULL OR status = 'active') ORDER BY name COLLATE NOCASE", [cid]);
    const onNow = decorate(open).map((r) => ({ ...r, minutes: Math.max(0, Math.round((Date.now() - parseUtc(r.clock_in)) / 60000)) }));
    res.json({
      staffCount: teachers.length,
      onShift: onNow,
      today: decorate(today),
      staff: teachers,
    });
  });

  // ── Admin: records over a range ──
  app.get('/api/portal/clock/records', requireAuth, requireRole('overlord', 'client_admin'), (req, res) => {
    ensureTables();
    const owner = ownerFor(req);
    const from = req.query.from, to = req.query.to;
    let sql = 'SELECT * FROM attendance_records WHERE email = ?';
    const params = [owner];
    if (from) { sql += ' AND clock_in >= ?'; params.push(`${from} 00:00:00`); }
    if (to) { sql += ' AND clock_in <= ?'; params.push(`${to} 23:59:59`); }
    sql += ' ORDER BY clock_in DESC LIMIT 1000';
    res.json(decorate(query(sql, params)));
  });

  // ── Admin: CSV export ──
  app.get('/api/portal/clock/export', requireAuth, requireRole('overlord', 'client_admin'), (req, res) => {
    ensureTables();
    const owner = ownerFor(req);
    const from = req.query.from, to = req.query.to;
    let sql = 'SELECT * FROM attendance_records WHERE email = ?';
    const params = [owner];
    if (from) { sql += ' AND clock_in >= ?'; params.push(`${from} 00:00:00`); }
    if (to) { sql += ' AND clock_in <= ?'; params.push(`${to} 23:59:59`); }
    sql += ' ORDER BY clock_in DESC';
    const rows = decorate(query(sql, params));
    const head = ['Name', 'Position', 'Date', 'Clock in (SAST)', 'Clock out (SAST)', 'Hours', 'Method', 'Note'];
    const sast = (v) => (v ? new Date(String(v).replace(' ', 'T') + 'Z').toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' }) : '');
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [head.join(','), ...rows.map((r) => [r.name, r.position, String(r.clock_in).slice(0, 10), sast(r.clock_in), sast(r.clock_out), r.hours, r.method, r.note].map(esc).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="tingaling-attendance.csv"');
    res.send(csv);
  });

  // ── Admin: the station QR (what teachers scan at the door) ──
  app.get('/api/portal/clock/station-qr', requireAuth, requireRole('overlord', 'client_admin'), async (req, res) => {
    try {
      const url = `${PUBLIC_BASE}/clock?s=station`;
      const qr = await QRCode.toDataURL(url, { width: 512, margin: 2, errorCorrectionLevel: 'M' });
      res.json({ url, qr });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Admin: printable A4 poster (school branding) ──
  app.get('/api/portal/clock/poster.pdf', requireAuth, requireRole('overlord', 'client_admin'), async (req, res) => {
    try {
      const url = `${PUBLIC_BASE}/clock?s=station`;
      const qrPng = await QRCode.toBuffer(url, { width: 640, margin: 2, errorCorrectionLevel: 'M' });
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 48 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="tingaling-clock-in-poster.pdf"');
      doc.pipe(res);
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f0fdfa');
      doc.fillColor('#0f766e').font('Helvetica-Bold').fontSize(46).text('CLOCK IN / OUT', { align: 'center' });
      doc.moveDown(0.2);
      doc.fillColor('#475569').font('Helvetica').fontSize(17)
        .text('Teachers: scan this with your phone camera when you arrive and when you leave.', { align: 'center', width: 560 });
      doc.moveDown(0.4);
      doc.fillColor('#0d9488').fontSize(14).text('Opens your clock page — then tap Clock in or Clock out.', { align: 'center' });
      doc.image(qrPng, (doc.page.width - 300) / 2, doc.y + 14, { width: 300 });
      doc.moveDown(0.2);
      doc.fillColor('#94a3b8').font('Helvetica').fontSize(12)
        .text('Ting-A-Ling Schools · Meerensee, Richards Bay', (doc.page.width - 400) / 2 + 0, doc.page.height - 70, { align: 'center', width: 400 });
      doc.end();
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  console.log('[School Clock] Routes loaded');
}
