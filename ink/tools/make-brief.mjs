#!/usr/bin/env node
/**
 * make-brief.mjs — the sheet Mr D actually draws from.
 *
 * Reads a page spec (scripts/*.page.json) and renders a B5 printable brief:
 * one box per panel, in RTL reading order, labelled with the shot, the action,
 * the emotion, and the dialogue that has to fit. Mr D draws inside the boxes.
 *
 * The smart bit: box aspect ratios come from the SAME grid the compositor uses,
 * so whatever he draws fits the final page with zero guesswork.
 *
 * usage: node tools/make-brief.mjs scripts/ch1-p01.page.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire('/opt/homebrew/lib/node_modules/');
const { chromium } = require('playwright');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const specPath = process.argv[2];
if (!specPath) { console.error('usage: make-brief.mjs <page-spec.json>'); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

const W = 1075, H = 1518, M = 0.0824, GAP = 10;
const esc = (s = '') => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

let n = 0;
const rows = (spec.rows || []).map(r => {
  const panels = (r.panels || []).map(p => {
    n++;
    const dialogue = (p.bubbles || []).filter(b => b.type !== 'sfx').map(b => `“${b.text}”`);
    const sfx = (p.bubbles || []).filter(b => b.type === 'sfx').map(b => b.text.toUpperCase());
    return `<div class="panel">
      <div class="safe"></div>
      <div class="hdr"><b>PANEL ${n}</b>${p.shot ? ` · ${esc(p.shot)}` : ''}</div>
      <div class="body">
        ${p.action ? `<p class="act">${esc(p.action)}</p>` : ''}
        ${p.emotion ? `<p class="emo">Emotion: ${esc(p.emotion)}</p>` : ''}
        ${dialogue.length ? `<p class="dlg">Dialogue: ${dialogue.map(esc).join(' / ')}</p>` : ''}
        ${sfx.length ? `<p class="sfx">SFX: ${sfx.map(esc).join(' · ')}</p>` : ''}
      </div>
      <div class="ratio">ratio ${((r.panels.length === 1 ? (W * (1 - 2 * M)) : (W * (1 - 2 * M) - GAP) / 2) / (H * (1 - 2 * M) * r.height - GAP)).toFixed(2)}</div>
    </div>`;
  }).join('');
  return `<div class="row" style="height:${r.height * 100}%">${panels}</div>`;
}).join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:${W}px;height:${H}px;background:#fff;overflow:hidden;
    font-family:'Outfit','Helvetica Neue',Arial,sans-serif;color:#14142a}
  .page{width:${W}px;height:${H}px;padding:${Math.round(M * W)}px;display:flex;flex-direction:column;gap:${GAP}px;position:relative}
  .top{position:absolute;top:10px;left:0;right:0;text-align:center;font:600 12px/1 'Outfit';letter-spacing:.14em;color:#8d8a82}
  .rtl{position:absolute;top:10px;right:16px;font:600 11px/1 'Outfit';color:#a8863a;letter-spacing:.1em}
  .wrap{flex:1;display:flex;flex-direction:column;gap:${GAP}px;padding-top:24px;padding-bottom:22px}
  .row{display:flex;gap:${GAP}px;width:100%;min-height:0;flex-direction:row-reverse}
  .panel{position:relative;flex:1;border:2px solid #14142a;padding:26px 14px 22px;display:flex;flex-direction:column;overflow:hidden}
  .safe{position:absolute;inset:8px;border:1px dashed #e2ddd2}
  .hdr{position:relative;font:700 13px/1.3 'Outfit';color:#a8863a;letter-spacing:.06em;margin-bottom:6px}
  .body{position:relative;display:flex;flex-direction:column;gap:6px;flex:1}
  .act{font:600 14px/1.42 'Outfit';color:#14142a}
  .emo{font:500 12px/1.4 'Outfit';color:#6f6b63}
  .dlg{font:500 12px/1.45 'Outfit';color:#3d3a52;border-left:3px solid #c8a34e;padding-left:8px}
  .sfx{font:700 12px/1.4 'Outfit';color:#a8863a;letter-spacing:.08em}
  .ratio{position:absolute;right:12px;bottom:8px;font:500 10px/1 'Outfit';color:#bdb7aa}
  .ftr{position:absolute;bottom:6px;left:0;right:0;text-align:center;font:500 10px/1.4 'Outfit';color:#b3ada1;letter-spacing:.1em}
</style></head><body><div class="page">
  <div class="top">DRAWING BRIEF — ${esc(spec.title || '')} — PAGE ${spec.page || 1} — draw inside the boxes, to the dashed line</div>
  <div class="rtl">READ ⟵ RIGHT TO LEFT</div>
  <div class="wrap">${rows}</div>
  <div class="ftr">B5 182×257mm · 300dpi · panel ratios match the final page exactly · AutoEffortless Manga Studio</div>
</div></body></html>`;

const outDir = path.join(ROOT, 'output', 'briefs');
fs.mkdirSync(outDir, { recursive: true });
const tmp = path.join(outDir, `.brief.html`);
fs.writeFileSync(tmp, html);
const out = path.join(outDir, `${spec.title || 'page'}-${String(spec.page || 1).padStart(2, '0')}-brief.png`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
await page.goto('file://' + tmp, { waitUntil: 'load' });
await page.waitForTimeout(300);
await page.screenshot({ path: out, type: 'png' });
await browser.close();
fs.unlinkSync(tmp);
console.log('✅ brief →', out);
