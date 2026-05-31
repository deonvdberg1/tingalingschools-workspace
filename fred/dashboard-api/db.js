import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import { setupTrackingTables } from './tracking-db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'autoeffortless.db');

let db = null;

export async function initDb() {
  const SQL = await initSqlJs();
  
  // Load existing DB or create new
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  // Enable WAL mode for better performance
  db.run('PRAGMA journal_mode=WAL;');
  
  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      notes TEXT DEFAULT '',
      whatsapp_number TEXT DEFAULT '',
      client_type TEXT DEFAULT 'school',
      
      -- Onboarding checklist
      onboarding_status TEXT DEFAULT 'not_started',
      onboarding_whatsapp INTEGER DEFAULT 0,
      onboarding_display_name INTEGER DEFAULT 0,
      onboarding_auto_reply INTEGER DEFAULT 0,
      onboarding_opt_in INTEGER DEFAULT 0,
      onboarding_website INTEGER DEFAULT 0,
      
      -- Health
      health_status TEXT DEFAULT 'pending',
      
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      trigger_keyword TEXT DEFAULT '',
      content TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );
  
    -- Add columns if they don't exist (for existing DBs)
    CREATE TABLE IF NOT EXISTS schema_version (version INTEGER);
  `);
  
  // Migrate existing clients — add onboarding columns
  try {
    db.run("ALTER TABLE clients ADD COLUMN onboarding_status TEXT DEFAULT 'not_started'");
  } catch {}
  try {
    db.run('ALTER TABLE clients ADD COLUMN onboarding_whatsapp INTEGER DEFAULT 0');
  } catch {}
  try {
    db.run('ALTER TABLE clients ADD COLUMN onboarding_display_name INTEGER DEFAULT 0');
  } catch {}
  try {
    db.run('ALTER TABLE clients ADD COLUMN onboarding_auto_reply INTEGER DEFAULT 0');
  } catch {}
  try {
    db.run('ALTER TABLE clients ADD COLUMN onboarding_opt_in INTEGER DEFAULT 0');
  } catch {}
  try {
    db.run('ALTER TABLE clients ADD COLUMN onboarding_website INTEGER DEFAULT 0');
  } catch {}
  try { db.run("ALTER TABLE clients ADD COLUMN health_status TEXT DEFAULT 'pending'"); } catch {}
  try { db.run('ALTER TABLE clients ADD COLUMN user_id INTEGER'); } catch {}
  
  // ── Messages table (synced from WhatsApp server) ──
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      phone TEXT NOT NULL,
      name TEXT DEFAULT 'Unknown',
      direction TEXT NOT NULL CHECK(direction IN ('in', 'out')),
      text TEXT DEFAULT '',
      timestamp TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );
  `);
  
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_messages_phone ON messages(phone);
  `);
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_messages_client ON messages(client_id);
  `);
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
  `);

  // ── Users table ──
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client_admin',
      client_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );
  `);
  
  // Insert default overlord if no users exist
  const userCheck = db.exec('SELECT COUNT(*) as c FROM users');
  if (!userCheck[0] || userCheck[0].values[0][0] === 0) {
    const hash = crypto.createHash('sha256').update('admin123').digest('hex');
    db.run("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
      ['info@autoeffortless.com', hash, 'Mr D', 'overlord']);
    saveDb();
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      first_name TEXT DEFAULT '',
      last_name TEXT DEFAULT '',
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      country TEXT DEFAULT 'South Africa',
      city TEXT DEFAULT '',
      postal_code TEXT DEFAULT '',
      tax_id TEXT DEFAULT ''
    );
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      company_name TEXT DEFAULT 'AutoEffortless',
      tagline TEXT DEFAULT 'Effortless Business Communication',
      whatsapp_number TEXT DEFAULT '',
      display_name TEXT DEFAULT '',
      timezone TEXT DEFAULT 'Africa/Johannesburg',
      currency TEXT DEFAULT 'ZAR'
    );
  `);
  
  // Insert default profile if empty
  const profileCount = db.exec('SELECT COUNT(*) as c FROM profile');
  if (profileCount[0]?.values[0][0] === 0) {
    db.run('INSERT INTO profile (id) VALUES (1)');
  }
  
  // Insert default settings if empty
  const settingsCount = db.exec('SELECT COUNT(*) as c FROM settings');
  if (settingsCount[0]?.values[0][0] === 0) {
    db.run('INSERT INTO settings (id) VALUES (1)');
  }
  
  // Setup delivery tracking tables
  setupTrackingTables(db);
  
  saveDb();
  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, buffer);
}

export function closeDb() {
  if (db) {
    saveDb();
    db.close();
    db = null;
  }
}
