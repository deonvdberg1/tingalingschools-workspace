// ─────────────────────────────────────────────────────────────────────────────
// Site Analytics module — SELF-HOSTED tracking for NG Kerk Meerensee
// The website beacons pageviews/events to POST /api/track; the admin dashboard
// reads analytics from private/hits.jsonl. No third-party analytics.
// Business-relevant metrics: visits, booking clicks (WhatsApp per cruise),
// weather-calendar views, referrers, locations, devices.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

const TRACK_FILE = path.join(__dirname, 'private', 'hits.jsonl');
const MAX_HITS = 100000;

// ── In-memory hit store (loaded at boot, appended on each event) ──
let hits = [];
try {
  const raw = fs.readFileSync(TRACK_FILE, 'utf-8');
  hits = raw.split('\n').filter(Boolean)
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
} catch { hits = []; }

function appendHit(h) {
  hits.push(h);
  if (hits.length > MAX_HITS) hits = hits.slice(-MAX_HITS);
  try { fs.appendFileSync(TRACK_FILE, JSON.stringify(h) + '\n'); } catch (e) {}
}

// ── Country code → name (CF-IPCountry header comes via the Cloudflare tunnel) ──
const COUNTRIES = {
  ZA: 'South Africa', US: 'United States', GB: 'United Kingdom', DE: 'Germany',
  FR: 'France', NL: 'Netherlands', NG: 'Nigeria', KE: 'Kenya', GH: 'Ghana',
  BW: 'Botswana', ZW: 'Zimbabwe', MZ: 'Mozambique', ZM: 'Zambia', NA: 'Namibia',
  LS: 'Lesotho', SZ: 'Eswatini', AU: 'Australia', CA: 'Canada', IN: 'India',
  CN: 'China', AE: 'UAE', SA: 'Saudi Arabia', IE: 'Ireland', PT: 'Portugal',
  ES: 'Spain', IT: 'Italy', BR: 'Brazil', TZ: 'Tanzania', UG: 'Uganda',
};
function countryName(code) {
  if (!code) return 'Unknown';
  return COUNTRIES[code.toUpperCase()] || code.toUpperCase();
}

// ── Simple UA parsing ──
function parseUA(ua = '') {
  const u = ua.toLowerCase();
  let browser = 'Other';
  if (u.includes('edg/') || u.includes('edge')) browser = 'Edge';
  else if (u.includes('chrome')) browser = 'Chrome';
  else if (u.includes('firefox')) browser = 'Firefox';
  else if (u.includes('safari')) browser = 'Safari';
  else if (u.includes('opera') || u.includes('opr')) browser = 'Opera';
  else if (u.includes('micromessenger')) browser = 'WeChat';
  let system = 'Other';
  if (u.includes('windows')) system = 'Windows';
  else if (u.includes('android')) system = 'Android';
  else if (u.includes('iphone') || u.includes('ipad') || u.includes('ios')) system = 'iOS';
  else if (u.includes('mac os')) system = 'macOS';
  else if (u.includes('linux')) system = 'Linux';
  let device = 'desktop';
  if (u.includes('mobile') || (u.includes('android') && u.includes('mobile'))) device = 'mobile';
  else if (u.includes('ipad') || u.includes('tablet')) device = 'tablet';
  return { browser, system, device };
}

function screenClass(screen = '') {
  const m = screen.match(/(\d+)x(\d+)/);
  if (!m) return 'Unknown';
  const w = parseInt(m[1]);
  if (w < 768) return 'Mobile';
  if (w < 1025) return 'Tablet';
  return 'Desktop';
}

// ── Beacon rate limiting (light per-IP throttle) ──
const hitBuckets = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const bucket = hitBuckets.get(ip) || { count: 0, reset: now + 60_000 };
  if (now > bucket.reset) { bucket.count = 0; bucket.reset = now + 60_000; }
  bucket.count += 1;
  hitBuckets.set(ip, bucket);
  return bucket.count > 120; // max 120 beacon req/min per IP
}

// ── Cruise extraction from WhatsApp booking text ──
const CRUISES = ['Sunset Passage', 'Good Morning Kowie', 'Afternoon Exploration', 'Celebration Cruise'];
function cruiseOf(label = '') {
  for (const c of CRUISES) {
    if (label.toLowerCase().includes(c.toLowerCase())) return c;
  }
  if (label.toLowerCase().includes('capture')) return 'Capture the Moment';
  return 'General Enquiry';
}

function rangeParams(q) {
  const from = q.from || new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);
  const to = q.to || new Date().toISOString().slice(0, 10);
  return { from, to };
}

function internalSql(q) {
  return q.internal === '1' ? '' : ' AND internal = 0';
}

function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url || 'direct'; }
}

function filterHits({ from, to, internal, eventOnly }) {
  const f = from || rangeParams({}).from;
  const t = to || rangeParams({}).to;
  return hits.filter((h) => {
    const day = (h.ts || '').slice(0, 10);
    if (day < f || day > t) return false;
    if (internal !== '1' && h.internal) return false;
    if (eventOnly && !h.event) return false;
    return true;
  });
}

// ── Route setup ──
function setupAnalytics(app, { authenticate, requireRole }) {
  const adminOnly = [authenticate, requireRole('admin')];

  // ── POST /api/track — public beacon (no auth) ──
  app.post('/api/track', (req, res) => {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || '';
    if (rateLimited(ip)) return res.status(429).json({ error: 'Too many requests' });

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'bad json' }); } }
    if (!body || typeof body !== 'object') return res.status(400).json({ error: 'bad body' });

    const hit = {
      ts: new Date().toISOString(),
      path: String(body.path || '/').slice(0, 500),
      title: String(body.title || '').slice(0, 300),
      referrer: String(body.referrer || '').slice(0, 500),
      ua: String(body.ua || req.headers['user-agent'] || '').slice(0, 300),
      screen: String(body.screen || '').slice(0, 30),
      event: body.event ? String(body.event).slice(0, 50) : '',
      label: String(body.label || '').slice(0, 200),
      country: countryName(String(req.headers['cf-ipcountry'] || '').slice(0, 2)),
      ip,
      internal: body.internal ? 1 : 0,
    };
    appendHit(hit);
    res.json({ ok: true });
  });

  // ── GET /api/admin/analytics/overview — KPIs + daily + hourly + booking funnel ──
  app.get('/api/admin/analytics/overview', ...adminOnly, (req, res) => {
    const { from, to } = rangeParams(req.query);
    const views = filterHits({ from, to, internal: req.query.internal }).filter((h) => !h.event);
    const events = filterHits({ from, to, internal: req.query.internal }).filter((h) => h.event);
    const clicks = events.filter((e) => e.event === 'whatsapp-click');
    const calendarViews = views.filter((v) => v.path.includes('calendar'));

    const dailyMap = {};
    views.forEach((v) => { const d = v.ts.slice(0, 10); dailyMap[d] = (dailyMap[d] || 0) + 1; });
    const daily = Object.keys(dailyMap).sort().map((day) => ({ day, daily: dailyMap[day] }));

    const hourlyArr = new Array(24).fill(0);
    views.forEach((v) => { const h = new Date(v.ts).getHours(); hourlyArr[h] += 1; });

    const split = { internal: 0, external: 0 };
    filterHits({ from, to, internal: req.query.internal }).filter((h) => !h.event).forEach((v) => { if (v.internal) split.internal += 1; else split.external += 1; });

    const totalVisits = views.length;
    const days = Math.max(1, daily.length);
    res.json({
      site: 'self-hosted',
      domain: 'ngmeerensee.co.za',
      range: { from, to },
      totals: {
        visits: totalVisits,
        events: events.length,
        booking_clicks: clicks.length,
        avg_per_day: Math.round((totalVisits / days) * 10) / 10,
      },
      split,
      filtering: req.query.internal === '1' ? 'all' : 'customers-only',
      funnel: {
        visits: totalVisits,
        calendar_views: calendarViews.length,
        booking_clicks: clicks.length,
        conversion_rate: totalVisits > 0 ? Math.round((clicks.length / totalVisits) * 1000) / 10 : 0,
      },
      daily,
      hourly: hourlyArr,
      last_updated: new Date().toISOString(),
    });
  });

  // ── GET /api/admin/analytics/cruises — WhatsApp booking clicks per cruise ──
  app.get('/api/admin/analytics/cruises', ...adminOnly, (req, res) => {
    const { from, to } = rangeParams(req.query);
    const clicks = filterHits({ from, to, internal: req.query.internal }).filter((e) => e.event === 'whatsapp-click');
    const byCruise = {};
    clicks.forEach((c) => { const k = cruiseOf(c.label); byCruise[k] = (byCruise[k] || 0) + 1; });
    const total = clicks.length || 1;
    const cruises = Object.entries(byCruise)
      .map(([name, count]) => ({ name, count, share: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);
    res.json({ cruises, total: clicks.length });
  });

  // ── GET /api/admin/analytics/pages — top pages ──
  app.get('/api/admin/analytics/pages', ...adminOnly, (req, res) => {
    const { from, to } = rangeParams(req.query);
    const rows = {};
    filterHits({ from, to, internal: req.query.internal }).filter((h) => !h.event).forEach((v) => {
      const key = v.path + '|' + (v.title || '');
      if (!rows[key]) rows[key] = { path: v.path, title: v.title || '', visitors: 0 };
      rows[key].visitors += 1;
    });
    res.json({ pages: Object.values(rows).sort((a, b) => b.visitors - a.visitors).slice(0, 20) });
  });

  // ── GET /api/admin/analytics/referrers ──
  app.get('/api/admin/analytics/referrers', ...adminOnly, (req, res) => {
    const { from, to } = rangeParams(req.query);
    const refs = {};
    filterHits({ from, to, internal: req.query.internal }).filter((h) => !h.event && h.referrer).forEach((v) => {
      const d = domainOf(v.referrer);
      refs[d] = (refs[d] || 0) + 1;
    });
    res.json({ refs: Object.entries(refs).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 15) });
  });

  // ── GET /api/admin/analytics/locations ──
  app.get('/api/admin/analytics/locations', ...adminOnly, (req, res) => {
    const { from, to } = rangeParams(req.query);
    const locs = {};
    filterHits({ from, to, internal: req.query.internal }).filter((h) => !h.event).forEach((v) => {
      const c = v.country || 'Unknown';
      locs[c] = (locs[c] || 0) + 1;
    });
    res.json({ locations: Object.entries(locs).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count) });
  });

  // ── GET /api/admin/analytics/devices ──
  app.get('/api/admin/analytics/devices', ...adminOnly, (req, res) => {
    const { from, to } = rangeParams(req.query);
    const browsers = {}, systems = {}, sizes = {};
    filterHits({ from, to, internal: req.query.internal }).filter((h) => !h.event).forEach((v) => {
      const p = parseUA(v.ua);
      browsers[p.browser] = (browsers[p.browser] || 0) + 1;
      systems[p.system] = (systems[p.system] || 0) + 1;
      const sc = screenClass(v.screen);
      sizes[sc] = (sizes[sc] || 0) + 1;
    });
    const sort = (o) => Object.entries(o).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    res.json({ browsers: sort(browsers), systems: sort(systems), sizes: sort(sizes) });
  });

  // ── GET /api/admin/analytics/export — CSV ──
  app.get('/api/admin/analytics/export', ...adminOnly, (req, res) => {
    const { from, to } = rangeParams(req.query);
    let csv = 'ts,type,path,title,event,label,referrer,country,internal\n';
    filterHits({ from, to, internal: req.query.internal }).forEach((h) => {
      csv += `${h.ts},${h.event ? 'event' : 'page'},"${String(h.path || '').replace(/"/g, '""')}","${String(h.title || '').replace(/"/g, '""')}",${h.event},"${String(h.label || '').replace(/"/g, '""')}","${String(h.referrer || '').replace(/"/g, '""')}",${h.country || ''},${h.internal ? 'yes' : 'no'}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="river-whisperer-analytics-${from}-to-${to}.csv"`);
    res.send(csv);
  });

  // ── GET /api/admin/analytics/health — tracker health ──
  app.get('/api/admin/analytics/health', ...adminOnly, (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const todayHits = hits.filter((h) => h.ts.slice(0, 10) === today && !h.event).length;
    res.json({
      ok: true,
      script_present: true,
      today_hits: todayHits,
      total_hits: hits.length,
      last_hit: hits.length ? hits[hits.length - 1].ts : null,
      checked_at: new Date().toISOString(),
    });
  });
}

module.exports = { setupAnalytics, appendHit };
