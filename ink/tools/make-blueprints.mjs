#!/usr/bin/env node
/**
 * make-blueprints.mjs — printable drawing templates for Mr D
 *
 * Renders B5 manga page blueprints (panel boxes at the exact aspect ratios the
 * compositor uses) so hand-drawn panels drop straight into the page layout.
 *
 * usage: node tools/make-blueprints.mjs [outdir]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire('/opt/homebrew/lib/node_modules/');
const { chromium } = require('playwright');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUTDIR = process.argv[2] || path.join(ROOT, 'output', 'blueprints');

// B5 trim (182x257mm) at 300dpi -> 2150x3035px. Rendered at dpr2 from half-size CSS.
const W = 1075, H = 1518;

const LAYOUTS = [
  { id: 'L1', name: 'L1 · Classic 4', rows: [0.34, 0.33, 0.33], splits: [1, 2, 1], note: 'story beats · dialogue · establishing' },
  { id: 'L2', name: 'L2 · Action 5', rows: [0.30, 0.34, 0.36], splits: [2, 1, 2], note: 'fight / chase · dynamic' },
  { id: 'L3', name: 'L3 · Talk 6', rows: [0.33, 0.33, 0.34], splits: [2, 2, 2], note: 'dialogue-heavy · conversation' },
  { id: 'L4', name: 'L4 · Splash', rows: [1], splits: [1], note: 'single hero image · chapter opener' },
  { id: 'L5', name: 'L5 · Drama 3', rows: [0.45, 0.55], splits: [1, 2], note: 'emotional beats · reveal' },
];

const esc = (s) => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function pageHTML(L) {
  // content box in mm-equivalent px: margins 15mm of 182mm trim -> 8.24%
  const M = 0.0824;
  const rows = [];
  L.rows.forEach((rh, ri) => {
    const panels = [];
    const n = L.splits[ri];
    for (let i = 0; i < n; i++) {
      const idx = rows.reduce((a, r) => a + r.length, 0) + i + 1;
      const pw = (W * (1 - 2 * M) - (n - 1) * 10) / n;
      const ph = H * (1 - 2 * M) * rh - 10;
      const ar = (pw / ph).toFixed(2);
      panels.push(`<div class="panel">
        <div class="safe"></div>
        <div class="tag"><b>PANEL ${idx}</b><span>${pw.toFixed(0)}×${ph.toFixed(0)}px · ratio ${ar}</span></div>
      </div>`);
    }
    rows.push(`<div class="row" style="height:${rh * 100}%">${panels.join('')}</div>`);
  });

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{width:${W}px;height:${H}px;background:#fff;overflow:hidden;
      font-family:'Outfit','Helvetica Neue',Arial,sans-serif;color:#14142a}
    .page{width:${W}px;height:${H}px;padding:${(M * W).toFixed(0)}px;position:relative;
      background:#fff;display:flex;flex-direction:column;gap:10px}
    .row{display:flex;gap:10px;width:100%;min-height:0;flex-direction:row-reverse}
    .panel{position:relative;flex:1;border:2px solid #14142a;background:#fff}
    .safe{position:absolute;inset:9px;border:1px dashed #c9c3b6}
    .tag{position:absolute;left:0;right:0;bottom:6px;text-align:center;color:#a8863a}
    .tag b{display:block;font:700 15px/1.3 'Outfit',Arial;letter-spacing:.08em}
    .tag span{font:500 11px/1.3 'Outfit',Arial;color:#8d8a82}
    .hdr{position:absolute;top:8px;left:0;right:0;text-align:center;font:600 12px/1 'Outfit';color:#8d8a82;letter-spacing:.14em}
    .ftr{position:absolute;bottom:6px;left:0;right:0;text-align:center;font:500 10px/1.4 'Outfit';color:#b3ada1;letter-spacing:.1em}
    .rtl{position:absolute;top:10px;right:14px;font:600 11px/1 'Outfit';color:#a8863a;letter-spacing:.1em}
  </style></head><body>
  <div class="page">
    <div class="hdr">MANGA PAGE BLUEPRINT — ${esc(L.name)} — draw inside the boxes, to the dashed safe line</div>
    <div class="rtl">READ ⟵ RIGHT TO LEFT</div>
    <div style="flex:1;display:flex;flex-direction:column;gap:10px;padding-top:22px;padding-bottom:18px">${rows.join('')}</div>
    <div class="ftr">${esc(L.note)} · B5 182×257mm · 300dpi · AutoEffortless Manga Studio</div>
  </div></body></html>`;
}

fs.mkdirSync(OUTDIR, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });

const made = [];
for (const L of LAYOUTS) {
  const tmp = path.join(OUTDIR, `.${L.id}.html`);
  fs.writeFileSync(tmp, pageHTML(L));
  await page.goto('file://' + tmp, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const png = path.join(OUTDIR, `blueprint-${L.id}.png`);
  await page.screenshot({ path: png, type: 'png' });
  fs.unlinkSync(tmp);
  made.push(png);
  console.log('✅', path.basename(png));
}
await browser.close();

// contact sheet + printable PDF
const { execFileSync } = await import('node:child_process');
execFileSync('magick', [...made, '-resize', '520x', '+append', path.join(OUTDIR, 'blueprints-all.jpg')]);
execFileSync('magick', [...made, '-compress', 'jpeg', '-quality', '92', path.join(OUTDIR, 'manga-page-blueprints.pdf')]);
console.log('✅ contact sheet + PDF →', OUTDIR);
