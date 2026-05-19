import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
  
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
