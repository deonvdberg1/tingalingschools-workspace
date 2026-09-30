#!/usr/bin/env node
// Builds the STATIC version of the enrolment form that is deployed on the
// school's own site (https://tingalingschools.com/Enrol/).
// Output → build/Enrol/  (index.html, thanks/index.html, form.css, form.js)
//
// The static page posts cross-origin to our API host (ENROL_API).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderForm, renderThanksStatic } from '../render.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'build', 'Enrol');

const API_BASE = process.env.ENROL_API || 'https://enrol.autoeffortless.com';

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'thanks'), { recursive: true });

fs.writeFileSync(
  path.join(OUT, 'index.html'),
  renderForm({ assetBase: '', apiBase: API_BASE, static: true, thanksHref: 'thanks/' })
);
fs.writeFileSync(path.join(OUT, 'thanks', 'index.html'), renderThanksStatic());
for (const f of ['form.css', 'form.js']) {
  fs.copyFileSync(path.join(ROOT, 'public', f), path.join(OUT, f));
}

// sanity: the static page must not link to our own domain for pages/assets
const idx = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
const bad = [...idx.matchAll(/href="\/form\.css"|src="\/form\.js"/g)];
if (bad.length) { console.error('❌ static build still has absolute asset refs'); process.exit(1); }

console.log('✓ build/Enrol/index.html');
console.log('✓ build/Enrol/thanks/index.html');
console.log('✓ build/Enrol/form.css');
console.log('✓ build/Enrol/form.js');
console.log('  API base:', API_BASE);
