import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, getDb, saveDb } from './db.js';
import setupTrackingRoutes from './tracking-routes.js';
import setupGoogleRoutes from './google-api.js';
import setupBillingRoutes from './billing-routes.js';
import setupPaystackRoutes from './paystack-routes.js';
import setupDocChatRoutes from './docchat-routes.js';
import setupAttendanceRoutes from './attendance-routes.js';
import setupStaffDirectoryRoutes from './staff-directory-routes.js';
import setupPortalRoutes from './portal-routes.js';
import { PRODUCTS, PACKAGES } from '../storefront/src/data/products.js';
import { setupSiteAnalyticsRoutes, logAuthEvent } from './site-analytics.js';
import { setupContactRoutes } from './contact-routes.js';
import { setupSiteAIRoutes } from './site-ai-routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;
const HTTPS_PORT = 3443;
const app = express();

app.use(cors());

// ── Special raw body parser for Stripe webhook ──
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
// ── Raw body parser for Paystack webhook (signature verification needs raw body) ──
app.use('/api/paystack/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// ── Global no-cache for HTML to prevent Cloudflare edge caching ──
app.use((req, res, next) => {
  if (req.path.endsWith('.html') || req.path === '/' || req.path.startsWith('/tracking') || req.path.startsWith('/driver')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('CDN-Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Cloudflare-CDN-Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});

let db;

// ── Helper: parametrised query ──
function query(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  db.run(sql, params);
}

// ── Auth helpers ──
function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

function createToken(user) {
  const payload = { id: user.id, role: user.role, client_id: user.client_id };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function parseToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    return payload;
  } catch { return null; }
}

// ── Auth middleware ──
function requireAuth(req, res, next) {
  // Accept Authorization header OR ?token= (needed for <img>/<iframe> tags
  // which cannot send headers — used by DocChat file/thumb endpoints)
  const auth = req.headers.authorization || (req.query.token ? `Bearer ${req.query.token}` : null);
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const user = parseToken(auth.slice(7));
  if (!user) return res.status(401).json({ error: 'Invalid token' });
  
  // Verify user still exists in DB
  const users = query('SELECT * FROM users WHERE id = ?', [user.id]);
  if (users.length === 0) return res.status(401).json({ error: 'User not found' });
  
  req.user = users[0];
  next();
}

// ── Role middleware ──
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// ── Tracking routes (GPS, deliveries) ──
setupTrackingRoutes(app, { query, run, saveDb });

// ── Billing routes (subscriptions, invoices, usage, Stripe) ──
setupBillingRoutes(app, { query, run, saveDb });
setupPaystackRoutes(app, { query, run, saveDb });
setupDocChatRoutes(app, { query, run, saveDb, requireAuth });
setupAttendanceRoutes(app, { query, run, saveDb, requireAuth });
setupStaffDirectoryRoutes(app, { query, run, saveDb, requireAuth });

// ── School portal routes (Ting-A-Ling staff/admin/parent dashboard) ──
setupPortalRoutes(app, { query, run, saveDb, requireAuth, requireRole, hashPassword });

// ── Site analytics routes (GoatCounter views/events + portal login log) ──
setupSiteAnalyticsRoutes(app, { query, run, saveDb, requireAuth });

// ── Contact/lead capture routes (public form on autoeffortless.com) ──
setupContactRoutes(app, { query, run, saveDb });

// ── Site AI chat routes (public widget on autoeffortless.com) ──
setupSiteAIRoutes(app, { query, run, saveDb });

// ── Google API proxy routes ──
setupGoogleRoutes(app);

// ── Static serving ──

// Serve the built driver PWA at /driver/ (for production)
const driverDistPath = path.join(__dirname, '..', 'tracking-driver', 'dist');
if (fs.existsSync(driverDistPath)) {
  app.use('/driver', express.static(driverDistPath));
  console.log(`[Static] Serving driver PWA from /driver/`);
}

// Serve public static files (customer tracking page)
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// Catch-all for /tracking/:id — serve the customer tracking page
// This must come AFTER API routes to avoid conflict
app.get('/tracking/:id', (req, res) => {
  const htmlPath = path.join(__dirname, 'public', 'tracking.html');
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    res.status(404).send('Tracking page not found');
  }
});

// ── Dashboard SPA (built version) — must be last to avoid catching API routes ──
const dashboardDistPath = path.join(__dirname, '..', 'dashboard-temp', 'dist');
if (fs.existsSync(dashboardDistPath)) {
  // Serve static assets with caching (JS/CSS get unique hashed filenames)
  app.use(express.static(dashboardDistPath, {
    maxAge: '1y',
    immutable: true,
    index: 'index.html',
    setHeaders: (res, filePath) => {
      // Don't cache HTML — always fresh for SPA routing
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));
  console.log(`[Static] Serving built dashboard from /`);
  
  // SPA fallback for all non-API routes — serve index.html for client-side routing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/driver/') || req.path.startsWith('/tracking/')) {
      return next();
    }
    // Force browser to bypass any cached version with aggressive no-cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.sendFile(path.join(dashboardDistPath, 'index.html'));
  });
} else {
  console.log(`[Static] Dashboard dist not found at ${dashboardDistPath} — not serving dashboard`);
}

// ── Initialise ──
app.listen(PORT, async () => {
  db = await initDb();
  console.log(`🚀 AutoEffortless API running on port ${PORT}`);
  
  // Start HTTPS server for local testing from phone
  const keyPath = path.join(__dirname, 'localhost-key.pem');
  const certPath = path.join(__dirname, 'localhost.pem');
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
      console.log(`🔒 HTTPS server running on port ${HTTPS_PORT} (mkcert local dev)`);
    });
  }
});

// ── AUTH ──

app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  const users = query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (users.length === 0) {
    logAuthEvent('signin_failed', { email: email.toLowerCase().trim() }, req);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const user = users[0];

  if (user.password !== hashPassword(password)) {
    logAuthEvent('signin_failed', user, req);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = createToken(user);
  logAuthEvent('signin', user, req);
  
  // Get client name if client admin
  let clientName = null;
  if (user.client_id) {
    const clients = query('SELECT name FROM clients WHERE id = ?', [user.client_id]);
    clientName = clients[0]?.name || null;
  }
  
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, client_id: user.client_id, client_name: clientName }
  });
});

app.post('/api/auth/signup', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'All fields required' });
  
  const existing = query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });
  
  run('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
    [email.toLowerCase().trim(), hashPassword(password), name, 'client_admin']);
  saveDb();
  
  const users = query('SELECT * FROM users ORDER BY id DESC LIMIT 1');
  const token = createToken(users[0]);
  logAuthEvent('signup', users[0], req);
  res.status(201).json({ token, user: { id: users[0].id, name: users[0].name, email: users[0].email, role: users[0].role } });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  let clientName = null;
  if (req.user.client_id) {
    const clients = query('SELECT name FROM clients WHERE id = ?', [req.user.client_id]);
    clientName = clients[0]?.name || null;
  }
  res.json({ id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role, client_id: req.user.client_id, client_name: clientName });
});

// ── My purchases (product buyers) ──
app.get('/api/me/purchases', requireAuth, (req, res) => {
  const rows = query(
    'SELECT product_key, kind, status, amount_cents, created_at, expires_at FROM purchases WHERE email = ? ORDER BY created_at DESC',
    [req.user.email]
  );
  res.json(rows);
});

// ── App catalogue (store products + packages — for portal discovery) ──
app.get('/api/apps/catalogue', requireAuth, (req, res) => {
  const apps = PRODUCTS.map((p) => ({
    slug: p.slug,
    name: p.name,
    price: p.price,
    icon: p.icon,
    tagline: p.tagline,
    tier: p.tier,
  }));
  const packages = PACKAGES.map((p) => ({
    slug: p.id,
    name: p.name,
    price: `R${p.price}/mo`,
    icon: p.icon,
    tagline: p.tagline,
    tier: 'package',
  }));
  res.json({ apps, packages });
});

// ── My billing (product buyers) ──
app.get('/api/me/billing', requireAuth, (req, res) => {
  const rows = query(
    'SELECT product_key, kind, status, provider, provider_ref, amount_cents, created_at, expires_at FROM purchases WHERE email = ? ORDER BY created_at DESC',
    [req.user.email]
  );
  const totalSpentCents = rows.reduce((s, r) => s + (r.amount_cents || 0), 0);
  const active = rows.filter((r) => r.status === 'active');
  res.json({
    purchases: rows,
    summary: {
      total_spent_cents: totalSpentCents,
      active_count: active.length,
      subscription_count: active.filter((r) => r.kind === 'subscription').length,
    },
  });
});

// ── CLIENTS (role-filtered) ──

app.get('/api/clients', requireAuth, (req, res) => {
  let clients;
  if (req.user.role === 'overlord') {
    clients = query('SELECT * FROM clients ORDER BY created_at DESC');
  } else {
    clients = query('SELECT * FROM clients WHERE id = ?', [req.user.client_id]);
  }
  res.json(clients);
});

app.get('/api/clients/:id', requireAuth, (req, res) => {
  // Client admins can only see their own client
  if (req.user.role !== 'overlord' && req.user.client_id != req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const clients = query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
  if (clients.length === 0) return res.status(404).json({ error: 'Client not found' });
  res.json(clients[0]);
});

app.post('/api/clients', requireAuth, requireRole('overlord'), (req, res) => {
  const { name, phone, email, status, notes, whatsapp_number, client_type, ai_enabled } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  
  run(
    'INSERT INTO clients (name, phone, email, status, notes, whatsapp_number, client_type, ai_enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, phone || '', email || '', status || 'active', notes || '', whatsapp_number || '', client_type || 'school', ai_enabled ? 1 : 0]
  );
  saveDb();
  
  const client = query('SELECT * FROM clients ORDER BY id DESC LIMIT 1')[0];
  console.log('Created client:', JSON.stringify(client));
  res.status(201).json(client);
});

app.put('/api/clients/:id', (req, res) => {
  const { name, phone, email, status, notes, whatsapp_number, client_type,
    onboarding_status, onboarding_whatsapp, onboarding_display_name,
    onboarding_auto_reply, onboarding_opt_in, onboarding_website,
    health_status } = req.body;
  
  const fields = [];
  const values = [];
  
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
  if (email !== undefined) { fields.push('email = ?'); values.push(email); }
  if (status !== undefined) { fields.push('status = ?'); values.push(status); }
  if (notes !== undefined) { fields.push('notes = ?'); values.push(notes); }
  if (whatsapp_number !== undefined) { fields.push('whatsapp_number = ?'); values.push(whatsapp_number); }
  if (client_type !== undefined) { fields.push('client_type = ?'); values.push(client_type); }
  if (onboarding_status !== undefined) { fields.push('onboarding_status = ?'); values.push(onboarding_status); }
  if (onboarding_whatsapp !== undefined) { fields.push('onboarding_whatsapp = ?'); values.push(onboarding_whatsapp); }
  if (onboarding_display_name !== undefined) { fields.push('onboarding_display_name = ?'); values.push(onboarding_display_name); }
  if (onboarding_auto_reply !== undefined) { fields.push('onboarding_auto_reply = ?'); values.push(onboarding_auto_reply); }
  if (onboarding_opt_in !== undefined) { fields.push('onboarding_opt_in = ?'); values.push(onboarding_opt_in); }
  if (onboarding_website !== undefined) { fields.push('onboarding_website = ?'); values.push(onboarding_website); }
  if (health_status !== undefined) { fields.push('health_status = ?'); values.push(health_status); }
  if (ai_enabled !== undefined) { fields.push('ai_enabled = ?'); values.push(ai_enabled ? 1 : 0); }
  
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
  
  fields.push("updated_at = datetime('now')");
  values.push(req.params.id);
  
  run(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDb();
  
  const clients = query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
  if (clients.length === 0) return res.status(404).json({ error: 'Client not found' });
  res.json(clients[0]);
});

app.delete('/api/clients/:id', requireAuth, requireRole('overlord'), (req, res) => {
  run('DELETE FROM clients WHERE id = ?', [req.params.id]);
  saveDb();
  res.json({ success: true });
});

// ── MESSAGE SYNC (from WhatsApp server) ──
app.post('/api/messages/sync', (req, res) => {
  const { client_id, phone, name, direction, text, timestamp } = req.body;
  
  if (!phone || !direction || !timestamp) {
    return res.status(400).json({ error: 'phone, direction, and timestamp are required' });
  }
  
  run(
    'INSERT INTO messages (client_id, phone, name, direction, text, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
    [client_id || null, phone, name || 'Unknown', direction, text || '', timestamp]
  );
  saveDb();
  
  res.json({ success: true });
});

// ── SYNCED CONVERSATIONS (read from dashboard DB) ──
app.get('/api/messages/conversations', (req, res) => {
  const rows = query(
    `SELECT phone, name, direction, text, timestamp, client_id
     FROM messages
     ORDER BY timestamp DESC
     LIMIT 10000`
  );
  
  // Group by phone number
  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.phone]) {
      grouped[row.phone] = {
        name: row.name,
        phone: row.phone,
        client_id: row.client_id,
        messages: [],
        autoReplied: 0,
        humanRequests: 0,
        firstSeen: row.timestamp,
        lastSeen: row.timestamp
      };
    }
    const conv = grouped[row.phone];
    conv.messages.push({
      direction: row.direction,
      text: row.text,
      timestamp: row.timestamp
    });
    if (row.direction === 'out') conv.autoReplied++;
    else conv.humanRequests++;
    if (row.timestamp < conv.firstSeen) conv.firstSeen = row.timestamp;
    if (row.timestamp > conv.lastSeen) conv.lastSeen = row.timestamp;
  }
  
  // Sort conversations by lastSeen descending
  const result = Object.values(grouped);
  result.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
  
  // Cap messages per conversation at 500
  for (const conv of result) {
    conv.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    conv.messages = conv.messages.slice(-500);
  }
  
  res.json(result);
});

// ── PER-CLIENT CONVERSATIONS ──
app.get('/api/messages/conversations/:clientId', (req, res) => {
  const clientId = parseInt(req.params.clientId);
  if (!clientId) return res.status(400).json({ error: 'Invalid client ID' });
  
  const rows = query(
    `SELECT phone, name, direction, text, timestamp, client_id
     FROM messages
     WHERE client_id = ?
     ORDER BY timestamp DESC
     LIMIT 10000`,
    [clientId]
  );
  
  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.phone]) {
      grouped[row.phone] = {
        name: row.name,
        phone: row.phone,
        client_id: row.client_id,
        messages: [],
        autoReplied: 0,
        humanRequests: 0,
        firstSeen: row.timestamp,
        lastSeen: row.timestamp
      };
    }
    const conv = grouped[row.phone];
    conv.messages.push({
      direction: row.direction,
      text: row.text,
      timestamp: row.timestamp
    });
    if (row.direction === 'out') conv.autoReplied++;
    else conv.humanRequests++;
    if (row.timestamp < conv.firstSeen) conv.firstSeen = row.timestamp;
    if (row.timestamp > conv.lastSeen) conv.lastSeen = row.timestamp;
  }
  
  const result = Object.values(grouped);
  result.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
  
  for (const conv of result) {
    conv.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    conv.messages = conv.messages.slice(-500);
  }
  
  res.json(result);
});

// ── PROFILE ──

app.get('/api/profile', (req, res) => {
  const profiles = query('SELECT * FROM profile WHERE id = 1');
  res.json(profiles[0] || {});
});

app.put('/api/profile', (req, res) => {
  const { first_name, last_name, email, phone, bio, country, city, postal_code, tax_id } = req.body;
  
  const fields = [];
  const values = [];
  
  if (first_name !== undefined) { fields.push('first_name = ?'); values.push(first_name); }
  if (last_name !== undefined) { fields.push('last_name = ?'); values.push(last_name); }
  if (email !== undefined) { fields.push('email = ?'); values.push(email); }
  if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
  if (bio !== undefined) { fields.push('bio = ?'); values.push(bio); }
  if (country !== undefined) { fields.push('country = ?'); values.push(country); }
  if (city !== undefined) { fields.push('city = ?'); values.push(city); }
  if (postal_code !== undefined) { fields.push('postal_code = ?'); values.push(postal_code); }
  if (tax_id !== undefined) { fields.push('tax_id = ?'); values.push(tax_id); }
  
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
  
  run(`UPDATE profile SET ${fields.join(', ')} WHERE id = 1`, values);
  saveDb();
  
  const profiles = query('SELECT * FROM profile WHERE id = 1');
  res.json(profiles[0]);
});

// ── SETTINGS ──

app.get('/api/settings', (req, res) => {
  const settings = query('SELECT * FROM settings WHERE id = 1');
  res.json(settings[0] || {});
});

app.put('/api/settings', (req, res) => {
  const { company_name, tagline, whatsapp_number, display_name, timezone, currency } = req.body;
  
  const fields = [];
  const values = [];
  
  if (company_name !== undefined) { fields.push('company_name = ?'); values.push(company_name); }
  if (tagline !== undefined) { fields.push('tagline = ?'); values.push(tagline); }
  if (whatsapp_number !== undefined) { fields.push('whatsapp_number = ?'); values.push(whatsapp_number); }
  if (display_name !== undefined) { fields.push('display_name = ?'); values.push(display_name); }
  if (timezone !== undefined) { fields.push('timezone = ?'); values.push(timezone); }
  if (currency !== undefined) { fields.push('currency = ?'); values.push(currency); }
  
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
  
  run(`UPDATE settings SET ${fields.join(', ')} WHERE id = 1`, values);
  saveDb();
  
  const settings = query('SELECT * FROM settings WHERE id = 1');
  res.json(settings[0]);
});

// ── DASHBOARD STATS ──

async function fetchWhatsAppStats() {
  try {
    const [statusRes, convRes] = await Promise.all([
      fetch('http://localhost:3000/status').catch(() => null),
      fetch('http://localhost:3000/api/conversations').catch(() => null),
    ]);
    
    if (!statusRes || !convRes) return { total_messages: 0, active_conversations: 0, pending_replies: 0, server_status: 'offline' };
    
    const status = await statusRes.json();
    const conversations = await convRes.json();
    
    const totalMessages = conversations.reduce((s, c) => s + (c.messages?.length || 0), 0);
    const pendingReplies = conversations.filter(c => (c.humanRequests || 0) > (c.autoReplied || 0)).length;
    
    return {
      total_messages: totalMessages,
      active_conversations: conversations.length,
      pending_replies: pendingReplies,
      server_status: 'online',
    };
  } catch {
    return { total_messages: 0, active_conversations: 0, pending_replies: 0, server_status: 'offline' };
  }
}

app.get('/api/stats', async (req, res) => {
  const total = query('SELECT COUNT(*) as c FROM clients')[0].c;
  const active = query("SELECT COUNT(*) as c FROM clients WHERE status = 'active'")[0].c;
  const wa = await fetchWhatsAppStats();
  
  // Product stats
  const totalProducts = query('SELECT COUNT(*) as c FROM client_products WHERE status = "active"')[0].c;
  const productBreakdown = query('SELECT product_key, product_name, COUNT(*) as c FROM client_products WHERE status = "active" GROUP BY product_key ORDER BY c DESC');
  
  res.json({
    total_clients: total,
    active_clients: active,
    total_products: totalProducts,
    product_breakdown: productBreakdown,
    ...wa,
  });
});

// ── PHONE LOOKUP — resolve a phone number to a client ──
app.get("/api/phone-lookup/:number", (req, res) => {
  const clean = req.params.number.replace(/[^0-9]/g, "");
  if (!clean || clean.length < 6) {
    return res.status(400).json({ error: "Invalid phone number" });
  }
  
  const clients = query("SELECT * FROM clients WHERE status = 'active'");
  const match = clients.find(c => {
    const wa = (c.whatsapp_number || "").replace(/[^0-9]/g, "");
    const ph = (c.phone || "").replace(/[^0-9]/g, "");
    return wa === clean || ph === clean;
  });
  
  if (!match) {
    return res.status(404).json({ error: "No client found for this number" });
  }
  
  // Look up the WABA config for this client (phone number they're assigned to)
  const wabaConfigs = query('SELECT * FROM waba_configs WHERE client_id = ?', [match.id]);
  const wabaConfig = wabaConfigs[0] || null;
  
  res.json({
    client_id: match.id,
    client_name: match.name,
    client_type: match.client_type || "school",
    health_status: match.health_status || "pending",
    ai_enabled: match.ai_enabled || false,
    agent_id: match.agent_id || "",
    knowledge_base: match.knowledge_base || "",
    contact_phone: match.phone || "",
    contact_email: match.email || "",
    phone_number_id: wabaConfig?.phone_number_id || "",
    waba_id: wabaConfig?.waba_id || "",
    waba_status: wabaConfig?.status || "",
  });
});

// ── TEMPLATES ──

app.get('/api/clients/:id/templates', (req, res) => {
  const templates = query('SELECT * FROM templates WHERE client_id = ? ORDER BY category, name', [req.params.id]);
  res.json(templates);
});

app.post('/api/clients/:id/templates', (req, res) => {
  const { name, category, trigger_keyword, content } = req.body;
  if (!name || !content) return res.status(400).json({ error: 'Name and content are required' });
  
  run(
    'INSERT INTO templates (client_id, name, category, trigger_keyword, content) VALUES (?, ?, ?, ?, ?)',
    [req.params.id, name, category || 'general', trigger_keyword || '', content]
  );
  saveDb();
  
  const t = query('SELECT * FROM templates ORDER BY id DESC LIMIT 1')[0];
  res.status(201).json(t);
});

app.put('/api/templates/:id', (req, res) => {
  const { name, category, trigger_keyword, content, active } = req.body;
  
  const fields = [];
  const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (category !== undefined) { fields.push('category = ?'); values.push(category); }
  if (trigger_keyword !== undefined) { fields.push('trigger_keyword = ?'); values.push(trigger_keyword); }
  if (content !== undefined) { fields.push('content = ?'); values.push(content); }
  if (active !== undefined) { fields.push('active = ?'); values.push(active); }
  
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
  fields.push("updated_at = datetime('now')");
  values.push(req.params.id);
  
  run(`UPDATE templates SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDb();
  
  const templates = query('SELECT * FROM templates WHERE id = ?', [req.params.id]);
  if (templates.length === 0) return res.status(404).json({ error: 'Template not found' });
  res.json(templates[0]);
});

app.delete('/api/templates/:id', (req, res) => {
  run('DELETE FROM templates WHERE id = ?', [req.params.id]);
  saveDb();
  res.json({ success: true });
});

// ── CLIENT HEALTH ──

app.get('/api/clients/:id/health', async (req, res) => {
  const clients = query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
  if (clients.length === 0) return res.status(404).json({ error: 'Client not found' });
  
  const client = clients[0];
  const phoneClean = (client.phone || client.whatsapp_number || '').replace(/[^0-9]/g, '');
  
  let conversationStats = {
    total_messages: 0,
    auto_replies: 0,
    human_replies: 0,
    last_message: null,
    needs_attention: false,
  };
  
  if (phoneClean) {
    try {
      const convRes = await fetch('http://localhost:3000/api/conversations').catch(() => null);
      if (convRes) {
        const convs = await convRes.json();
        const match = convs.find(c => c.phone?.replace(/[^0-9]/g, '') === phoneClean);
        if (match) {
          const msgs = match.messages || [];
          conversationStats.total_messages = msgs.length;
          conversationStats.auto_replies = msgs.filter(m => m.direction === 'out').length;
          conversationStats.human_replies = msgs.filter(m => m.direction === 'in').length;
          conversationStats.last_message = msgs.length > 0 ? msgs[msgs.length - 1].timestamp : null;
          conversationStats.needs_attention = (match.humanRequests || 0) > (match.autoReplied || 0);
        }
      }
    } catch {}
  }
  
  // Count templates
  const templateCount = query('SELECT COUNT(*) as c FROM templates WHERE client_id = ?', [req.params.id])[0].c;
  
  res.json({
    client: {
      id: client.id,
      name: client.name,
      health_status: client.health_status || 'pending',
      onboarding_status: client.onboarding_status || 'not_started',
      onboarding: {
        whatsapp: !!client.onboarding_whatsapp,
        display_name: !!client.onboarding_display_name,
        auto_reply: !!client.onboarding_auto_reply,
        opt_in: !!client.onboarding_opt_in,
        website: !!client.onboarding_website,
      },
    },
    conversation: conversationStats,
    templates: templateCount,
  });
});

// ── ANALYTICS ──

app.get('/api/analytics/messages', (req, res) => {
  try {
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyTotals = Array(7).fill(0);
    const dailyAuto = Array(7).fill(0);
    
    // Optionally filter by client
    let whereClause = '';
    const params = [];
    if (req.query.client_id) {
      whereClause = 'WHERE client_id = ?';
      params.push(parseInt(req.query.client_id));
    }
    
    const rows = query(
      `SELECT direction, timestamp FROM messages ${whereClause} ORDER BY timestamp DESC LIMIT 10000`,
      params
    );
    
    let totalMessages = 0;
    let totalAuto = 0;
    let totalConversations = 0;
    
    // Track unique phone numbers for conversation count
    const uniquePhones = new Set();
    
    for (const row of rows) {
      const d = new Date(row.timestamp);
      const daysAgo = Math.floor((Date.now() - d.getTime()) / 86400000);
      if (daysAgo >= 0 && daysAgo < 7) {
        const idx = 6 - daysAgo;
        dailyTotals[idx]++;
        if (row.direction === 'out') dailyAuto[idx]++;
      }
      // Count all messages regardless of date
      totalMessages++;
      if (row.direction === 'out') totalAuto++;
    }
    
    // Count unique conversations (phones with messages)
    const convQuery = req.query.client_id
      ? 'SELECT DISTINCT phone FROM messages WHERE client_id = ?'
      : 'SELECT DISTINCT phone FROM messages';
    const convRows = query(convQuery, req.query.client_id ? [parseInt(req.query.client_id)] : []);
    totalConversations = convRows.length;
    
    const recentTotal = dailyTotals.reduce((s, v) => s + v, 0);
    const recentAuto = dailyAuto.reduce((s, v) => s + v, 0);
    
    res.json({
      daily: dayLabels.map((label, i) => ({
        day: label,
        total: dailyTotals[i],
        auto: dailyAuto[i],
        human: dailyTotals[i] - dailyAuto[i],
      })),
      total_messages: totalMessages,
      auto_reply_rate: totalMessages > 0 ? Math.round((totalAuto / totalMessages) * 100) : 0,
      avg_response_time: totalMessages > 0 ? '< 1 min' : '—',
      conversations: totalConversations,
    });
  } catch (e) {
    console.error('[ANALYTICS] Error:', e.message);
    res.json({ daily: [], total_messages: 0, auto_reply_rate: 0, avg_response_time: '—', conversations: 0 });
  }
});

// ── ANALYTICS: Hourly Trends ──
app.get('/api/analytics/hourly', (req, res) => {
  try {
    let whereClause = '';
    const params = [];
    if (req.query.client_id) {
      whereClause = 'WHERE client_id = ?';
      params.push(parseInt(req.query.client_id));
    }
    
    const rows = query(
      `SELECT direction, timestamp FROM messages ${whereClause} ORDER BY timestamp`,
      params
    );
    
    // Aggregate by hour of day (0-23)
    const hourlyTotals = Array(24).fill(0);
    const hourlyAuto = Array(24).fill(0);
    const hourlyHuman = Array(24).fill(0);
    
    for (const row of rows) {
      const d = new Date(row.timestamp);
      const hour = d.getHours();
      hourlyTotals[hour]++;
      if (row.direction === 'out') {
        hourlyAuto[hour]++;
      } else {
        hourlyHuman[hour]++;
      }
    }
    
    res.json({
      hourly: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        label: `${i.toString().padStart(2, '0')}:00`,
        total: hourlyTotals[i],
        auto: hourlyAuto[i],
        human: hourlyHuman[i],
      })),
      busiest_hour: hourlyTotals.indexOf(Math.max(...hourlyTotals)),
      peak_volume: Math.max(...hourlyTotals),
    });
  } catch (e) {
    console.error('[ANALYTICS hourly] Error:', e.message);
    res.json({ hourly: [], busiest_hour: 0, peak_volume: 0 });
  }
});

// ── ANALYTICS: Response Times ──
app.get('/api/analytics/response-times', (req, res) => {
  try {
    let whereClause = '';
    const params = [];
    if (req.query.client_id) {
      whereClause = 'AND client_id = ?';
      params.push(parseInt(req.query.client_id));
    }
    
    // Get all messages ordered by phone then timestamp
    const rows = query(
      `SELECT phone, direction, timestamp FROM messages WHERE 1=1 ${whereClause} ORDER BY phone, timestamp ASC`,
      params
    );
    
    // Calculate response times: time between an 'in' message and the next 'out' message by same phone
    let totalResponseMs = 0;
    let responseCount = 0;
    let fastestMs = Infinity;
    let slowestMs = 0;
    
    // Daily average response times
    const dayBuckets = {};  // 'YYYY-MM-DD' -> { total: 0, count: 0 }
    
    // Per-conversation pairs: for each phone, find in->out pairs
    let currentPhone = null;
    let lastInTime = null;
    
    for (const row of rows) {
      if (row.phone !== currentPhone) {
        currentPhone = row.phone;
        lastInTime = null;
      }
      
      if (row.direction === 'in') {
        lastInTime = new Date(row.timestamp).getTime();
      } else if (row.direction === 'out' && lastInTime !== null) {
        const inTime = lastInTime;
        const outTime = new Date(row.timestamp).getTime();
        const diffMs = outTime - inTime;
        
        // Only count if response is within 24 hours (ignore edge cases)
        if (diffMs > 0 && diffMs < 86400000) {
          totalResponseMs += diffMs;
          responseCount++;
          if (diffMs < fastestMs) fastestMs = diffMs;
          if (diffMs > slowestMs) slowestMs = diffMs;
          
          const day = new Date(row.timestamp).toISOString().slice(0, 10);
          if (!dayBuckets[day]) dayBuckets[day] = { total: 0, count: 0 };
          dayBuckets[day].total += diffMs;
          dayBuckets[day].count++;
        }
        
        lastInTime = null; // Reset to avoid pairing multiple outs to one in
      }
    }
    
    // Build daily trends
    const dailyTrends = Object.entries(dayBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14) // Last 14 days
      .map(([date, data]) => ({
        date,
        avg_seconds: Math.round(data.total / data.count / 1000),
        response_count: data.count,
      }));
    
    const avgSeconds = responseCount > 0 ? Math.round(totalResponseMs / responseCount / 1000) : 0;
    
    res.json({
      avg_response_seconds: avgSeconds,
      avg_response_display: avgSeconds < 60 
        ? `${avgSeconds}s` 
        : avgSeconds < 3600 
          ? `${Math.floor(avgSeconds / 60)}m ${avgSeconds % 60}s`
          : `${Math.floor(avgSeconds / 3600)}h ${Math.floor((avgSeconds % 3600) / 60)}m`,
      fastest_seconds: fastestMs === Infinity ? 0 : Math.round(fastestMs / 1000),
      slowest_seconds: Math.round(slowestMs / 1000),
      responses_measured: responseCount,
      daily_trends: dailyTrends,
    });
  } catch (e) {
    console.error('[ANALYTICS response-times] Error:', e.message);
    res.json({ avg_response_seconds: 0, avg_response_display: '—', fastest_seconds: 0, slowest_seconds: 0, responses_measured: 0, daily_trends: [] });
  }
});

// ── ANALYTICS: Product Stats ──
app.get('/api/analytics/products', (req, res) => {
  try {
    const products = query(`
      SELECT 
        cp.product_key,
        cp.product_name,
        COUNT(DISTINCT cp.client_id) as client_count,
        GROUP_CONCAT(c.name) as client_names
      FROM client_products cp
      LEFT JOIN clients c ON c.id = cp.client_id
      WHERE cp.status = 'active'
      GROUP BY cp.product_key
      ORDER BY client_count DESC
    `);
    
    // Get message counts per product/client
    const productMessages = query(`
      SELECT 
        cp.product_key,
        cp.product_name,
        m.client_id,
        COUNT(*) as msg_count
      FROM messages m
      JOIN client_products cp ON cp.client_id = m.client_id
      WHERE cp.status = 'active'
      GROUP BY cp.product_key, m.client_id
    `);
    
    res.json({
      products,
      product_messages: productMessages,
    });
  } catch (e) {
    console.error('[ANALYTICS products] Error:', e.message);
    res.json({ products: [], product_messages: [] });
  }
});

// ── ANALYTICS: CSV Export ──
app.get('/api/analytics/export', (req, res) => {
  try {
    const format = req.query.format || 'csv';
    let whereClause = '';
    const params = [];
    if (req.query.client_id) {
      whereClause = 'WHERE client_id = ?';
      params.push(parseInt(req.query.client_id));
    }
    
    const rows = query(
      `SELECT id, client_id, phone, name, direction, text, timestamp FROM messages ${whereClause} ORDER BY timestamp DESC LIMIT 50000`,
      params
    );
    
    if (format === 'csv') {
      const headers = ['ID', 'Client ID', 'Phone', 'Name', 'Direction', 'Message', 'Timestamp'];
      const csvRows = rows.map(r => {
        const escaped = (r.text || '').replace(/"/g, '""');
        return [r.id, r.client_id, r.phone, r.name, r.direction, `"${escaped}"`, r.timestamp].join(',');
      });
      
      const csv = [headers.join(','), ...csvRows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-export-${new Date().toISOString().slice(0, 10)}.csv"`);
      res.send(csv);
    } else {
      res.json({ messages: rows, total: rows.length });
    }
  } catch (e) {
    console.error('[ANALYTICS export] Error:', e.message);
    res.status(500).json({ error: 'Export failed' });
  }
});

// ── BROADCAST ──

// Broadcast log (in-memory — persists across restarts via DB eventually)
const broadcastLog = [];

app.get('/api/broadcasts', (req, res) => {
  res.json(broadcastLog.slice().reverse());
});

app.post('/api/broadcasts/send', async (req, res) => {
  const { message, client_ids } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });
  
  // Get target clients
  let targets;
  if (client_ids && client_ids.length > 0) {
    targets = query(`SELECT * FROM clients WHERE id IN (${client_ids.map(() => '?').join(',')})`, client_ids);
  } else {
    targets = query("SELECT * FROM clients WHERE status = 'active'");
  }
  
  if (targets.length === 0) {
    return res.status(400).json({ error: 'No clients to send to' });
  }
  
  const results = [];
  for (const client of targets) {
    const phone = client.phone?.replace(/[^0-9]/g, '');
    if (!phone || phone.length < 10) {
      results.push({ client: client.name, phone: client.phone, status: 'skipped', error: 'No valid phone number' });
      continue;
    }
    
    try {
      const waRes = await fetch('http://localhost:3000/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone, text: message }),
      }).catch(() => null);
      
      if (!waRes) {
        results.push({ client: client.name, phone: client.phone, status: 'failed', error: 'WhatsApp server offline' });
      } else {
        const waData = await waRes.json();
        results.push({
          client: client.name,
          phone: client.phone,
          status: waData.success ? 'sent' : 'failed',
          error: waData.error || null,
          message_id: waData.id || null,
        });
      }
    } catch (e) {
      results.push({ client: client.name, phone: client.phone, status: 'error', error: e.message });
    }
  }
  
  const broadcast = {
    id: Date.now().toString(),
    message,
    total: targets.length,
    sent: results.filter(r => r.status === 'sent').length,
    failed: results.filter(r => r.status !== 'sent').length,
    results,
    created_at: new Date().toISOString(),
  };
  
  broadcastLog.push(broadcast);
  res.json(broadcast);
});

// ── Onboarding update endpoint ──
app.post('/api/onboarding/update', requireAuth, (req, res) => {
  const { client_id, field, value } = req.body;
  if (!client_id || !field) return res.status(400).json({ error: 'client_id and field required' });
  
  // Only allow updating own client or if overlord
  if (req.user.role !== 'overlord' && req.user.client_id !== client_id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const validFields = ['whatsapp','display_name','auto_reply','opt_in','website','status'];
  const dbField = field === 'status' ? 'onboarding_status' : `onboarding_${field}`;
  if (!validFields.includes(field)) return res.status(400).json({ error: 'Invalid field' });
  
  if (field === 'status') {
    run('UPDATE clients SET onboarding_status = ? WHERE id = ?', [value, client_id]);
  } else {
    // Column name is sanitized by the validFields whitelist
    const sql = 'UPDATE clients SET onboarding_' + field + ' = ? WHERE id = ?';
    run(sql, [value ? 1 : 0, client_id]);
  }
  saveDb();
  res.json({ success: true });
});

// ── Knowledge Base ──
app.get('/api/clients/:id/knowledge', requireAuth, (req, res) => {
  if (req.user.role !== 'overlord' && req.user.client_id != req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const clients = query('SELECT knowledge_base, name FROM clients WHERE id = ?', [req.params.id]);
  if (clients.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ id: req.params.id, name: clients[0].name, knowledge_base: clients[0].knowledge_base || '' });
});

app.put('/api/clients/:id/knowledge', requireAuth, (req, res) => {
  const { knowledge_base } = req.body;
  if (req.user.role !== 'overlord' && req.user.client_id != req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (knowledge_base === undefined) return res.status(400).json({ error: 'knowledge_base is required' });
  run('UPDATE clients SET knowledge_base = ? WHERE id = ?', [knowledge_base, req.params.id]);
  saveDb();

  // Also write to the WhatsApp server's knowledge file for live AI updates
  try {
    // Per-client file naming (falls back to the legacy Ting-A-Ling paths for agent 'tingai')
    const clientRow = query('SELECT agent_id, name FROM clients WHERE id = ?', [req.params.id])[0] || {};
    const agentId = clientRow.agent_id || 'tingai';
    let serverFile, agentDir, agentFile;
    if (agentId === 'tingai') {
      serverFile = 'tingaling-knowledge-base.md';
      agentDir = 'tingai';
      agentFile = 'tingaling-knowledge-base.md';
    } else {
      serverFile = agentId + '-knowledge-base.md';
      agentDir = agentId;
      agentFile = agentId + '-knowledge-base.md';
    }
    const kbFile = path.join(__dirname, '..', 'whatsapp-server', serverFile);
    fs.writeFileSync(kbFile, knowledge_base, 'utf8');
    console.log(`[KB] Saved to whatsapp-server for client ${req.params.id} (${serverFile})`);

    // Also sync to the agent's workspace so the live AI reads it fresh
    const agentKbFile = path.join(__dirname, '..', '..', agentDir, agentFile);
    fs.writeFileSync(agentKbFile, knowledge_base, 'utf8');
    console.log(`[KB] Synced to agent workspace for client ${req.params.id} (${agentDir}/${agentFile})`);
  } catch (e) {
    console.error(`[KB] Failed to write file: ${e.message}`);
  }
  
  res.json({ success: true });
});

// ── WABA CONFIG (Option 3: BSP multi-tenant) ──

// GET /api/waba/configs — list all WABA configurations (overlord only)
app.get('/api/waba/configs', requireAuth, requireRole('overlord'), (req, res) => {
  const configs = query(
    `SELECT w.*, c.name as client_name
     FROM waba_configs w
     LEFT JOIN clients c ON c.id = w.client_id
     ORDER BY w.created_at DESC`
  );
  res.json(configs);
});

// GET /api/waba/configs/unassigned — list unassigned phone numbers (not yet linked to a client)
app.get('/api/waba/configs/unassigned', requireAuth, requireRole('overlord'), (req, res) => {
  const configs = query('SELECT * FROM waba_configs WHERE client_id IS NULL ORDER BY created_at DESC');
  res.json(configs);
});

// GET /api/clients/:id/waba — get WABA config for a specific client
app.get('/api/clients/:id/waba', requireAuth, (req, res) => {
  const configs = query('SELECT * FROM waba_configs WHERE client_id = ?', [req.params.id]);
  res.json(configs[0] || null);
});

// POST /api/waba/configs — register a new phone number (overlord only)
app.post('/api/waba/configs', requireAuth, requireRole('overlord'), (req, res) => {
  const { waba_id, phone_number_id, display_name, business_name, notes } = req.body;
  if (!waba_id || !phone_number_id) {
    return res.status(400).json({ error: 'waba_id and phone_number_id are required' });
  }
  
  try {
    run(
      'INSERT INTO waba_configs (waba_id, phone_number_id, display_name, business_name, notes) VALUES (?, ?, ?, ?, ?)',
      [waba_id, phone_number_id, display_name || '', business_name || '', notes || '']
    );
    saveDb();
    const config = query('SELECT * FROM waba_configs ORDER BY id DESC LIMIT 1')[0];
    res.status(201).json(config);
  } catch (e) {
    if (e.message?.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Phone number ID already registered' });
    }
    res.status(500).json({ error: 'Failed to create config' });
  }
});

// PUT /api/waba/configs/:id — update WABA config (assign to client, update status, etc.)
app.put('/api/waba/configs/:id', requireAuth, requireRole('overlord'), (req, res) => {
  const { client_id, display_name, business_name, status, meta_verified, notes } = req.body;
  const fields = [];
  const values = [];
  
  if (client_id !== undefined) { fields.push('client_id = ?'); values.push(client_id); }
  if (display_name !== undefined) { fields.push('display_name = ?'); values.push(display_name); }
  if (business_name !== undefined) { fields.push('business_name = ?'); values.push(business_name); }
  if (status !== undefined) { fields.push('status = ?'); values.push(status); }
  if (meta_verified !== undefined) { fields.push('meta_verified = ?'); values.push(meta_verified ? 1 : 0); }
  if (notes !== undefined) { fields.push('notes = ?'); values.push(notes); }
  
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
  
  fields.push("updated_at = datetime('now')");
  values.push(req.params.id);
  
  run('UPDATE waba_configs SET ' + fields.join(', ') + ' WHERE id = ?', values);
  saveDb();
  
  const config = query('SELECT * FROM waba_configs WHERE id = ?', [req.params.id]);
  res.json(config[0] || { error: 'Not found' });
});

// DELETE /api/waba/configs/:id — remove a WABA config
app.delete('/api/waba/configs/:id', requireAuth, requireRole('overlord'), (req, res) => {
  run('DELETE FROM waba_configs WHERE id = ?', [req.params.id]);
  saveDb();
  res.json({ success: true });
});

// ── CLIENT PRODUCTS ──
app.get('/api/clients/:id/products', requireAuth, (req, res) => {
  const products = query('SELECT * FROM client_products WHERE client_id = ? ORDER BY created_at', [req.params.id]);
  res.json(products);
});

app.post('/api/clients/:id/products', requireAuth, requireRole('overlord'), (req, res) => {
  const { product_key, product_name } = req.body;
  if (!product_key || !product_name) return res.status(400).json({ error: 'product_key and product_name required' });
  try {
    run('INSERT INTO client_products (client_id, product_key, product_name) VALUES (?, ?, ?)',
      [req.params.id, product_key, product_name]);
    saveDb();
    const prods = query('SELECT * FROM client_products WHERE client_id = ? AND product_key = ?', [req.params.id, product_key]);
    res.status(201).json(prods[0]);
  } catch (e) {
    res.status(400).json({ error: 'Product already exists for this client' });
  }
});

app.put('/api/client-products/:id', requireAuth, requireRole('overlord'), (req, res) => {
  const { status, config, product_name } = req.body;
  const updates = [];
  const params = [];
  if (status) { updates.push('status = ?'); params.push(status); }
  if (config) { updates.push('config = ?'); params.push(config); }
  if (product_name) { updates.push('product_name = ?'); params.push(product_name); }
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.id);
  run('UPDATE client_products SET ' + updates.join(', ') + ' WHERE id = ?', params);
  saveDb();
  const prod = query('SELECT * FROM client_products WHERE id = ?', [req.params.id]);
  res.json(prod[0] || { error: 'Not found' });
});

app.delete('/api/client-products/:id', requireAuth, requireRole('overlord'), (req, res) => {
  run('DELETE FROM client_products WHERE id = ?', [req.params.id]);
  saveDb();
  res.json({ success: true });
});

// ── Realtime SSE endpoint ──
app.get('/api/realtime', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  
  const interval = setInterval(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/conversations');
      if (!response.ok) { throw new Error('Not OK'); }
      
      const conversations = await response.json();
      
      const totalMsgs = conversations.reduce((s, c) => s + (c.messages?.length || 0), 0);
      const totalAuto = conversations.reduce((s, c) => s + (c.autoReplied || 0), 0);
      const recentChanges = conversations.filter(c => new Date(c.lastSeen) > Date.now() - 30000).length;
      
      res.write('data: ' + JSON.stringify({
        conversations: conversations.length,
        total_messages: totalMsgs,
        auto_reply_rate: totalMsgs > 0 ? Math.round((totalAuto / totalMsgs) * 100) : 0,
        recent_activity: recentChanges,
        server_status: 'online',
        timestamp: new Date().toISOString(),
      }) + '\n\n');
    } catch (e) {
      // Silently retry on next tick — no need to notify client of transient errors
    }
  }, 5000);
  
  req.on('close', () => {
    clearInterval(interval);
  });
});

// ── Health ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: db ? 'connected' : 'disconnected' });
});

console.log(`📦 AutoEffortless API starting on port ${PORT}...`);
