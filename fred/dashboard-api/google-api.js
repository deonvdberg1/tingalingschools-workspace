/**
 * google-api.js — Google Maps API proxy routes
 * 
 * Proxies Google API calls through the server so the API key 
 * stays server-side and isn't exposed to the browser.
 * 
 * Routes:
 *   GET  /api/google/directions — Directions API (driving route polyline)
 *   GET  /api/google/distance   — Distance Matrix API (real ETA with traffic)
 *   GET  /api/google/geocode    — Geocoding API (address → coordinates)
 */

const GOOGLE_API_KEY = '***';

export default function setupGoogleRoutes(app) {

  // ── Directions API — driving route between two points ──
  app.get('/api/google/directions', async (req, res) => {
    const { origin, destination, waypoints } = req.query;
    if (!origin || !destination) {
      return res.status(400).json({ error: 'origin and destination are required' });
    }

    try {
      let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${GOOGLE_API_KEY}&traffic_model=best_guess&departure_time=now`;

      if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`;

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== 'OK') {
        return res.json({ status: data.status, error_message: data.error_message, routes: [] });
      }

      // Extract the polyline and duration for the first route
      const route = data.routes[0];
      const leg = route.legs[0];
      
      res.json({
        status: 'OK',
        polyline: route.overview_polyline?.points || null,
        distance: leg.distance?.text || null,
        distance_meters: leg.distance?.value || null,
        duration: leg.duration_in_traffic?.text || leg.duration?.text || null,
        duration_seconds: leg.duration_in_traffic?.value || leg.duration?.value || null,
        start_location: leg.start_location,
        end_location: leg.end_location,
        summary: route.summary,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Distance Matrix — ETA between multiple origins and destinations ──
  app.get('/api/google/distance', async (req, res) => {
    const { origins, destinations } = req.query;
    if (!origins || !destinations) {
      return res.status(400).json({ error: 'origins and destinations are required' });
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&key=${GOOGLE_API_KEY}&traffic_model=best_guess&departure_time=now&units=metric`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        return res.json({ status: data.status, rows: [] });
      }

      // Simplify the response
      const elements = data.rows[0]?.elements || [];
      const results = elements.map(e => ({
        status: e.status,
        distance: e.distance?.text || null,
        distance_meters: e.distance?.value || null,
        duration: e.duration_in_traffic?.text || e.duration?.text || null,
        duration_seconds: e.duration_in_traffic?.value || e.duration?.value || null,
      }));

      res.json({ status: 'OK', results });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Geocoding — address → lat/lng ──
  app.get('/api/google/geocode', async (req, res) => {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ error: 'address is required' });
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}&region=za`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' || !data.results?.length) {
        return res.json({ status: data.status, results: [] });
      }

      const result = data.results[0];
      res.json({
        status: 'OK',
        formatted_address: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        place_id: result.place_id,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  console.log('[Google API] Routes loaded (Directions, Distance Matrix, Geocoding)');
}
