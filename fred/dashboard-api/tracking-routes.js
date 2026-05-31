/**
 * tracking-routes.js — GPS Receiver API & delivery management
 * 
 * Runs on the same Express server as the main dashboard API (port 3001).
 * All multi-tenant: every query filters by client_id.
 * 
 * Endpoints:
 *   POST   /api/tracking/location              — Driver sends GPS position
 *   GET    /api/tracking/location/:client_id/:driver_id — Latest location + path
 *   GET    /api/tracking/drivers/:client_id     — All active drivers with latest position
 *   GET    /api/tracking/health                 — Health check
 *   GET    /api/tracking/deliveries/:client_id  — Today's deliveries for a client
 *   PUT    /api/tracking/deliveries/:id/status  — Update delivery status
 *   GET    /api/tracking/delivery/:id           — Public delivery tracking (no auth)
 */

const WHATSAPP_SERVER = 'http://localhost:3000';

/**
 * Send a WhatsApp notification when a delivery status changes
 */
async function sendDeliveryNotification(delivery, clientName, status) {
  if (!delivery.customer_phone) return;
  
  // Only send for en_route and delivered statuses
  if (status !== 'en_route' && status !== 'delivered') return;
  
  // Use production domain when available, fall back to local
  const baseUrl = process.env.TRACKING_URL || 'http://localhost:3001';
  const trackingUrl = `${baseUrl}/tracking/${delivery.id}`;
  
  let message;
  if (status === 'en_route') {
    message = `🚚 Your delivery from ${clientName || 'AutoEffortless'} is on its way!\n\nTrack live: ${trackingUrl}`;
  } else {
    message = `✅ Your delivery from ${clientName || 'AutoEffortless'} has been delivered!\n\nThank you for your business. 🎉`;
  }
  
  try {
    const response = await fetch(`${WHATSAPP_SERVER}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: delivery.customer_phone, text: message }),
    });
    const result = await response.json();
    console.log(`[Notification] WhatsApp sent to ${delivery.customer_phone} for delivery ${delivery.id}: ${result.success ? 'OK' : 'FAILED'}`);
  } catch (e) {
    console.error(`[Notification] Failed to send WhatsApp for delivery ${delivery.id}: ${e.message}`);
  }
}

export default function setupTrackingRoutes(app, { query, run, saveDb }) {

  // ── POST /api/tracking/location — Driver reports GPS position ──
  app.post('/api/tracking/location', (req, res) => {
    const { client_id, driver_id, lat, lng, speed, accuracy, timestamp } = req.body;

    // Validate required fields
    if (!client_id || !driver_id || lat === undefined || lng === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: client_id, driver_id, lat, lng' 
      });
    }

    const ts = timestamp || Date.now();
    const spd = speed || 0;
    const acc = accuracy || 0;

    run(
      `INSERT INTO driver_locations (client_id, driver_id, lat, lng, speed, accuracy, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [client_id, driver_id, lat, lng, spd, acc, ts]
    );
    saveDb();

    // Cleanup old locations on every write (lazy cleanup)
    try {
      const cutoff = Date.now() - (24 * 60 * 60 * 1000);
      run('DELETE FROM driver_locations WHERE timestamp < ?', [cutoff]);
      saveDb();
    } catch (e) {
      // Non-critical cleanup, log and continue
      console.error('[Tracking] Cleanup error:', e.message);
    }

    res.json({ success: true, timestamp: ts });
  });

  // ── GET /api/tracking/location/:client_id/:driver_id — Latest location + recent path ──
  app.get('/api/tracking/location/:client_id/:driver_id', (req, res) => {
    const { client_id, driver_id } = req.params;
    const fiveMinAgo = Date.now() - (5 * 60 * 1000);

    // Get all points from last 5 minutes (ordered by time)
    const pathPoints = query(
      `SELECT lat, lng, speed, accuracy, timestamp
       FROM driver_locations
       WHERE client_id = ? AND driver_id = ? AND timestamp >= ?
       ORDER BY timestamp ASC`,
      [client_id, driver_id, fiveMinAgo]
    );

    // Get latest point
    const latest = query(
      `SELECT lat, lng, speed, accuracy, timestamp
       FROM driver_locations
       WHERE client_id = ? AND driver_id = ?
       ORDER BY timestamp DESC
       LIMIT 1`,
      [client_id, driver_id]
    );

    res.json({
      driver_id,
      client_id,
      latest: latest[0] || null,
      path: pathPoints,
      points_count: pathPoints.length,
    });
  });

  // ── GET /api/tracking/drivers/:client_id — All active drivers with latest positions ──
  app.get('/api/tracking/drivers/:client_id', (req, res) => {
    const { client_id } = req.params;
    const fiveMinAgo = Date.now() - (5 * 60 * 1000);

    // Get distinct drivers who have reported in last 5 minutes, with their latest position
    const drivers = query(
      `SELECT d.driver_id, d.lat, d.lng, d.speed, d.accuracy, d.timestamp
       FROM driver_locations d
       INNER JOIN (
         SELECT driver_id, MAX(timestamp) as max_ts
         FROM driver_locations
         WHERE client_id = ? AND timestamp >= ?
         GROUP BY driver_id
       ) latest ON d.driver_id = latest.driver_id AND d.timestamp = latest.max_ts
       WHERE d.client_id = ?`,
      [client_id, fiveMinAgo, client_id]
    );

    // Get delivery counts per driver
    const driversWithCounts = drivers.map(d => {
      const pendingCount = query(
        `SELECT COUNT(*) as c FROM deliveries 
         WHERE client_id = ? AND driver_id = ? AND status = 'pending'`,
        [client_id, d.driver_id]
      )[0].c;

      return {
        ...d,
        pending_deliveries: pendingCount,
        last_update_ago: Date.now() - d.timestamp,
      };
    });

    res.json(driversWithCounts);
  });

  // ── GET /api/tracking/deliveries/:client_id — Today's deliveries ──
  app.get('/api/tracking/deliveries/:client_id', (req, res) => {
    const { client_id } = req.params;

    const deliveries = query(
      `SELECT * FROM deliveries 
       WHERE client_id = ?
       ORDER BY 
         CASE status 
           WHEN 'pending' THEN 0
           WHEN 'en_route' THEN 1
           WHEN 'delivered' THEN 2
           WHEN 'problem' THEN 3
         END,
         created_at ASC`,
      [client_id]
    );

    // Enrich with driver's latest location if en_route
    const enriched = deliveries.map(d => {
      if (d.status === 'en_route' && d.driver_id) {
        const driverLoc = query(
          `SELECT lat, lng, speed, timestamp 
           FROM driver_locations 
           WHERE client_id = ? AND driver_id = ?
           ORDER BY timestamp DESC LIMIT 1`,
          [client_id, d.driver_id]
        );
        return { ...d, driver_location: driverLoc[0] || null };
      }
      return d;
    });

    res.json(enriched);
  });

  // ── PUT /api/tracking/deliveries/:id/status — Update delivery status ──
  app.put('/api/tracking/deliveries/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, driver_id, notes } = req.body;

    const validStatuses = ['pending', 'en_route', 'delivered', 'problem'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const fields = [`status = ?`, `updated_at = datetime('now')`];
    const values = [status];

    if (driver_id !== undefined) {
      fields.push('driver_id = ?');
      values.push(driver_id);
    }
    if (notes !== undefined) {
      fields.push('notes = ?');
      values.push(notes);
    }

    values.push(id);
    run(`UPDATE deliveries SET ${fields.join(', ')} WHERE id = ?`, values);
    saveDb();

    const updated = query('SELECT * FROM deliveries WHERE id = ?', [id]);
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    // Fire WhatsApp notification for en_route and delivered
    const clientData = query('SELECT name FROM clients WHERE id = ?', [updated[0].client_id]);
    const clientName = clientData[0]?.name || 'AutoEffortless';
    sendDeliveryNotification(updated[0], clientName, status);

    res.json(updated[0]);
  });

  // ── GET /api/tracking/delivery/:id — Public customer tracking page data (no auth) ──
  app.get('/api/tracking/delivery/:id', (req, res) => {
    const { id } = req.params;

    const deliveries = query(
      `SELECT d.*, c.name as client_name
       FROM deliveries d
       JOIN clients c ON d.client_id = c.id
       WHERE d.id = ?`,
      [id]
    );

    if (deliveries.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    const delivery = deliveries[0];

    // Get driver's latest location if en_route
    let driverLocation = null;
    let eta = null;
    if (delivery.driver_id && (delivery.status === 'en_route' || delivery.status === 'pending')) {
      const locs = query(
        `SELECT lat, lng, speed, timestamp
         FROM driver_locations
         WHERE client_id = ? AND driver_id = ?
         ORDER BY timestamp DESC LIMIT 1`,
        [delivery.client_id, delivery.driver_id]
      );
      if (locs.length > 0) {
        driverLocation = locs[0];
        
        // Simple ETA: calculate distance and estimate time
        if (delivery.lat && delivery.lng && driverLocation.speed > 1) {
          const distance = haversineDistance(
            driverLocation.lat, driverLocation.lng,
            delivery.lat, delivery.lng
          );
          const timeMinutes = (distance / driverLocation.speed) * 60;
          eta = Math.round(Math.max(1, timeMinutes));
        }
      }
    }

    res.json({
      id: delivery.id,
      client_name: delivery.client_name,
      customer_name: delivery.customer_name,
      customer_address: delivery.customer_address,
      status: delivery.status,
      delivery_lat: delivery.lat,
      delivery_lng: delivery.lng,
      driver_location: driverLocation,
      eta,
      notes: delivery.notes,
      updated_at: delivery.updated_at,
    });
  });

  // ── GET /api/tracking/health ──
  app.get('/api/tracking/health', (req, res) => {
    try {
      const driverCount = query('SELECT COUNT(DISTINCT driver_id) as c FROM driver_locations')[0].c;
      const deliveryCount = query('SELECT COUNT(*) as c FROM deliveries')[0].c;
      res.json({
        status: 'ok',
        active_drivers: driverCount,
        total_deliveries: deliveryCount,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      res.status(500).json({
        status: 'error',
        message: e.message,
      });
    }
  });
}

/**
 * Haversine distance between two lat/lng points in km
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}
