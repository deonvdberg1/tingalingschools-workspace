// ─────────────────────────────────────────────────────────────────────────
// Portal routes — Ting-A-Ling independent dashboard (staff / admin / parents)
// Backend for the school portal on tingalingschools.com
// Data is client-scoped. Public parent registration scoped to SCHOOL_CLIENT_ID.
// ─────────────────────────────────────────────────────────────────────────

const SCHOOL_CLIENT_ID = 6; // Ting-A-Ling Schools

export default function setupPortalRoutes(app, { query, run, saveDb, requireAuth, requireRole, hashPassword }) {

  const isAdmin = (role) => role === 'overlord' || role === 'client_admin';
  const scopeClient = (user) => (user.role === 'overlord' ? null : user.client_id);

  // ── Announcements ──
  app.get('/api/portal/announcements', requireAuth, (req, res) => {
    const cid = scopeClient(req.user);
    let rows;
    if (cid) {
      if (req.user.role === 'staff') {
        rows = query("SELECT * FROM portal_announcements WHERE client_id = ? AND audience IN ('all','staff') ORDER BY created_at DESC", [cid]);
      } else if (req.user.role === 'parent') {
        rows = query("SELECT * FROM portal_announcements WHERE client_id = ? AND audience IN ('all','parents') ORDER BY created_at DESC", [cid]);
      } else {
        rows = query('SELECT * FROM portal_announcements WHERE client_id = ? ORDER BY created_at DESC', [cid]);
      }
    } else {
      rows = query('SELECT * FROM portal_announcements ORDER BY created_at DESC');
    }
    res.json(rows);
  });

  app.post('/api/portal/announcements', requireAuth, requireRole('overlord', 'client_admin'), (req, res) => {
    const { title, body, audience = 'all' } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Title and body required' });
    const cid = req.user.role === 'overlord' ? (req.body.client_id || SCHOOL_CLIENT_ID) : req.user.client_id;
    const info = run('INSERT INTO portal_announcements (client_id, title, body, audience, created_by) VALUES (?, ?, ?, ?, ?)',
      [cid, title, body, audience, req.user.name || req.user.email]);
    saveDb();
    const id = query('SELECT id FROM portal_announcements ORDER BY id DESC LIMIT 1')[0].id;
    res.status(201).json({ id, client_id: cid, title, body, audience, created_by: req.user.name || req.user.email });
  });

  app.delete('/api/portal/announcements/:id', requireAuth, requireRole('overlord', 'client_admin'), (req, res) => {
    const cid = scopeClient(req.user);
    if (cid) {
      const existing = query('SELECT id FROM portal_announcements WHERE id = ? AND client_id = ?', [req.params.id, cid]);
      if (existing.length === 0) return res.status(404).json({ error: 'Not found' });
    }
    run('DELETE FROM portal_announcements WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ ok: true });
  });

  // ── Events ──
  app.get('/api/portal/events', requireAuth, (req, res) => {
    const cid = scopeClient(req.user);
    const rows = cid
      ? query('SELECT * FROM portal_events WHERE client_id = ? ORDER BY event_date ASC', [cid])
      : query('SELECT * FROM portal_events ORDER BY event_date ASC');
    res.json(rows);
  });

  app.post('/api/portal/events', requireAuth, requireRole('overlord', 'client_admin'), (req, res) => {
    const { title, event_date, description = '' } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const cid = req.user.role === 'overlord' ? (req.body.client_id || SCHOOL_CLIENT_ID) : req.user.client_id;
    run('INSERT INTO portal_events (client_id, title, event_date, description) VALUES (?, ?, ?, ?)',
      [cid, title, event_date || null, description]);
    saveDb();
    const id = query('SELECT id FROM portal_events ORDER BY id DESC LIMIT 1')[0].id;
    res.status(201).json({ id, client_id: cid, title, event_date: event_date || null, description });
  });

  app.delete('/api/portal/events/:id', requireAuth, requireRole('overlord', 'client_admin'), (req, res) => {
    const cid = scopeClient(req.user);
    if (cid) {
      const existing = query('SELECT id FROM portal_events WHERE id = ? AND client_id = ?', [req.params.id, cid]);
      if (existing.length === 0) return res.status(404).json({ error: 'Not found' });
    }
    run('DELETE FROM portal_events WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ ok: true });
  });

  // ── Leave requests (staff) ──
  app.post('/api/portal/leave', requireAuth, requireRole('staff'), (req, res) => {
    const { start_date, end_date, reason = '' } = req.body;
    if (!start_date || !end_date) return res.status(400).json({ error: 'Start and end dates required' });
    run('INSERT INTO leave_requests (client_id, user_id, user_name, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.client_id, req.user.id, req.user.name, start_date, end_date, reason, 'pending']);
    saveDb();
    const id = query('SELECT id FROM leave_requests ORDER BY id DESC LIMIT 1')[0].id;
    res.status(201).json({ id, status: 'pending' });
  });

  app.get('/api/portal/leave/mine', requireAuth, requireRole('staff'), (req, res) => {
    res.json(query('SELECT * FROM leave_requests WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]));
  });

  app.get('/api/portal/leave', requireAuth, requireRole('overlord', 'client_admin'), (req, res) => {
    const cid = scopeClient(req.user);
    const rows = cid
      ? query('SELECT * FROM leave_requests WHERE client_id = ? ORDER BY created_at DESC', [cid])
      : query('SELECT * FROM leave_requests ORDER BY created_at DESC');
    res.json(rows);
  });

  app.put('/api/portal/leave/:id/status', requireAuth, requireRole('overlord', 'client_admin'), (req, res) => {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const cid = scopeClient(req.user);
    if (cid) {
      const existing = query('SELECT id FROM leave_requests WHERE id = ? AND client_id = ?', [req.params.id, cid]);
      if (existing.length === 0) return res.status(404).json({ error: 'Not found' });
    }
    run('UPDATE leave_requests SET status = ? WHERE id = ?', [status, req.params.id]);
    saveDb();
    res.json({ ok: true, status });
  });

  // ── Staff management (admin) ──
  app.post('/api/portal/staff', requireAuth, requireRole('overlord', 'client_admin'), (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
    const existing = query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });
    const cid = req.user.role === 'overlord' ? (req.body.client_id || SCHOOL_CLIENT_ID) : req.user.client_id;
    // Office-created logins are trusted → active immediately.
    run("INSERT INTO users (email, password, name, role, client_id, status) VALUES (?, ?, ?, ?, ?, 'active')",
      [email.toLowerCase().trim(), hashPassword(password), name, 'staff', cid]);
    saveDb();
    const id = query('SELECT id FROM users ORDER BY id DESC LIMIT 1')[0].id;
    res.status(201).json({ id, name, email: email.toLowerCase().trim(), role: 'staff', client_id: cid });
  });

  app.get('/api/portal/staff', requireAuth, requireRole('overlord', 'client_admin'), (req, res) => {
    const cid = scopeClient(req.user);
    const rows = cid
      ? query("SELECT id, name, email, role, status, client_id, created_at FROM users WHERE client_id = ? AND role = 'staff' ORDER BY created_at DESC", [cid])
      : query("SELECT id, name, email, role, status, client_id, created_at FROM users WHERE role = 'staff' ORDER BY created_at DESC");
    res.json(rows);
  });

  // ── Teacher self-registration (public, scoped to the school) ──
  // Access is INSTANT: the account is created active and the teacher is signed
  // straight in. (Mr D 2026-10-02: "they can just have access to their page
  // immediately please.") The office can still suspend/reject from the portal.
  app.post('/api/portal/register-teacher', (req, res) => {
    const { name, email, password, phone = '', position = '' } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
    if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const cleanEmail = String(email).toLowerCase().trim();
    const existing = query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length > 0) return res.status(409).json({ error: 'An account with this email already exists' });
    run('INSERT INTO users (email, password, name, role, client_id, status) VALUES (?, ?, ?, ?, ?, ?)',
      [cleanEmail, hashPassword(password), String(name).trim(), 'staff', SCHOOL_CLIENT_ID, 'active']);
    run('INSERT INTO portal_registrations (client_id, name, email, kind, phone, position) VALUES (?, ?, ?, ?, ?, ?)',
      [SCHOOL_CLIENT_ID, String(name).trim(), cleanEmail, 'teacher', String(phone).trim(), String(position).trim()]);
    saveDb();
    const user = query('SELECT * FROM users WHERE email = ?', [cleanEmail])[0];
    const token = Buffer.from(JSON.stringify({ id: user.id, role: user.role, client_id: user.client_id })).toString('base64');
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, client_id: user.client_id } });
  });

  // ── Teacher accounts — review/approve (admin) ──
  app.get('/api/portal/teachers', requireAuth, requireRole('overlord', 'client_admin'), (req, res) => {
    const cid = scopeClient(req.user);
    const rows = cid
      ? query("SELECT id, name, email, status, client_id, created_at FROM users WHERE client_id = ? AND role = 'staff' ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC", [cid])
      : query("SELECT id, name, email, status, client_id, created_at FROM users WHERE role = 'staff' ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC");
    res.json(rows);
  });

  app.put('/api/portal/teachers/:id/status', requireAuth, requireRole('overlord', 'client_admin'), (req, res) => {
    const { status } = req.body || {};
    if (!['active', 'pending', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const cid = scopeClient(req.user);
    if (cid) {
      const existing = query("SELECT id FROM users WHERE id = ? AND client_id = ? AND role = 'staff'", [req.params.id, cid]);
      if (existing.length === 0) return res.status(404).json({ error: 'Not found' });
    }
    run('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    saveDb();
    res.json({ ok: true, status });
  });

  app.delete('/api/portal/staff/:id', requireAuth, requireRole('overlord', 'client_admin'), (req, res) => {
    const cid = scopeClient(req.user);
    if (cid) {
      const existing = query("SELECT id FROM users WHERE id = ? AND client_id = ? AND role = 'staff'", [req.params.id, cid]);
      if (existing.length === 0) return res.status(404).json({ error: 'Not found' });
    }
    run('DELETE FROM users WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ ok: true });
  });

  // ── Parent registration (public, scoped to the school) ──
  app.post('/api/portal/register-parent', (req, res) => {
    const { name, email, password, child_name = '' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
    const existing = query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) return res.status(409).json({ error: 'An account with this email already exists' });
    run('INSERT INTO users (email, password, name, role, client_id) VALUES (?, ?, ?, ?, ?)',
      [email.toLowerCase().trim(), hashPassword(password), name, 'parent', SCHOOL_CLIENT_ID]);
    run('INSERT INTO portal_registrations (client_id, name, email, child_name) VALUES (?, ?, ?, ?)',
      [SCHOOL_CLIENT_ID, name, email.toLowerCase().trim(), child_name]);
    saveDb();
    const user = query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()])[0];
    const token = Buffer.from(JSON.stringify({ id: user.id, role: user.role, client_id: user.client_id })).toString('base64');
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, client_id: user.client_id } });
  });

  app.get('/api/portal/registrations', requireAuth, requireRole('overlord', 'client_admin'), (req, res) => {
    const cid = scopeClient(req.user);
    const rows = cid
      ? query('SELECT * FROM portal_registrations WHERE client_id = ? ORDER BY created_at DESC', [cid])
      : query('SELECT * FROM portal_registrations ORDER BY created_at DESC');
    res.json(rows);
  });

  // ── Login location (geofence) — admin configuration ──────────────────
  // Applies to staff/teacher sign-ins only. Staff may sign in when their
  // device is inside one of the configured locations (or on an allowed IP).
  const targetClient = (req, fallback = null) => {
    if (req.user.role === 'overlord') {
      const q = Number(req.query.client_id || (req.body && req.body.client_id));
      return Number.isFinite(q) && q > 0 ? q : (fallback || SCHOOL_CLIENT_ID);
    }
    return req.user.client_id;
  };

  app.get('/api/portal/login-locations', requireAuth, requireRole('overlord', 'client_admin'), (req, res) => {
    const cid = targetClient(req);
    const c = query('SELECT geofence_enabled, geofence_radius_m, geofence_ips FROM clients WHERE id = ?', [cid])[0] || {};
    const locations = query('SELECT id, label, lat, lng FROM client_login_locations WHERE client_id = ? ORDER BY id ASC', [cid]);
    res.json({ enabled: !!c.geofence_enabled, radius_m: c.geofence_radius_m || 300, ips: c.geofence_ips || '', locations });
  });

  app.put('/api/portal/login-locations', requireAuth, requireRole('overlord', 'client_admin'), (req, res) => {
    const cid = targetClient(req);
    const { enabled, radius_m, ips } = req.body || {};
    if (enabled !== undefined) run('UPDATE clients SET geofence_enabled = ? WHERE id = ?', [enabled ? 1 : 0, cid]);
    if (radius_m !== undefined) {
      const r = Math.max(20, Math.min(20000, Number(radius_m) || 300));
      run('UPDATE clients SET geofence_radius_m = ? WHERE id = ?', [r, cid]);
    }
    if (ips !== undefined) run('UPDATE clients SET geofence_ips = ? WHERE id = ?', [String(ips || '').trim(), cid]);
    saveDb();
    res.json({ ok: true });
  });

  app.post('/api/portal/login-locations', requireAuth, requireRole('overlord', 'client_admin'), (req, res) => {
    const cid = targetClient(req);
    const { label = '', lat, lng } = req.body || {};
    const la = Number(lat), ln = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return res.status(400).json({ error: 'Valid latitude and longitude required' });
    run('INSERT INTO client_login_locations (client_id, label, lat, lng) VALUES (?, ?, ?, ?)',
      [cid, String(label || '').slice(0, 80), la, ln]);
    saveDb();
    const id = query('SELECT id FROM client_login_locations ORDER BY id DESC LIMIT 1')[0].id;
    res.status(201).json({ id, label, lat: la, lng: ln });
  });

  app.delete('/api/portal/login-locations/:id', requireAuth, requireRole('overlord', 'client_admin'), (req, res) => {
    const cid = targetClient(req);
    run('DELETE FROM client_login_locations WHERE id = ? AND client_id = ?', [req.params.id, cid]);
    saveDb();
    res.json({ ok: true });
  });

  // ── Portal stats (admin dashboard) ──
  app.get('/api/portal/stats', requireAuth, requireRole('overlord', 'client_admin'), (req, res) => {
    const cid = scopeClient(req.user);
    const one = (sql, params) => query(sql, params)[0];
    if (cid) {
      res.json({
        announcements: one('SELECT COUNT(*) AS c FROM portal_announcements WHERE client_id = ?', [cid]).c,
        events: one('SELECT COUNT(*) AS c FROM portal_events WHERE client_id = ?', [cid]).c,
        staff: one("SELECT COUNT(*) AS c FROM users WHERE client_id = ? AND role = 'staff'", [cid]).c,
        parents: one("SELECT COUNT(*) AS c FROM users WHERE client_id = ? AND role = 'parent'", [cid]).c,
        pendingLeave: one("SELECT COUNT(*) AS c FROM leave_requests WHERE client_id = ? AND status = 'pending'", [cid]).c,
        registrations: one('SELECT COUNT(*) AS c FROM portal_registrations WHERE client_id = ?', [cid]).c,
      });
    } else {
      res.json({
        announcements: one('SELECT COUNT(*) AS c FROM portal_announcements').c,
        events: one('SELECT COUNT(*) AS c FROM portal_events').c,
        staff: one("SELECT COUNT(*) AS c FROM users WHERE role = 'staff'").c,
        parents: one("SELECT COUNT(*) AS c FROM users WHERE role = 'parent'").c,
        pendingLeave: one("SELECT COUNT(*) AS c FROM leave_requests WHERE status = 'pending'").c,
        registrations: one('SELECT COUNT(*) AS c FROM portal_registrations').c,
      });
    }
  });
}
