// ─────────────────────────────────────────────────────────────────────────────
// Site Analytics module — SELF-HOSTED tracking (SQLite)
// The site beacons pageviews/events to POST /api/site-track; the portal reads
// analytics from our own site_hits table. No third-party analytics dependency.
// Also logs portal auth activity (signins, signups, failures).
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HEALTH_TTL_MS = 5 * 60_000;

const cache = new Map();

// ── Country code → name (used for CF-IPCountry from the tunnel) ──
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

// ── Auth logging (used by server.js signin/signup routes) ──
export function logAuthEvent(action, user, req) {
  try {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || '';
    const ua = (req.headers['user-agent'] || '').slice(0, 300);
    run(
      `INSERT INTO login_log (user_id, email, name, role, client_id, action, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user?.id || null,
        (user?.email || '').slice(0, 200),
        (user?.name || '').slice(0, 100),
        user?.role || '',
        user?.client_id || null,
        action,
        ip,
        ua,
      ]
    );
    saveDb();
  } catch (e) {
    console.error('[SiteAnalytics] login log error:', e.message);
  }
}

// ── Simple UA parsing (browser / OS / device class) ──
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
  if (u.includes('mobile') || u.includes('android') && u.includes('mobile')) device = 'mobile';
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
  if (now > bucket.reset) {
    bucket.count = 0;
    bucket.reset = now + 60_000;
  }
  bucket.count += 1;
  hitBuckets.set(ip, bucket);
  return bucket.count > 120; // max 120 beacon req/min per IP
}

// ── Route setup ──
export function setupSiteAnalyticsRoutes(app, { query, run: _run, saveDb: _saveDb, requireAuth }) {
  run = _run;
  saveDb = _saveDb;

  function resolve(req, res, next) {
    const clientId = req.user.role === 'overlord'
      ? (req.query.clientId ? Number(req.query.clientId) : null)
      : (req.user.client_id || null);
    if (!clientId) return res.status(400).json({ error: 'clientId required' });
    if (req.user.role !== 'overlord' && req.user.client_id != clientId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.analyticsClientId = clientId;
    next();
  }

  // ── POST /api/site-track — public beacon from the website (no auth) ──
  app.post('/api/site-track', express.text({ type: '*/*', limit: '64kb' }), (req, res) => {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || '';
    if (rateLimited(ip)) return res.status(429).json({ error: 'Too many requests' });
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'bad json' }); }
    }
    if (!body || typeof body !== 'object') return res.status(400).json({ error: 'bad body' });
    const clientId = Number(body.clientId) || 6; // default Ting-A-Ling (client 6)
    const path = String(body.path || '/').slice(0, 500);
    const title = String(body.title || '').slice(0, 300);
    const referrer = String(body.referrer || '').slice(0, 500);
    const ua = String(body.ua || req.headers['user-agent'] || '').slice(0, 300);
    const screen = String(body.screen || '').slice(0, 30);
    const isEvent = body.event ? 1 : 0;
    const eventLabel = String(body.label || (isEvent ? title : '')).slice(0, 200);
    const countryCode = String(req.headers['cf-ipcountry'] || '').slice(0, 2);
    const country = countryName(countryCode);
    try {
      const internal = body.internal ? 1 : 0;
      const section = String(body.section || deriveSection(path)).slice(0, 20);
      run(
        `INSERT INTO site_hits (client_id, path, title, referrer, ua, screen, country, is_event, event_label, ip, internal, section)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [clientId, path, title, referrer, ua, screen, country, isEvent, eventLabel, ip, internal, section]
      );
      saveDb();
      res.json({ ok: true });
    } catch (e) {
      console.error('[SiteAnalytics] track error:', e.message);
      res.status(500).json({ error: 'track failed' });
    }
  });

  // ── GET /api/site-analytics/configs — all configs (overlord) ──
  app.get('/api/site-analytics/configs', requireAuth, (req, res) => {
    if (req.user.role !== 'overlord') return res.status(403).json({ error: 'Forbidden' });
    try {
      const rows = query(
        `SELECT c.id AS client_id, c.name AS client_name, c.status AS client_status,
                s.site_code, s.domain, s.enabled, s.updated_at
         FROM clients c
         LEFT JOIN site_analytics_configs s ON s.client_id = c.id
         ORDER BY c.created_at DESC`
      );
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /api/site-analytics/config — one client's config ──
  app.get('/api/site-analytics/config', requireAuth, resolve, (req, res) => {
    const cfg = query('SELECT * FROM site_analytics_configs WHERE client_id = ?', [req.analyticsClientId])[0] || null;
    res.json(cfg);
  });

  // ── POST /api/site-analytics/config — upsert (overlord) ──
  app.post('/api/site-analytics/config', requireAuth, (req, res) => {
    if (req.user.role !== 'overlord') return res.status(403).json({ error: 'Forbidden' });
    const { clientId, site_code, domain, enabled } = req.body;
    if (!clientId || !site_code) return res.status(400).json({ error: 'clientId and site_code required' });
    try {
      const existing = query('SELECT client_id FROM site_analytics_configs WHERE client_id = ?', [clientId]);
      if (existing.length > 0) {
        run(
          `UPDATE site_analytics_configs SET site_code = ?, domain = ?, enabled = ?, updated_at = datetime('now','localtime') WHERE client_id = ?`,
          [site_code, domain || '', enabled === undefined ? 1 : enabled ? 1 : 0, clientId]
        );
      } else {
        run(
          `INSERT INTO site_analytics_configs (client_id, site_code, domain, enabled) VALUES (?, ?, ?, ?)`,
          [clientId, site_code, domain || '', enabled === undefined ? 1 : enabled ? 1 : 0]
        );
      }
      saveDb();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /api/site-analytics/overview — KPIs + daily + hourly + funnel ──
  app.get('/api/site-analytics/overview', requireAuth, resolve, (req, res) => {
    const { from, to } = rangeParams(req.query);
    const cid = req.analyticsClientId;
    const incl = internalSql(req.query);

    const tot = query(
      `SELECT
         SUM(CASE WHEN is_event = 0 THEN 1 ELSE 0 END) AS visits,
         SUM(CASE WHEN is_event = 1 THEN 1 ELSE 0 END) AS events,
         COUNT(DISTINCT CASE WHEN is_event = 0 THEN path END) AS pages
       FROM site_hits WHERE client_id = ? AND date(created_at) BETWEEN date(?) AND date(?)${incl}`,
      [cid, from, to]
    )[0] || {};

    const daily = query(
      `SELECT date(created_at) AS day, COUNT(*) AS daily
       FROM site_hits WHERE client_id = ? AND is_event = 0 AND date(created_at) BETWEEN date(?) AND date(?)${incl}
       GROUP BY date(created_at) ORDER BY day`,
      [cid, from, to]
    );

    const hourlyRows = query(
      `SELECT CAST(strftime('%H', created_at) AS INTEGER) AS h, COUNT(*) AS c
       FROM site_hits WHERE client_id = ? AND is_event = 0 AND date(created_at) BETWEEN date(?) AND date(?)${incl}
       GROUP BY h`,
      [cid, from, to]
    );
    const hourly = new Array(24).fill(0);
    hourlyRows.forEach((r) => { hourly[r.h] = r.c; });

    const applyViews = query(
      `SELECT COUNT(*) AS c FROM site_hits
       WHERE client_id = ? AND is_event = 0 AND lower(path) LIKE '%apply%' AND date(created_at) BETWEEN date(?) AND date(?)${incl}`,
      [cid, from, to]
    )[0]?.c || 0;
    const applySubmits = query(
      `SELECT COUNT(*) AS c FROM site_hits
       WHERE client_id = ? AND is_event = 1 AND event_label LIKE 'apply-submit%' AND date(created_at) BETWEEN date(?) AND date(?)${incl}`,
      [cid, from, to]
    )[0]?.c || 0;

    const splitRows = query(
      `SELECT internal, COUNT(*) AS c FROM site_hits
       WHERE client_id = ? AND is_event = 0 AND date(created_at) BETWEEN date(?) AND date(?)
       GROUP BY internal`,
      [cid, from, to]
    );
    const split = { internal: 0, external: 0 };
    splitRows.forEach((r) => { if (r.internal) split.internal = r.c; else split.external = r.c; });

    const totalVisits = tot.visits || 0;
    const days = daily.length || 1;
    res.json({
      site: 'self-hosted',
      domain: (query('SELECT domain FROM site_analytics_configs WHERE client_id = ?', [cid])[0]?.domain) || '',
      range: { from, to },
      totals: {
        visits: totalVisits,
        events: tot.events || 0,
        pages: tot.pages || 0,
        avg_per_day: Math.round((totalVisits / days) * 10) / 10,
      },
      split,
      filtering: req.query.internal === '1' ? 'all' : 'customers-only',
      funnel: {
        apply_views: applyViews,
        apply_submits: applySubmits,
        conversion_rate: applyViews > 0 ? Math.round((applySubmits / applyViews) * 1000) / 10 : 0,
      },
      daily: daily.map((d) => ({ day: d.day, daily: d.daily })),
      hourly,
      last_updated: new Date().toISOString(),
    });
  });

  // ── GET /api/site-analytics/pages — top pages + events split ──
  app.get('/api/site-analytics/pages', requireAuth, resolve, (req, res) => {
    const { from, to } = rangeParams(req.query);
    const cid = req.analyticsClientId;
    const rows = query(
      `SELECT path, title, is_event, COUNT(*) AS visitors, MAX(id) AS path_id
       FROM site_hits WHERE client_id = ? AND date(created_at) BETWEEN date(?) AND date(?)${internalSql(req.query)}
       GROUP BY path ORDER BY visitors DESC LIMIT 100`,
      [cid, from, to]
    );
    const pages = rows.filter((r) => !r.is_event).map((r) => ({
      path: r.path, title: r.title || '', type: 'page', visitors: r.visitors, path_id: r.path_id,
    }));
    const events = rows
      .filter((r) => r.is_event)
      .map((r) => ({
        path: r.path, title: r.event_label ? `${r.event_label}` : r.title || '', type: 'event', visitors: r.visitors, path_id: r.path_id,
      }));
    res.json({ pages, events });
  });

  // ── GET /api/site-analytics/referrers — top referrer domains ──
  app.get('/api/site-analytics/referrers', requireAuth, resolve, (req, res) => {
    const { from, to } = rangeParams(req.query);
    const cid = req.analyticsClientId;
    const rows = query(
      `SELECT referrer, COUNT(*) AS count FROM site_hits
       WHERE client_id = ? AND is_event = 0 AND referrer != '' AND date(created_at) BETWEEN date(?) AND date(?)${internalSql(req.query)}
       GROUP BY referrer ORDER BY count DESC LIMIT 25`,
      [cid, from, to]
    );
    const refs = rows.map((r) => ({ name: domainOf(r.referrer), count: r.count }));
    const merged = [];
    refs.forEach((r) => {
      const found = merged.find((m) => m.name === r.name);
      if (found) found.count += r.count; else merged.push(r);
    });
    merged.sort((a, b) => b.count - a.count);
    res.json({ refs: merged, path: req.query.path || 'ALL' });
  });

  // ── GET /api/site-analytics/locations — countries (from CF-IPCountry) ──
  app.get('/api/site-analytics/locations', requireAuth, resolve, (req, res) => {
    const { from, to } = rangeParams(req.query);
    const cid = req.analyticsClientId;
    const rows = query(
      `SELECT country, COUNT(*) AS count FROM site_hits
       WHERE client_id = ? AND is_event = 0 AND date(created_at) BETWEEN date(?) AND date(?)${internalSql(req.query)}
       GROUP BY country ORDER BY count DESC`,
      [cid, from, to]
    );
    res.json({ locations: rows.map((r) => ({ name: r.country || 'Unknown', count: r.count })) });
  });

  // ── GET /api/site-analytics/devices — browsers, systems, screen classes ──
  app.get('/api/site-analytics/devices', requireAuth, resolve, (req, res) => {
    const { from, to } = rangeParams(req.query);
    const cid = req.analyticsClientId;
    const rows = query(
      `SELECT ua, screen FROM site_hits WHERE client_id = ? AND is_event = 0 AND date(created_at) BETWEEN date(?) AND date(?)${internalSql(req.query)}`,
      [cid, from, to]
    );
    const browsers = {};
    const systems = {};
    const sizes = {};
    rows.forEach((r) => {
      const p = parseUA(r.ua);
      browsers[p.browser] = (browsers[p.browser] || 0) + 1;
      systems[p.system] = (systems[p.system] || 0) + 1;
      const sc = screenClass(r.screen);
      sizes[sc] = (sizes[sc] || 0) + 1;
    });
    const sort = (o) => Object.entries(o).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    res.json({ browsers: sort(browsers), systems: sort(systems), sizes: sort(sizes) });
  });

  // ── GET /api/site-analytics/logins — portal auth activity ──
  app.get('/api/site-analytics/logins', requireAuth, resolve, (req, res) => {
    const { from, to } = rangeParams(req.query);
    const cid = req.analyticsClientId;
    const logins = query(
      `SELECT id, user_id, email, name, role, action, ip, user_agent, created_at
       FROM login_log
       WHERE (? IS NULL OR client_id = ?) AND date(created_at) BETWEEN date(?) AND date(?)
       ORDER BY id DESC LIMIT 200`,
      [cid, cid, from, to]
    );
    const summary = query(
      `SELECT action, COUNT(*) AS count FROM login_log
       WHERE (? IS NULL OR client_id = ?) AND date(created_at) BETWEEN date(?) AND date(?)
       GROUP BY action`,
      [cid, cid, from, to]
    );
    res.json({ logins, summary });
  });


  // ── GET /api/site-analytics/sections — traffic per school section (main / pre-primary / special-needs / apply) ──
  app.get('/api/site-analytics/sections', requireAuth, resolve, (req, res) => {
    const { from, to } = rangeParams(req.query);
    const cid = req.analyticsClientId;
    const incl = internalSql(req.query);

    const viewRows = query(
      `SELECT section,
              COUNT(*) AS views,
              SUM(CASE WHEN path LIKE '%apply%' THEN 1 ELSE 0 END) AS apply_views
       FROM site_hits
       WHERE client_id = ? AND is_event = 0 AND date(created_at) BETWEEN date(?) AND date(?)
         AND section != ''${incl}
       GROUP BY section`,
      [cid, from, to]
    );
    const submitRows = query(
      `SELECT section, COUNT(*) AS submits
       FROM site_hits
       WHERE client_id = ? AND is_event = 1 AND event_label LIKE 'apply-submit%'
         AND date(created_at) BETWEEN date(?) AND date(?) AND section != ''${incl}
       GROUP BY section`,
      [cid, from, to]
    );

    const order = ['pre-primary', 'special-needs', 'main', 'apply'];
    const byName = {};
    viewRows.forEach((r) => { byName[r.section] = { views: r.views, apply_views: r.apply_views }; });
    submitRows.forEach((r) => { if (byName[r.section]) byName[r.section].submits = r.submits; });

    const sections = order.map((name) => {
      const d = byName[name] || { views: 0, apply_views: 0 };
      const submits = d.submits || 0;
      return {
        section: name,
        views: d.views,
        apply_views: d.apply_views,
        apply_submits: submits,
        conversion_rate: d.apply_views > 0 ? Math.round((submits / d.apply_views) * 1000) / 10 : 0,
      };
    });
    // any other sections not in the fixed order (e.g. legacy '' or unexpected)
    Object.keys(byName).forEach((k) => {
      if (!order.includes(k)) sections.push({ section: k, views: byName[k].views, apply_views: byName[k].apply_views, apply_submits: byName[k].submits || 0, conversion_rate: 0 });
    });

    res.json({ sections });
  });

  // ── GET /api/site-analytics/export — CSV ──
  app.get('/api/site-analytics/export', requireAuth, resolve, (req, res) => {
    const { from, to } = rangeParams(req.query);
    const cid = req.analyticsClientId;
    let csv = 'type,path,title,visitors\n';
    query(
      `SELECT path, title, is_event, COUNT(*) AS visitors FROM site_hits
       WHERE client_id = ? AND date(created_at) BETWEEN date(?) AND date(?)${internalSql(req.query)}
       GROUP BY path ORDER BY visitors DESC`,
      [cid, from, to]
    ).forEach((r) => {
      csv += `${r.is_event ? 'event' : 'page'},"${String(r.path || '').replace(/"/g, '""')}","${String(r.title || '').replace(/"/g, '""')}",${r.visitors}\n`;
    });
    csv += '\nportal_action,email,role,ip,created_at\n';
    query(
      `SELECT action, email, role, ip, created_at FROM login_log
       WHERE (? IS NULL OR client_id = ?) AND date(created_at) BETWEEN date(?) AND date(?)
       ORDER BY id DESC LIMIT 500`,
      [cid, cid, from, to]
    ).forEach((l) => {
      csv += `${l.action},${l.email},${l.role || ''},${l.ip || ''},${l.created_at}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="site-analytics-${from}-to-${to}.csv"`);
    res.send(csv);
  });

  // ── GET /api/site-analytics/health — tracker health check ──
  app.get('/api/site-analytics/health', requireAuth, resolve, async (req, res) => {
    const cid = req.analyticsClientId;
    const domain = query('SELECT domain FROM site_analytics_configs WHERE client_id = ?', [cid])[0]?.domain || 'tingalingschools.com';

    const cacheKey = `health:${cid}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.at < HEALTH_TTL_MS) return res.json(cached.data);

    let scriptPresent = false;
    try {
      const page = await fetch(`https://${domain}/`, { headers: { 'User-Agent': 'AutoEffortless-HealthCheck/1.0' } });
      scriptPresent = (await page.text()).includes('site-track');
    } catch {}

    const today = new Date().toISOString().slice(0, 10);
    const todayHits = query(
      `SELECT COUNT(*) AS c FROM site_hits WHERE client_id = ? AND is_event = 0 AND date(created_at) = date(?)`,
      [cid, today]
    )[0]?.c || 0;

    const data = { ok: scriptPresent, script_present: scriptPresent, today_hits: todayHits, checked_at: new Date().toISOString() };
    cache.set(cacheKey, { at: Date.now(), data });
    res.json(data);
  });
}


// ── Internal-traffic filtering (owner/staff visits vs customers) ──

function deriveSection(path) {
  const p = String(path || '').toLowerCase();
  if (p.includes('special')) return 'special-needs';
  if (p.includes('preprimary') || p.includes('pre-primary') || p.includes('pre_primary')) return 'pre-primary';
  if (p.includes('apply')) return 'apply';
  return 'main';
}

function internalSql(q) {
  // default: EXCLUDE internal visits; pass internal=1 to include everything
  return q.internal === '1' ? '' : ' AND internal = 0';
}

function rangeParams(q) {
  const from = q.from || new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);
  const to = q.to || new Date().toISOString().slice(0, 10);
  return { from, to };
}

function domainOf(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url || 'direct';
  }
}

let run = () => {};
let saveDb = () => {};
