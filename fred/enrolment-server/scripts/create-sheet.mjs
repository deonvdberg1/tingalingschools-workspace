#!/usr/bin/env node
// Creates the "2027 Enrolment Applications" Google Sheet (owned by the school's
// Google account), writes the header row from fields.js, formats it, and saves
// the sheet id to config.json.
//
// Run: node scripts/create-sheet.mjs ["Folder ID"]

import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { SHEET_COLUMNS, SHEET_TAB, SCHOOL_LABEL, FORM_YEAR } from '../fields.js';
import { readmeBanner } from './readme-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const GOG = '/opt/homebrew/bin/gog';
const ACCOUNT = 'info@tingalingschools.com';
const SHARE_WITH = 'info@autoeffortless.com';
const FOLDER_ID = process.argv[2] || '1EnZ1vDLVfndPwhQTEiIceQUw3IqgzUWe'; // "Ting-A-Ling Enrolment 2027"

const SHEET_NAME = `${SCHOOL_LABEL} — ${FORM_YEAR} Enrolment Applications`;
const headers = SHEET_COLUMNS.map((c) => c.label);

function gog(args, opts = {}) {
  return execFileSync(GOG, [...args, '--account', ACCOUNT, '--no-input', ...(opts.json ? ['--json'] : [])], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

console.log(`[1/5] Building xlsx with ${headers.length} columns …`);
mkdirSync(path.join(ROOT, 'tmp'), { recursive: true });
const headersJson = JSON.stringify(headers);
const banner = readmeBanner(process.env.ENROL_URL || 'https://tingalingschools.com/Enrol');
const bannerJson = JSON.stringify(banner);
const xlsxPath = path.join(ROOT, 'tmp', 'enrolment-headers.xlsx');
const py = `
import json, sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
headers = json.loads(sys.argv[1])
banner = json.loads(sys.argv[3])
wb = Workbook(); ws = wb.active; ws.title = ${JSON.stringify(SHEET_TAB)}
ws.append(headers)
for c in range(1, len(headers)+1):
    cell = ws.cell(row=1, column=c)
    cell.font = Font(bold=True, color="FFFFFF", size=11)
    cell.fill = PatternFill("solid", fgColor="0F766E")
    cell.alignment = Alignment(wrap_text=True, vertical="center")
ws.row_dimensions[1].height = 34
for c in range(1, len(headers)+1):
    ws.column_dimensions[get_column_letter(c)].width = 26
ws.freeze_panes = "C2"
rm = wb.create_sheet("Read me")
for row in banner:
    rm.append([row])
rm.column_dimensions["A"].width = 118
for i, row in enumerate(banner, start=1):
    cell = rm.cell(row=i, column=1)
    cell.alignment = Alignment(wrap_text=True, vertical="top")
    cell.font = Font(bold=(i == 1), size=12 if i == 1 else 11)
wb.save(sys.argv[2])
print("ok", len(headers))
`;
execFileSync(pickPython(), ['-c', py, headersJson, xlsxPath, bannerJson], { encoding: 'utf8' });

function pickPython() {
  const cands = [process.env.ENROL_PYTHON, '/usr/local/bin/python3', '/opt/homebrew/bin/python3', 'python3'].filter(Boolean);
  for (const p of cands) {
    try {
      execFileSync(p, ['-c', 'import openpyxl'], { stdio: 'ignore' });
      return p;
    } catch {}
  }
  throw new Error('No python3 with openpyxl found (set ENROL_PYTHON)');
}

console.log('[2/5] Uploading → native Google Sheet …');
const up = JSON.parse(
  gog(['drive', 'upload', xlsxPath, '--convert-to=sheet', '--name', SHEET_NAME, '--parent', FOLDER_ID], { json: true })
);
const file = up.file || up;
const sheetId = file.id;
if (!sheetId) throw new Error('Upload failed: ' + JSON.stringify(up).slice(0, 500));
console.log('        sheet id:', sheetId);

const lastCol = colLetter(headers.length);

console.log('[3/5] Formatting header + freezing …');
try {
  gog([
    'sheets', 'freeze', sheetId, '--rows=1', '--cols=2', `--sheet=${SHEET_TAB}`,
  ]);
  gog([
    'sheets', 'resize-columns', sheetId, `${SHEET_TAB}!A:${lastCol}`,
    '--width=30',
  ]);
} catch (e) {
  console.warn('        (formatting step warned:', String(e.stderr || e.message).split('\n')[0] + ')');
}

console.log('[4/5] Sharing with ' + SHARE_WITH + ' (writer) …');
try {
  gog(['drive', 'share', sheetId, '--to=user', `--email=${SHARE_WITH}`, '--role=writer', '--force']);
} catch (e) {
  console.warn('        (share warned:', String(e.stderr || e.message).split('\n')[0] + ')');
}

console.log('[5/5] Saving config.json …');
const cfgPath = path.join(ROOT, 'config.json');
let cfg = {};
try { cfg = JSON.parse(readFileSync(cfgPath, 'utf8')); } catch {}
cfg = {
  ...cfg,
  sheetId,
  sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
  sheetTab: SHEET_TAB,
  driveFolderId: FOLDER_ID,
  sheetOwner: ACCOUNT,
  columns: headers.length,
};
writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');

console.log('\n✅ Done');
console.log('Sheet: ' + cfg.sheetUrl);

function colLetter(n) {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
