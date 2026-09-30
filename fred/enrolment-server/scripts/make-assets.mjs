#!/usr/bin/env node
// Generates the parent-facing enrolment assets:
//   • QR code PNG (links to the online form)
//   • printable A5 poster (PDF + PNG preview)
// Output → ../../products/tingaling/enrolment/
import QRCode from 'qrcode';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../../products/tingaling/enrolment');
fs.mkdirSync(OUT, { recursive: true });

const URL = process.env.ENROL_URL || 'https://enrol.autoeffortless.com';
const SCHOOL = 'Ting-A-Ling Pre-Primary School';

const qrPng = path.join(OUT, 'Ting-A-Ling-2027-Enrolment-QR.png');
const qrSvg = path.join(OUT, 'Ting-A-Ling-2027-Enrolment-QR.svg');
await QRCode.toFile(qrPng, URL, { width: 1400, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#0f172a', light: '#ffffff' } });
await QRCode.toFile(qrSvg, URL, { width: 1400, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#0f172a', light: '#ffffff' } });
console.log('✓', qrPng);
console.log('✓', qrSvg);

const b64 = fs.readFileSync(qrPng).toString('base64');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: A5 portrait; margin: 0; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; color:#0f172a; }
  .page { width:148mm; height:210mm; padding:14mm 14mm 10mm; display:flex; flex-direction:column; }
  .band { background:linear-gradient(135deg,#0f766e,#0d9488); color:#fff; border-radius:14px; padding:14px 16px; }
  .band h1 { margin:0; font-size:23px; line-height:1.15; }
  .band h1 span { display:block; font-size:13px; font-weight:600; opacity:.9; letter-spacing:.14em; text-transform:uppercase; margin-bottom:6px; }
  h2 { font-size:26px; margin:16px 0 4px; color:#0f766e; }
  .sub { color:#475569; font-size:13px; margin:0 0 10px; }
  .qrwrap { text-align:center; margin:6px 0 2px; }
  .qrwrap img { width:74mm; height:74mm; border:1px solid #e2e8f0; border-radius:12px; padding:4mm; }
  ol { margin:8px 0 0 18px; padding:0; font-size:14px; line-height:1.55; }
  li { margin-bottom:5px; }
  .url { text-align:center; font-size:13px; color:#0f766e; font-weight:700; margin-top:6px; word-break:break-all; }
  .foot { margin-top:auto; border-top:1px solid #e2e8f0; padding-top:8px; font-size:11.5px; color:#475569; display:flex; justify-content:space-between; gap:8px; }
  .foot b { color:#0f172a; }
  .docs { margin-top:8px; background:#f0fdfa; border-left:4px solid #0d9488; border-radius:8px; padding:9px 11px; font-size:12px; color:#334155; }
  .docs b { color:#0f766e; }
</style></head><body>
<div class="page">
  <div class="band">
    <h1><span>${SCHOOL}</span>2027 Enrolment — apply online</h1>
  </div>
  <h2>Scan to enrol</h2>
  <p class="sub">Point your phone camera at the QR code — the enrolment form opens in your browser. It takes about 10 minutes.</p>
  <div class="qrwrap"><img src="data:image/png;base64,${b64}" alt="QR code"></div>
  <p class="url">${URL}</p>
  <ol>
    <li>Open the form and complete every section (child, parents, medical, fees).</li>
    <li>Type your full name to sign, then submit.</li>
    <li>Note your reference number — quote it in all correspondence.</li>
  </ol>
  <div class="docs"><b>Have these ready:</b> copy of I.D. documents of both parents · copy of the child's unabridged birth certificate · copy of the clinic card · proof of residence · latest school report (if possible).</div>
  <div class="foot">
    <div><b>20 Karanteen Street, Meerensee, Richards Bay, 3900</b><br>072 456 1282 / 061 527 4429<br>tingalingpreprimaryschool@gmail.com</div>
    <div style="text-align:right">No app to install.<br>Works on any phone.</div>
  </div>
</div>
</body></html>`;

const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 560, height: 794 }, deviceScaleFactor: 200 / 96 });
await p.setContent(html, { waitUntil: 'networkidle' });
await p.pdf({ path: path.join(OUT, 'Ting-A-Ling-2027-Enrolment-Poster.pdf'), format: 'A5', printBackground: true, preferCSSPageSize: true });
await p.screenshot({ path: path.join(OUT, 'Ting-A-Ling-2027-Enrolment-Poster.png'), fullPage: true });
await b.close();
console.log('✓', path.join(OUT, 'Ting-A-Ling-2027-Enrolment-Poster.pdf'));
console.log('✓', path.join(OUT, 'Ting-A-Ling-2027-Enrolment-Poster.png'));
console.log('\nURL:', URL);
