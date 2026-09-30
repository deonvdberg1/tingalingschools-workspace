#!/usr/bin/env node
// Refreshes the "Read me" tab of the live enrolment sheet.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readmeBanner } from './readme-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));
const GOG = '/opt/homebrew/bin/gog';
const account = cfg.sheetOwner || 'info@tingalingschools.com';
const formUrl = process.env.ENROL_URL || 'https://tingalingschools.com/Enrol';

const rows = readmeBanner(formUrl).map((r) => [r]);
const last = `A1:A${rows.length}`;

execFileSync(GOG, ['sheets', 'clear', cfg.sheetId, `Read me!${last}`, '--account', account, '--no-input'], { stdio: 'inherit' });
execFileSync(
  GOG,
  ['sheets', 'update', cfg.sheetId, `Read me!${last}`, '--values-json', JSON.stringify(rows), '--input', 'RAW', '--account', account, '--no-input'],
  { stdio: 'inherit' }
);
console.log(`✓ Read me refreshed (${rows.length} rows) · link: ${formUrl}`);
