import express from 'express';
import cors from 'cors';
import { initDb, getDb, saveDb } from './db.js';

const PORT = 3001;
const app = express();

app.use(cors());
app.use(express.json());

let db;

// ── Helper: parametrised query, returns array of row objects ──
function query(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  db.run(sql, params);
}

// ── Initialise ──
app.listen(PORT, async () => {
  db = await initDb();
  console.log(`🚀 AutoEffortless API running on port ${PORT}`);
});

// ── CLIENTS ──

app.get('/api/clients', (req, res) => {
  const clients = query('SELECT * FROM clients ORDER BY created_at DESC');
  res.json(clients);
});

app.get('/api/clients/:id', (req, res) => {
  const clients = query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
  if (clients.length === 0) return res.status(404).json({ error: 'Client not found' });
  res.json(clients[0]);
});

app.post('/api/clients', (req, res) => {
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
  const { name, phone, email, status, notes, whatsapp_number, client_type } = req.body;
  
  const fields = [];
  const values = [];
  
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
  if (email !== undefined) { fields.push('email = ?'); values.push(email); }
  if (status !== undefined) { fields.push('status = ?'); values.push(status); }
  if (notes !== undefined) { fields.push('notes = ?'); values.push(notes); }
  if (whatsapp_number !== undefined) { fields.push('whatsapp_number = ?'); values.push(whatsapp_number); }
  if (client_type !== undefined) { fields.push('client_type = ?'); values.push(client_type); }
  
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
  
  fields.push("updated_at = datetime('now')");
  values.push(req.params.id);
  
  run(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDb();
  
  const clients = query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
  if (clients.length === 0) return res.status(404).json({ error: 'Client not found' });
  res.json(clients[0]);
});

app.delete('/api/clients/:id', (req, res) => {
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

app.get('/api/stats', (req, res) => {
  const total = query('SELECT COUNT(*) as c FROM clients')[0].c;
  const active = query("SELECT COUNT(*) as c FROM clients WHERE status = 'active'")[0].c;
  
  res.json({
    total_clients: total,
    active_clients: active,
    total_messages: 0,
    active_conversations: 0,
    pending_replies: 0
  });
});

// ── Health ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: db ? 'connected' : 'disconnected' });
});

console.log(`📦 AutoEffortless API starting on port ${PORT}...`);
