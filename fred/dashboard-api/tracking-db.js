/**
 * tracking-db.js — Delivery tracking database schema & seed data
 * 
 * Extends the existing sql.js SQLite with driver_locations and deliveries tables.
 * Used by tracking-routes.js. Called on server startup.
 */

export function setupTrackingTables(db) {
  // ── driver_locations — real-time GPS positions ──
  db.run(`
    CREATE TABLE IF NOT EXISTS driver_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      driver_id TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      speed REAL DEFAULT 0,
      accuracy REAL DEFAULT 0,
      timestamp INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );
  `);

  // Index for fast lookups by client + driver + recency
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_driver_locations_lookup 
    ON driver_locations(client_id, driver_id, timestamp);
  `);

  // Index for cleanup (delete old entries)
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_driver_locations_cleanup 
    ON driver_locations(timestamp);
  `);

  // ── deliveries — per-client delivery list ──
  db.run(`
    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      driver_id TEXT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      customer_address TEXT,
      lat REAL,
      lng REAL,
      status TEXT DEFAULT 'pending',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_deliveries_client 
    ON deliveries(client_id, status);
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_deliveries_driver 
    ON deliveries(driver_id, status);
  `);

  // ── Seed stub deliveries for existing clients ── COMMENTED OUT —
  // Seed data was auto-generated during initial build. To re-enable, uncomment below.
  // const clients = db.exec('SELECT id, name FROM clients');
  // if (clients.length > 0) {
  //   for (const row of clients[0].values) {
  //     const clientId = row[0];
  //     const clientName = row[1];
  //     const existing = db.exec(`SELECT COUNT(*) as c FROM deliveries WHERE client_id = ${clientId}`);
  //     if (existing[0]?.values[0][0] > 0) continue;
  //     const stubDeliveries = generateStubDeliveries(clientId, clientName);
  //     for (const d of stubDeliveries) {
  //       db.run(
  //         `INSERT INTO deliveries (client_id, driver_id, customer_name, customer_phone, customer_address, lat, lng, status)
  //          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  //         [d.client_id, d.driver_id, d.customer_name, d.customer_phone, d.customer_address, d.lat, d.lng, d.status]
  //       );
  //     }
  //   }
  // }
}

function generateStubDeliveries(clientId, clientName) {
  // Coordinates near Richards Bay, South Africa (where Mr D is based)
  const baseLat = -28.7833;
  const baseLng = 32.0167;

  const customers = [
    { name: 'John Smith', phone: '27721234567', address: '12 Acacia Street, Richards Bay', lat: -28.780, lng: 32.020 },
    { name: 'Sarah Nkosi', phone: '27729876543', address: '45 Ocean View Drive, Meerensee', lat: -28.775, lng: 32.025 },
    { name: 'Thabo Molefe', phone: '27725556677', address: '8 Hibiscus Road, Arboretum', lat: -28.790, lng: 32.010 },
    { name: 'Lisa Botha', phone: '27724443322', address: '23 Kerk Street, Veldenvlei', lat: -28.785, lng: 32.015 },
    { name: 'Mike Dlamini', phone: '27727778899', address: '67 Sunset Avenue, Bird Sanctuary', lat: -28.778, lng: 32.030 },
  ];

  const statuses = ['pending', 'pending', 'pending', 'en_route', 'en_route'];

  return customers.map((c, i) => ({
    client_id: clientId,
    driver_id: 'driver-1', // Default driver for seed data
    customer_name: c.name,
    customer_phone: c.phone,
    customer_address: c.address,
    lat: c.lat,
    lng: c.lng,
    status: statuses[i] || 'pending',
  }));
}

/**
 * Clean up old locations (> 24 hours)
 */
export function cleanupOldLocations(db) {
  const cutoff = Date.now() - (24 * 60 * 60 * 1000);
  db.run('DELETE FROM driver_locations WHERE timestamp < ?', [cutoff]);
}
