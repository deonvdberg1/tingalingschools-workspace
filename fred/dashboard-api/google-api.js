/**
 * google-api.js — Google Maps API proxy routes (v2 - New APIs)
 * 
 * Uses the newer Google APIs instead of legacy REST endpoints:
 *   Directions  → Routes API v2 (computeRoutes)
 *   Distance    → Routes API v2 (computeRouteMatrix)  
 *   Geocoding   → Places API (New) (searchText)
 */

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSy…DnP0';

export default function setupGoogleRoutes(app) {

  // ── Directions API via Routes API v2 ──
  app.get('/api/google/directions', async (req, res) => {
    const { origin, destination, waypoints } = req.query;
    if (!origin || !destination) {
      return res.status(400).json({ error: 'origin and destination are required' });
    }

    const parseLatLng = (str) => {
      const parts = str.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) return { latitude: lat, longitude: lng };
      }
      return null;
    };

    const originLoc = parseLatLng(origin);
    const destLoc = parseLatLng(destination);

    if (!originLoc || !destLoc) {
      return res.status(400).json({ error: 'origin and destination must be lat,lng format' });
    }

    try {
      const body = {
        origin: { location: { latLng: originLoc } },
        destination: { location: { latLng: destLoc } },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: false,
        polylineQuality: 'HIGH_QUALITY',
        languageCode: 'en',
        units: 'METRIC',
      };

      const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps,routes.legs.startLocation,routes.legs.endLocation,routes.legs.distanceMeters,routes.legs.duration,routes.legs.polyline',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        return res.json({ status: 'NOT_FOUND', error: data.error?.message || 'No routes found', routes: [] });
      }

      const route = data.routes[0];
      const leg = route.legs?.[0] || {};

      // Convert duration from seconds to readable
      const durationSec = parseInt(route.duration?.replace('s', '') || '0');
      const durationText = durationSec > 3600 
        ? `${Math.floor(durationSec / 3600)}h ${Math.floor((durationSec % 3600) / 60)}min`
        : `${Math.floor(durationSec / 60)} mins`;

      res.json({
        status: 'OK',
        polyline: route.polyline?.encodedPolyline || null,
        distance: leg.distanceMeters ? `${(leg.distanceMeters / 1000).toFixed(1)} km` : null,
        distance_meters: leg.distanceMeters || null,
        duration: durationText,
        duration_seconds: durationSec,
        start_location: leg.startLocation?.latLng || null,
        end_location: leg.endLocation?.latLng || null,
        summary: '',
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Distance Matrix via Routes API v2 ──
  app.get('/api/google/distance', async (req, res) => {
    const { origins, destinations } = req.query;
    if (!origins || !destinations) {
      return res.status(400).json({ error: 'origins and destinations are required' });
    }

    const parseLatLng = (str) => {
      const parts = str.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) return { latitude: lat, longitude: lng };
      }
      return null;
    };

    const originLoc = parseLatLng(origins);
    const destLoc = parseLatLng(destinations);

    if (!originLoc || !destLoc) {
      return res.status(400).json({ error: 'origins and destinations must be lat,lng format' });
    }

    try {
      const body = {
        origins: [{ waypoint: { location: { latLng: originLoc } } }],
        destinations: [{ waypoint: { location: { latLng: destLoc } } }],
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
      };

      const response = await fetch('https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,distanceMeters,status,condition',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!Array.isArray(data)) {
        return res.json({ status: 'ERROR', error: data.error?.message || 'Unknown error', results: [] });
      }

      const results = data.map(e => {
        const durationSec = parseInt(e.duration?.replace('s', '') || '0');
        return {
          status: e.condition === 'ROUTE_EXISTS' ? 'OK' : 'NOT_FOUND',
          distance: e.distanceMeters ? `${(e.distanceMeters / 1000).toFixed(1)} km` : null,
          distance_meters: e.distanceMeters || null,
          duration: durationSec > 3600 
            ? `${Math.floor(durationSec / 3600)}h ${Math.floor((durationSec % 3600) / 60)}min`
            : `${Math.floor(durationSec / 60)} mins`,
          duration_seconds: durationSec,
        };
      });

      res.json({ status: 'OK', results });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Geocoding via Places API (New) ──
  app.get('/api/google/geocode', async (req, res) => {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ error: 'address is required' });
    }

    try {
      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.id',
        },
        body: JSON.stringify({
          textQuery: address,
          languageCode: 'en',
          maxResultCount: 1,
          regionCode: 'ZA',
        }),
      });

      const data = await response.json();

      if (!data.places || data.places.length === 0) {
        return res.json({ status: 'NOT_FOUND', results: [] });
      }

      const place = data.places[0];
      res.json({
        status: 'OK',
        formatted_address: place.formattedAddress || place.displayName?.text || address,
        lat: place.location?.latitude || null,
        lng: place.location?.longitude || null,
        place_id: place.id || null,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  console.log('[Google API] Routes loaded (Routes API v2, Places API)');

  // ── Address autocomplete (free OSM Nominatim — no key, SA coverage) ──
  // Used by Snowman shop checkout delivery-address search.
  app.get('/api/address-autocomplete', async (req, res) => {
    const q = String(req.query.q || '').trim()
    if (q.length < 4) return res.json({ suggestions: [] })
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ', South Africa')}&format=json&addressdetails=1&countrycodes=za&limit=6`
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'SnowmanShop/1.0 (info@autoeffortless.com)',
          'Accept-Language': 'en',
        },
      })
      const data = await r.json()
      res.json({ suggestions: (Array.isArray(data) ? data : []).map((p) => ({ text: p.display_name, lat: p.lat, lon: p.lon })) })
    } catch (e) {
      res.status(502).json({ error: e.message })
    }
  })
}
