import { chromium } from 'playwright';
import fs from 'fs';

// usage: node scrape_maps.mjs queries.txt out.jsonl [maxPerQuery] [workers]
const queriesFile = process.argv[2];
const outFile = process.argv[3];
const MAX = parseInt(process.argv[4] || '45', 10);
const WORKERS = parseInt(process.argv[5] || '2', 10);

const allQueries = fs.readFileSync(queriesFile, 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
const out = fs.createWriteStream(outFile, { flags: 'a' });
const doneFile = outFile + '.done';
fs.writeFileSync(doneFile, '');
const seenPlaces = new Set();
if (fs.existsSync(outFile)) {
  for (const l of fs.readFileSync(outFile, 'utf8').split('\n')) {
    if (!l.trim()) continue;
    try { seenPlaces.add(JSON.parse(l).place_url); } catch {}
  }
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  locale: 'en-ZA', timezoneId: 'Africa/Johannesburg',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36',
  viewport: { width: 1400, height: 950 },
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const jitter = (a, b) => sleep(a + Math.random() * (b - a));

async function collectLinks(p, q) {
  const url = `https://www.google.com/maps/search/${encodeURIComponent(q)}/?hl=en&gl=za`;
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await jitter(2500, 4000);
  for (const sel of ['button:has-text("Accept all")', 'button:has-text("Reject all")']) {
    const el = await p.$(sel);
    if (el) { try { await el.click({ timeout: 2500 }); await sleep(1500); } catch {} break; }
  }
  const feed = await p.$('div[role="feed"]');
  if (!feed) return [];
  let last = 0;
  for (let i = 0; i < 22; i++) {
    await feed.evaluate(e => e.scrollBy(0, 2400));
    await jitter(900, 1400);
    const n = await p.$$eval('a.hfpxzc', e => e.length);
    if (n >= MAX) break;
    if (n === last && i > 3) break;
    last = n;
  }
  const links = await p.$$eval('a.hfpxzc', els => els.map(e => e.href));
  return [...new Set(links)].slice(0, MAX);
}

const EXTRACT = () => {
  const g = s => document.querySelector(s);
  const attr = (s, a) => { const e = g(s); return e ? (e.getAttribute(a) || '') : ''; };
  const h1 = g('div[role="main"] h1') || g('h1');
  let cat = '';
  const cb = document.querySelector('button[jsaction*="category"]');
  if (cb) cat = cb.textContent.trim();
  if (!cat) { const d = g('div[role="main"] div.fontBodyMedium'); if (d) cat = d.textContent.trim().split('·')[0].trim(); }
  const webEl = g('a[data-item-id="authority"]');
  return {
    name: h1 ? h1.textContent.trim() : '',
    category: cat,
    address: attr('button[data-item-id="address"]', 'aria-label').replace(/^Address:\s*/, ''),
    phone: attr('button[data-item-id^="phone:tel:"]', 'aria-label').replace(/^Phone:\s*/, ''),
    website: webEl ? (webEl.getAttribute('href') || '') : '',
    webLabel: webEl ? (webEl.getAttribute('aria-label') || '') : '',
    rating: (() => { const e = document.querySelector('div.F7nice span[aria-hidden="true"]'); return e ? e.textContent : ''; })(),
    reviews: (() => { const e = document.querySelector('div.F7nice span[aria-label*="review"]'); return e ? e.getAttribute('aria-label') : ''; })(),
    permanently: document.body.innerText.includes('Permanently closed'),
    temporarily: document.body.innerText.includes('Temporarily closed'),
  };
};

async function extractPlace(p, url) {
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  try {
    await p.waitForSelector('div[role="main"] h1, h1', { timeout: 9000 });
    await sleep(900);
  } catch { await sleep(1500); }
  return await p.evaluate(EXTRACT);
}

async function worker(id, queue) {
  const p = await ctx.newPage();
  while (queue.length) {
    const q = queue.shift();
    if (!q) break;
    let links = [];
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        links = await collectLinks(p, q);
      } catch (e) { links = []; }
      if (links.length) break;
      const back = 45000 * attempt;
      process.stderr.write(`[w${id}] 0 results "${q}" attempt ${attempt} -> backoff ${back / 1000}s\n`);
      await sleep(back);
    }
    process.stderr.write(`[w${id}] ${q}: ${links.length} places\n`);
    for (const l of links) {
      const base = l.split('?')[0];
      if (seenPlaces.has(base)) continue;
      seenPlaces.add(base);
      let d = null;
      for (let a = 1; a <= 2; a++) {
        try { d = await extractPlace(p, l); if (d && d.name) break; } catch (e) { d = null; }
        await sleep(2500);
      }
      if (d && d.name) {
        const m = l.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
        d.query = q; d.place_url = base;
        d.lat = m ? m[1] : ''; d.lon = m ? m[2] : '';
        out.write(JSON.stringify(d) + '\n');
        fs.appendFileSync(doneFile, base + '\n');
      }
      await jitter(700, 1400);
    }
    await jitter(1200, 2200);
  }
  await p.close();
}

const queue = [...allQueries].sort(() => Math.random() - 0.5);
await Promise.all(Array.from({ length: WORKERS }, (_, i) => worker(i + 1, queue)));
out.end();
await browser.close();
process.stderr.write('ALL DONE\n');
