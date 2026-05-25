import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, getDb, saveDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;
const app = express();

app.use(cors());
app.use(express.json());

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
  const auth = req.headers.authorization;
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

// ── Initialise ──
app.listen(PORT, async () => {
  db = await initDb();
  console.log(`🚀 AutoEffortless API running on port ${PORT}`);
});

// ── AUTH ──

app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  const users = query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
  
  const user = users[0];
  if (user.password !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = createToken(user);
  
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
  const { name, phone, email, status, notes, whatsapp_number, client_type } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  
  run(
    'INSERT INTO clients (name, phone, email, status, notes, whatsapp_number, client_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, phone || '', email || '', status || 'active', notes || '', whatsapp_number || '', client_type || 'school']
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
  
  res.json({
    total_clients: total,
    active_clients: active,
    ...wa,
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

app.get('/api/analytics/messages', async (req, res) => {
  try {
    const convRes = await fetch('http://localhost:3000/api/conversations').catch(() => null);
    if (!convRes) {
      return res.json({
        daily: [],
        total_messages: 0,
        auto_reply_rate: 0,
        avg_response_time: '—',
      });
    }
    
    const conversations = await convRes.json();
    
    // Compute daily message volume for the last 7 days
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyTotals = Array(7).fill(0);
    const dailyAuto = Array(7).fill(0);
    
    conversations.forEach(conv => {
      (conv.messages || []).forEach(msg => {
        const d = new Date(msg.timestamp);
        // Only count last 7 days
        const daysAgo = Math.floor((Date.now() - d.getTime()) / 86400000);
        if (daysAgo >= 0 && daysAgo < 7) {
          const idx = 6 - daysAgo;
          dailyTotals[idx]++;
          if (msg.direction === 'out') dailyAuto[idx]++;
        }
      });
    });
    
    const totalMessages = dailyTotals.reduce((s, v) => s + v, 0);
    const totalAuto = dailyAuto.reduce((s, v) => s + v, 0);
    
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
    });
  } catch {
    res.json({ daily: [], total_messages: 0, auto_reply_rate: 0, avg_response_time: '—' });
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
    const kbFile = path.join(__dirname, '..', 'whatsapp-server', 'tingaling-knowledge-base.md');
    fs.writeFileSync(kbFile, knowledge_base, 'utf8');
    console.log(`[KB] Saved to file for client ${req.params.id}`);
  } catch (e) {
    console.error(`[KB] Failed to write file: ${e.message}`);
  }
  
  res.json({ success: true });
});

// ── Health ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: db ? 'connected' : 'disconnected' });
});

console.log(`📦 AutoEffortless API starting on port ${PORT}...`);
