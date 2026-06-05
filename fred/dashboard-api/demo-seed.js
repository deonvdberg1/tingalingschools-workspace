/**
 * demo-seed.js — Demo Mode Seeder for AutoEffortless Delivery Tracking
 * 
 * Creates a demo client with realistic Richards Bay deliveries and
 * a simulated driver route so we can see Google Maps in action
 * on all three surfaces (dashboard, driver PWA, customer tracking).
 * 
 * Run: node demo-seed.js
 */

import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join('/Users/deonvandenberg/.openclaw/workspace/fred/dashboard-api/data', 'autoeffortless.db');

async function seed() {
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);

  const q = (sql, params = []) => db.exec(sql, params);
  const run = (sql, params = []) => db.run(sql, params);
  
  // ── 1. Check if demo client already exists ──
  let demoClient = db.exec("SELECT id FROM clients WHERE name = 'Trackman Demo'");
  let clientId;
  
  if (demoClient.length > 0 && demoClient[0].values.length > 0) {
    clientId = demoClient[0].values[0][0];
    console.log(`[Demo] Existing client found (ID: ${clientId}), updating data...`);
    
    // Clean up old demo data
    run(`DELETE FROM driver_locations WHERE client_id = ?`, [clientId]);
    run(`DELETE FROM deliveries WHERE client_id = ?`, [clientId]);
  } else {
    // Create demo client
    run(
      `INSERT INTO clients (name, phone, email, status, notes, client_type) 
       VALUES ('Trackman Demo', '+27700000000', 'demo@autoeffortless.com', 'active', 'Delivery Tracking Demo Client', 'delivery')`
    );
    clientId = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
    console.log(`[Demo] Created new client (ID: ${clientId})`);
  }

  // ── 2. Create demo user if not exists ──
  const userCheck = db.exec("SELECT id FROM users WHERE email = 'demo@autoeffortless.com'");
  if (userCheck.length === 0 || userCheck[0].values.length === 0) {
    const hash = crypto.createHash('sha256').update('demo123').digest('hex');
    run(
      `INSERT INTO users (email, password, name, role, client_id) VALUES (?, ?, ?, ?, ?)`,
      ['demo@autoeffortless.com', hash, 'Demo User', 'client_admin', clientId]
    );
    console.log(`[Demo] Created demo user: demo@autoeffortless.com / demo123`);
  }

  // ── 3. Create demo driver ──
  const driverId = 'delivery-01';
  
  // ── 4. Create realistic Richards Bay deliveries ──
  // Coordinates are real Richards Bay locations
  const deliveries = [
    {
      customer_name: 'Sipho Zulu',
      customer_phone: '+27710000001',
      customer_address: 'Empangeni Rd, Veldenvlei, Richards Bay, 3900',
      lat: -28.7423, lng: 32.0518,
      notes: 'Leave at front gate'
    },
    {
      customer_name: 'Nomsa Dlamini',
      customer_phone: '+27710000002',
      customer_address: '42 Arborset St, Arboretum, Richards Bay, 3900',
      lat: -28.7512, lng: 32.0604,
      notes: 'Call on arrival'
    },
    {
      customer_name: 'Thabo Mokoena',
      customer_phone: '+27710000003',
      customer_address: '15 Lakeview Cres, Birdswood, Richards Bay, 3900',
      lat: -28.7586, lng: 32.0429,
      notes: ''
    },
    {
      customer_name: 'Jabu Nkosi',
      customer_phone: '+27710000004',
      customer_address: '8 Marine Dr, Meerensee, Richards Bay, 3900',
      lat: -28.7712, lng: 32.0701,
      notes: 'Apartment 3B'
    },
    {
      customer_name: 'Zanele Khumalo',
      customer_phone: '+27710000005',
      customer_address: '25 Hibberd Dr, Arboretum, Richards Bay, 3900',
      lat: -28.7559, lng: 32.0587,
      notes: ''
    }
  ];

  for (const d of deliveries) {
    run(
      `INSERT INTO deliveries (client_id, driver_id, customer_name, customer_phone, customer_address, lat, lng, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clientId, driverId, d.customer_name, d.customer_phone, d.customer_address, d.lat, d.lng, d.notes, 'pending']
    );
  }
  
  // Set the first delivery as "en_route" (the driver is heading to Sipho)
  run(
    `UPDATE deliveries SET status = 'en_route' WHERE client_id = ? AND customer_name = 'Sipho Zulu'`,
    [clientId]
  );

  console.log(`[Demo] Created ${deliveries.length} deliveries`);

  // ── 5. Seed simulated driver GPS path ──
  // A realistic route through Richards Bay: starting at Arboretum, heading to Sipho in Veldenvlei
  const gpsPath = [
    // Starting at depot area (Arboretum)
    { lat: -28.7550, lng: 32.0590, speed: 0 },
    { lat: -28.7552, lng: 32.0587, speed: 8 },
    { lat: -28.7555, lng: 32.0583, speed: 15 },
    { lat: -28.7558, lng: 32.0578, speed: 22 },
    { lat: -28.7562, lng: 32.0572, speed: 28 },
    { lat: -28.7567, lng: 32.0565, speed: 32 },
    { lat: -28.7572, lng: 32.0557, speed: 35 },
    // Turning onto Empangeni Rd
    { lat: -28.7578, lng: 32.0548, speed: 38 },
    { lat: -28.7583, lng: 32.0540, speed: 40 },
    { lat: -28.7588, lng: 32.0535, speed: 42 },
    { lat: -28.7593, lng: 32.0531, speed: 40 },
    // Heading towards Veldenvlei
    { lat: -28.7598, lng: 32.0528, speed: 38 },
    { lat: -28.7603, lng: 32.0525, speed: 35 },
    { lat: -28.7610, lng: 32.0522, speed: 30 },
    { lat: -28.7617, lng: 32.0520, speed: 25 },
    { lat: -28.7623, lng: 32.0518, speed: 20 },
    // Arriving at Sipho's location
    { lat: -28.7420, lng: 32.0515, speed: 15 },
    { lat: -28.7421, lng: 32.0517, speed: 8 },
    { lat: -28.7423, lng: 32.0518, speed: 0 },  // Arrived
  ];

  const now = Date.now();
  const baseTimestamp = now - ((gpsPath.length - 1) * 10000); // First point ~3 minutes ago
  gpsPath.forEach((point, i) => {
    run(
      `INSERT INTO driver_locations (client_id, driver_id, lat, lng, speed, accuracy, timestamp, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [clientId, driverId, point.lat, point.lng, point.speed, 15, baseTimestamp + (i * 10000)]
    );
  });

  console.log(`[Demo] Seeded ${gpsPath.length} GPS points along driver route`);

  // ── 6. Save ──
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  console.log(`[Demo] ✅ Database saved`);

  // ── 7. Summary ──
  console.log(`\n📍 Trackman Demo Ready!`);
  console.log(`────────────────────`);
  console.log(`Client ID:     ${clientId}`);
  console.log(`Driver ID:     ${driverId}`);
  console.log(`Deliveries:    ${deliveries.length} (1 en_route, ${deliveries.length - 1} pending)`);
  console.log(`GPS points:    ${gpsPath.length}`);
  console.log(`\n🔗 Demo URLs:`);
  console.log(`   Dashboard:     https://app.autoeffortless.com/login (demo@autoeffortless.com / demo123)`);
  console.log(`   Customer View: https://tracking.autoeffortless.com/tracking/<delivery_id>`);
  console.log(`   Driver PWA:    https://tracking.autoeffortless.com/driver/`);

  db.close();
}

seed().catch(console.error);
