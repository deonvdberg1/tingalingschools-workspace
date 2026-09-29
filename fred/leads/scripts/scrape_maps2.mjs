import fs from 'fs';
import { createRequire } from 'module';
let chromium;
try { ({ chromium } = await import('playwright')); }
catch (e) { const require = createRequire('/opt/homebrew/lib/node_modules/'); ({ chromium } = require('playwright')); }

// Hybrid Google Maps scraper:
//  - reads the search payload (APP_INITIALIZATION_STATE + search?tbm=map XHR) for full place data
//  - only visits place pages for DOM results the payload missed
// usage: node scrape_maps2.mjs queries.txt out.jsonl [workers] [maxPerQuery]
const queriesFile = process.argv[2];
const outFile = process.argv[3];
const WORKERS = parseInt(process.argv[4] || '3', 10);
const MAXQ = parseInt(process.argv[5] || '40', 10);

const queries = fs.readFileSync(queriesFile, 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
const out = fs.createWriteStream(outFile, { flags: 'a' });
const qDoneFile = outFile + '.queries';
const doneQ = new Set(fs.existsSync(qDoneFile) ? fs.readFileSync(qDoneFile, 'utf8').split('\n').filter(Boolean) : []);
const seen = new Set();
if (fs.existsSync(outFile)) for (const l of fs.readFileSync(outFile, 'utf8').split('\n')) { if (l.trim()) { try { seen.add(JSON.parse(l).place_url); } catch {} } }

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  locale: 'en-ZA', timezoneId: 'Africa/Johannesburg',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36',
  viewport: { width: 1400, height: 950 },
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const jitter = (a, b) => sleep(a + Math.random() * (b - a));

const walk = (n, fn) => { if (Array.isArray(n)) { if (fn(n)) return true; for (const v of n) if (walk(v, fn)) return true; } return false; };

function entriesFrom(text) {
  const es = [];
  try {
    const d = JSON.parse(text.replace(/^\)\]\}'\n?/, ''));
    walk(d, (a) => {
      if (a.length > 30 && typeof a[11] === 'string' && typeof a[39] === 'string' && a[11].length && (Array.isArray(a[178]) || Array.isArray(a[7]))) {
        es.push(a); return false;
      }
      return false;
    });
  } catch {}
  return es;
}

function mapEntry(e, q) {
  const web = (Array.isArray(e[7]) && typeof e[7][0] === 'string' && /^https?/.test(e[7][0])) ? e[7][0] : '';
  const phone = (e[178] && e[178][0] && typeof e[178][0][0] === 'string') ? e[178][0][0] : ((e[178] && e[178][0] && e[178][0][1] && e[178][0][1][0] && e[178][0][1][0][0]) || '');
  const lat = e[9] && e[9][2] ? String(e[9][2]) : '';
  const lon = e[9] && e[9][3] ? String(e[9][3]) : '';
  const cid = typeof e[10] === 'string' ? e[10] : '';
  const pid = typeof e[78] === 'string' ? e[78] : '';
  const closed = JSON.stringify(e[203] || []).includes('Permanently closed');
  const tempClosed = JSON.stringify(e[203] || []).includes('Temporarily closed');
  const cat = (Array.isArray(e[13]) && typeof e[13][0] === 'string') ? e[13][0] : '';
  return {
    name: e[11], category: cat, address: e[39] || e[18] || '',
    phone, website: web, rating: e[4] && e[4][7] != null ? String(e[4][7]) : '',
    reviews: e[4] && e[4][8] != null ? String(e[4][8]) : '',
    city: e[166] || '', suburb: e[14] || '', lat, lon, cid, pid,
    permanently: closed, temporarily: tempClosed, query: q,
    place_url: cid ? `https://www.google.com/maps/place/?q=place_id:${pid || ''}&cid=${cid}` : '',
  };
}

async function extractPlace(p, url) {
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  try { await p.waitForSelector('div[role="main"] h1', { timeout: 8000 }); await sleep(700); } catch { await sleep(1200); }
  return await p.evaluate(() => {
    const g = s => document.querySelector(s);
    const at = (s, a) => { const e = g(s); return e ? (e.getAttribute(a) || '') : ''; };
    const h1 = g('div[role="main"] h1');
    const cb = g('button[jsaction*="category"]');
    const webEl = g('a[data-item-id="authority"]');
    return {
      name: h1 ? h1.textContent.trim() : '',
      category: cb ? cb.textContent.trim() : '',
      address: at('button[data-item-id="address"]', 'aria-label').replace(/^Address:\s*/, ''),
      phone: at('button[data-item-id^="phone:tel:"]', 'aria-label').replace(/^Phone:\s*/, ''),
      website: webEl ? (webEl.href || '') : '',
      rating: (() => { const e = document.querySelector('div.F7nice span[aria-hidden="true"]'); return e ? e.textContent : ''; })(),
      reviews: (() => { const e = document.querySelector('div.F7nice span[aria-label*="review"]'); return e ? (e.getAttribute('aria-label') || '') : ''; })(),
      permanently: document.body.innerText.includes('Permanently closed'),
      temporarily: document.body.innerText.includes('Temporarily closed'),
    };
  });
}

const nameKey = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

async function worker(id, queue) {
  const p = await ctx.newPage();
  const bodies = [];
  p.on('response', async r => { if (/search\?tbm=map/.test(r.url())) { try { bodies.push(await r.text()); } catch {} } });
  while (queue.length) {
    const q = queue.shift();
    if (!q) break;
    bodies.length = 0;
    let ents = [];
    let links = [];
    let got = false;
    for (let attempt = 1; attempt <= 5 && !got; attempt++) {
      ents = []; links = []; bodies.length = 0;
      try {
        await p.goto(`https://www.google.com/maps/search/${encodeURIComponent(q)}/?hl=en&gl=za`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await jitter(3000, 4500);
        for (const sel of ['button:has-text("Accept all")', 'button:has-text("Reject all")']) { const el = await p.$(sel); if (el) { try { await el.click({ timeout: 2000 }); await sleep(1200); } catch {} break; } }
        const feed = await p.$('div[role="feed"]');
        for (let i = 0; i < 8; i++) { if (feed) await feed.evaluate(e => e.scrollBy(0, 2400)); await jitter(1200, 1700); }
      } catch (e) {}
      try {
        const st = await p.evaluate(() => { try { return window.APP_INITIALIZATION_STATE[3].lg[2]; } catch (e) { return ''; } });
        if (st) ents = ents.concat(entriesFrom(st));
      } catch {}
      for (const t of bodies) ents = ents.concat(entriesFrom(t));
      try { links = await p.$$eval('a.hfpxzc', els => els.map(e => ({ href: e.href, name: e.getAttribute('aria-label') || '' }))); } catch {}
      if (ents.length || links.length) got = true;
      else {
        const back = 30000 + attempt * 30000;
        process.stderr.write(`[w${id}] EMPTY "${q}" attempt ${attempt} -> backoff ${back / 1000}s\n`);
        await sleep(back);
      }
    }
    if (!ents.length && !links.length) {
      process.stderr.write(`[w${id}] GAVE UP "${q}"\n`);
      continue;
    }
    const byName = new Map();
    for (const e of ents) { const k = nameKey(e[11]); if (k && !byName.has(k)) byName.set(k, mapEntry(e, q)); }

    // DOM links for anything the payload missed
    links = links.slice(0, MAXQ);
    const missing = [];
    for (const l of links) { const k = nameKey(l.name); if (k && !byName.has(k)) missing.push(l); }

    let emitted = 0;
    for (const r of byName.values()) {
      const key = r.place_url || (r.name + r.phone);
      if (seen.has(key)) continue;
      seen.add(key); out.write(JSON.stringify(r) + '\n'); emitted++;
    }
    for (const l of missing.slice(0, 25)) {
      const base = l.href.split('?')[0];
      if (seen.has(base)) continue;
      try {
        const d = await extractPlace(p, l.href);
        if (d && d.name) {
          const m = l.href.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
          d.place_url = base; d.query = q; d.lat = m ? m[1] : ''; d.lon = m ? m[2] : '';
          d.cid = ''; d.pid = '';
          if (!seen.has(base)) { seen.add(base); out.write(JSON.stringify(d) + '\n'); emitted++; }
        }
      } catch {}
      await jitter(600, 1100);
    }
    process.stderr.write(`[w${id}] ${q}: payload=${byName.size} dom=${links.length} missing=${missing.length} emitted=${emitted}\n`);
    fs.appendFileSync(qDoneFile, q + '\n');
    await jitter(900, 1600);
  }
  await p.close();
}

const queue = [...queries].filter(q => !doneQ.has(q)).sort(() => Math.random() - 0.5);
process.stderr.write(`queued ${queue.length} of ${queries.length} queries\n`);
await Promise.all(Array.from({ length: WORKERS }, (_, i) => worker(i + 1, queue)));
out.end();
await browser.close();
process.stderr.write('ALL DONE\n');
