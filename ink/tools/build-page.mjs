#!/usr/bin/env node
/**
 * build-page.mjs — Manga page compositor
 *
 * Usage: node tools/build-page.mjs <page-spec.json> [out.png]
 *
 * Takes a page spec (panels, art, bubbles, SFX, screentones) and renders a
 * print-ready manga page PNG using headless Chromium.
 *
 * Spec schema (see scripts/ch1-p01.page.json):
 * {
 *   "title": "slug",
 *   "page": 1,
 *   "width": 1200, "height": 1750,
 *   "reading": "rtl",
 *   "rows": [ { "height": 0.42, "panels": [ {span:1, art:"file.jpg", focus:"50% 30%", zoom:1.0, bleed:false, bubbles:[...], elements:[...] } ] } ]
 * }
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
if (!specPath) { console.error('usage: build-page.mjs <spec.json> [out.png]'); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const outPath = process.argv[3] || path.join(ROOT, 'output', `${spec.title || 'page'}-${String(spec.page || 1).padStart(2, '0')}.png`);

const W = spec.width || 1200;
const H = spec.height || 1750;
const GUTTER = spec.gutter ?? 16;
const INK = '#0b0b0b';

// Local lettering fonts (OFL), inlined as data URIs so Chromium never blocks them.
const FONTDIR = path.join(ROOT, 'assets', 'fonts');
const face = (family, file, weight) => {
  const p = path.join(FONTDIR, file);
  if (!fs.existsSync(p)) return '';
  const b64 = fs.readFileSync(p).toString('base64');
  return `@font-face{font-family:'${family}';src:url(data:font/ttf;base64,${b64}) format('truetype');font-weight:${weight || 400};font-style:normal;}`;
};
const FONT_FACES = [
  face('Comic Neue', 'ComicNeue-Regular.ttf', 400),
  face('Comic Neue', 'ComicNeue-Bold.ttf', 700),
  face('Bangers', 'Bangers-Regular.ttf', 400),
  face('Outfit', 'Outfit.ttf', 400),
].join('\n');

const esc = (s = '') => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function absArt(p) {
  if (!p) return '';
  if (/^https?:/.test(p)) return p;
  const cand = [path.resolve(ROOT, p), path.resolve(path.dirname(specPath), p)];
  for (const c of cand) if (fs.existsSync(c)) return 'file://' + c;
  return '';
}

// bubble styles: speech (round), thought (cloud/scallop), shout (jagged), caption (square box), narration
function bubbleHTML(b, i) {
  const type = b.type || 'speech';
  const pos = `left:${b.x}%;top:${b.y}%;width:${b.w}%;`;
  const dir = b.dir ? `writing-mode:${b.dir};` : '';
  const cls = `bubble bubble-${type}`;
  const tail = b.tail ? `<div class="tail tail-${b.tail.dir || 'bl'}" style="left:${b.tail.x ?? 30}%"></div>` : '';
  if (type === 'sfx') {
    return `<div class="sfx" style="${pos}transform:translate(-50%,-50%) rotate(${b.rotate ?? -8}deg);font-size:${b.size || 96}px;color:${b.color || INK};-webkit-text-stroke:${b.stroke ?? 3}px ${b.strokeColor || '#fff'};">${esc(b.text)}</div>`;
  }
  if (type === 'caption') {
    return `<div class="${cls}" style="${pos}${dir}">${esc(b.text)}</div>`;
  }
  return `<div class="${cls}" style="${pos}${dir}">${esc(b.text)}</div>${tail}`;
}

function panelHTML(p) {
  const art = absArt(p.art);
  const bg = art ? `background-image:url('${art}');background-position:${p.focus || '50% 50%'};transform:scale(${p.zoom || 1});` : `background:#e9e9e9;`;
  const inner = p.art
    ? `<div class="art" style="${bg}"></div>`
    : `<div class="art art-missing"><span>ART PENDING<br><em>${esc(p.art || '')}</em></span></div>`;
  const bubbles = (p.bubbles || []).map(bubbleHTML).join('\n');
  const fx = (p.effects || []).map(e => `<div class="fx fx-${e.type}" style="left:${e.x ?? 0}%;top:${e.y ?? 0}%;width:${e.w ?? 100}%;height:${e.h ?? 100}%;transform:rotate(${e.rotate ?? 0}deg);"></div>`).join('');
  return `<div class="panel" style="flex:${p.span || 1};${p.notes ? '' : ''}">${inner}${fx}${bubbles}</div>`;
}

// Free overlays (chapter title pages, credits, end marks). Absolute on the page.
const overlayHTML = (spec.overlays || []).map(o => {
  const fam = o.family ? `'${o.family}',` : '';
  return `<div class="ov" style="left:${o.x ?? 0}%;top:${o.y ?? 0}%;width:${o.w ?? 100}%;` +
    `font-family:${fam}'Comic Neue',sans-serif;font-size:${o.size ?? 40}px;font-weight:${o.weight ?? 800};` +
    `text-align:${o.align || 'center'};line-height:${o.lineHeight ?? 1.1};letter-spacing:${o.letterSpacing || '0'};` +
    `color:${o.color || '#fff'};-webkit-text-stroke:${o.stroke ?? 0}px ${o.strokeColor || INK};` +
    `transform:rotate(${o.rotate ?? 0}deg);">${esc(o.text)}</div>`;
}).join('\n');

const rowsHTML = (spec.rows || []).map(r => {
  const h = r.height ? `height:${r.height * 100}%;` : 'flex:1;';
  const dir = spec.reading === 'rtl' ? 'row-reverse' : 'row';
  return `<div class="row" style="${h}flex-direction:${dir};">${(r.panels || []).map(panelHTML).join('')}</div>`;
}).join('\n');

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  ${FONT_FACES}
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{width:${W}px;height:${H}px;background:#fff;overflow:hidden;}
  body{font-family:'Comic Neue','Anime Ace','Outfit',sans-serif;}
  .page{width:${W}px;height:${H}px;padding:${GUTTER}px;display:flex;flex-direction:column;gap:${GUTTER}px;background:#fff;}
  .row{display:flex;gap:${GUTTER}px;width:100%;min-height:0;}
  .panel{position:relative;flex:1;overflow:hidden;border:${spec.border ?? 4}px solid ${INK};background:#fff;}
  .art{position:absolute;inset:0;background-size:cover;background-repeat:no-repeat;filter:${spec.mono === false ? 'none' : 'grayscale(1) contrast(' + (spec.contrast ?? 1.12) + ') brightness(' + (spec.brightness ?? 1.02) + ')'};}
  .art-missing{display:flex;align-items:center;justify-content:center;background:repeating-linear-gradient(45deg,#f2f2f2,#f2f2f2 14px,#e6e6e6 14px,#e6e6e6 28px);}
  .art-missing span{font:600 20px/1.4 monospace;color:#9a9a9a;text-align:center;letter-spacing:.06em;}
  .bubble{position:absolute;background:#fff;border:3px solid ${INK};padding:${spec.bubblePadding ?? 14}px ${spec.bubblePadding ?? 18}px;
    font:700 ${spec.fontSize ?? 21}px/1.28 'Comic Neue','Anime Ace','Outfit',sans-serif;color:${INK};
    text-align:center;display:flex;align-items:center;justify-content:center;letter-spacing:.01em;}
  .bubble-speech{border-radius:50%/38%;}
  .bubble-thought{border-radius:48%/44%;border-style:dashed;}
  .bubble-shout{border-radius:14px;background:#fff;box-shadow:0 0 0 3px #fff, 0 0 0 0 #fff;
    clip-path:polygon(6% 12%,22% 0%,40% 10%,58% 0%,76% 10%,94% 4%,100% 26%,94% 46%,100% 68%,90% 92%,70% 100%,48% 90%,26% 100%,8% 86%,0% 62%,8% 38%);}
  .bubble-caption{border-radius:4px;background:#fff;padding:10px 14px;font-weight:600;}
  .tail{position:absolute;width:26px;height:26px;background:#fff;border:3px solid ${INK};
    clip-path:polygon(0% 0%,100% 0%,30% 100%);}
  .tail-bl{bottom:-24px;transform:rotate(20deg);}
  .tail-br{bottom:-24px;transform:rotate(-20deg);}
  .sfx{position:absolute;font-family:'Bangers','Impact','Anton','Outfit',sans-serif;font-weight:400;letter-spacing:.02em;white-space:nowrap;}
  .fx{position:absolute;pointer-events:none;}
  .fx-speedlines{background:repeating-conic-gradient(from 0deg at 50% 50%,#0b0b0b 0deg 1.1deg,transparent 1.1deg 5deg);opacity:.55;
    -webkit-mask-image:radial-gradient(circle at 50% 50%,transparent 26%,#000 62%);mask-image:radial-gradient(circle at 50% 50%,transparent 26%,#000 62%);}
  .fx-tone{background-image:radial-gradient(#111 .9px,transparent .9px);background-size:5px 5px;opacity:.32;}
  .fx-flash{background:radial-gradient(circle at 65% 40%,rgba(255,255,255,.95),rgba(255,255,255,0) 62%);}
  .pg{position:absolute;right:10px;bottom:-2px;font:600 15px/1 'Outfit',sans-serif;color:#7a7a7a;}
  .ov{position:absolute;pointer-events:none;}
</style></head>
<body><div class="page">${rowsHTML}</div>${overlayHTML}
<div class="pg">${spec.page ? ('— ' + spec.page + ' —') : ''}</div>
</body></html>`;

const tmp = path.join(ROOT, 'output', `.build-${spec.title || 'page'}-${spec.page || 1}.html`);
fs.mkdirSync(path.dirname(tmp), { recursive: true });
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(tmp, html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: spec.dpr || 2 });
await page.goto('file://' + tmp, { waitUntil: 'load' });
await page.waitForTimeout(700);
await page.screenshot({ path: outPath, type: 'png' });
await browser.close();
fs.unlinkSync(tmp);
console.log('✅ page rendered →', outPath);
