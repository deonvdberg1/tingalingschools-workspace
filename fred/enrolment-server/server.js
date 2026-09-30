// ─────────────────────────────────────────────────────────────────────────────
// Ting-A-Ling Pre-Primary — 2027 Online Enrolment Form server
//
//  GET  /                    → the enrolment form
//  GET  /thanks?ref=&n=      → confirmation page
//  GET  /api/enrol/health    → health probe
//  POST /api/enrol/submit    → validate → local backup → append to Google Sheet → emails
//
// Safety model: a submission is NEVER lost. Every submission is written to disk
// first, then pushed to the Google Sheet. If the Sheet push fails it is marked
// "pending" and retried every 5 minutes (and on /api/enrol/retry).
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderForm, renderThanks } from './render.js';
import { SHEET_COLUMNS, ALLOWED_KEYS, SHEET_TAB, SCHOOL_LABEL, REF_PREFIX, SECTIONS, FIELDS } from './fields.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GOG = '/opt/homebrew/bin/gog';
const PORT = Number(process.env.ENROL_PORT || 3015);
const DATA_DIR = path.join(__dirname, 'data');
const SUB_DIR = path.join(DATA_DIR, 'submissions');
const COUNTER_FILE = path.join(DATA_DIR, 'counter.json');
const QUEUE_FILE = path.join(DATA_DIR, 'pending.jsonl');
const LOG_FILE = path.join(DATA_DIR, 'submit.log');

// ── Config ──
let cfg = {};
try { cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')); } catch {}
cfg = {
  sheetId: '',
  sheetTab: SHEET_TAB,
  sheetOwner: 'info@tingalingschools.com',
  sendAccount: 'info@tingalingschools.com',
  schoolNotifyEmails: ['tingalingpreprimaryschool@gmail.com'],
  emailSchoolNotify: true,
  emailParentConfirm: true,
  ...cfg,
};
// env overrides
if (process.env.ENROL_SHEET_ID) cfg.sheetId = process.env.ENROL_SHEET_ID;
if (process.env.ENROL_DRY_RUN === '1') cfg.dryRun = true;
if (process.env.ENROL_NO_EMAIL === '1') { cfg.emailSchoolNotify = false; cfg.emailParentConfirm = false; }

fs.mkdirSync(SUB_DIR, { recursive: true });

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '512kb' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));

// no-cache for HTML
app.use((req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
});

// ── helpers ──
const nowSast = () =>
  new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg', hour12: false });

function log(line) {
  const s = `${new Date().toISOString()} ${line}\n`;
  try { fs.appendFileSync(LOG_FILE, s); } catch {}
  console.log(s.trimEnd());
}

function nextRef() {
  let n = 1;
  try { n = (JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8')).n || 0) + 1; } catch {}
  fs.writeFileSync(COUNTER_FILE, JSON.stringify({ n, updated: new Date().toISOString() }));
  return `${REF_PREFIX}-${String(n).padStart(4, '0')}`;
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── validation ──
function validate(body) {
  const errors = [];
  const missing = [];
  for (const col of SHEET_COLUMNS) {
    const f = findField(col.key);
    if (!f || !f.required) continue;
    const v = body[col.key];
    if (v === undefined || v === null || String(v).trim() === '') missing.push(f.label);
  }
  if (missing.length) errors.push('Missing required fields: ' + missing.join(', '));
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const [k, label] of [['mother_email', 'Mother email'], ['account_payer_email', 'Account payer email'], ['ec_email', 'Emergency contact email']]) {
    const v = body[k];
    if (v && !emailRe.test(String(v))) errors.push(`${label} is not a valid email address.`);
  }
  const dob = body.child_dob;
  if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(String(dob))) errors.push('Child date of birth must be a valid date.');
  return errors;
}
let fieldByKey = null;
function findField(key) {
  if (!fieldByKey) {
    fieldByKey = {};
    for (const f of FIELDS) fieldByKey[f.key] = f;
  }
  return fieldByKey[key];
}

// ── Google Sheet append ──
function rowValues(body, meta) {
  return SHEET_COLUMNS.map((c) => {
    if (c.key === '_ref') return meta.ref;
    if (c.key === '_submitted_at') return meta.submittedAt;
    if (c.key === '_school') return SCHOOL_LABEL;
    if (c.key === '_status') return 'New';
    return body[c.key] ?? '';
  });
}

function appendToSheet(values) {
  return new Promise((resolve, reject) => {
    const args = [
      'sheets', 'append', cfg.sheetId, `${cfg.sheetTab}!A:ZZ`,
      '--values-json', JSON.stringify([values]),
      '--input', 'RAW',
      '--insert', 'INSERT_ROWS',
      '--account', cfg.sheetOwner,
      '--no-input', '--json',
    ];
    execFile(GOG, args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 90000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error((stderr || err.message || '').toString().split('\n')[0].slice(0, 300)));
      resolve(stdout);
    });
  });
}

// ── email ──
function sendMail({ to, subject, body }) {
  return new Promise((resolve) => {
    if (!to || !to.length) return resolve(false);
    const args = ['gmail', 'send', '--to', [].concat(to).join(','), '--subject', subject, '--body-file', '-', '--account', cfg.sendAccount, '--no-input'];
    const p = execFile(GOG, args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 60000 }, (err, stdout, stderr) => {
      if (err) { log(`MAIL-FAIL ${to}: ${(stderr || err.message).toString().split('\n')[0].slice(0, 200)}`); return resolve(false); }
      log(`MAIL-OK ${to}`);
      resolve(true);
    });
    p.stdin.end(body);
  });
}

function schoolMailBody(body, meta) {
  const L = (k) => findField(k)?.label || k;
  const v = (k) => (body[k] ? String(body[k]) : '—');
  return `New enrolment application received.

Reference: ${meta.ref}
Received:  ${meta.submittedAt}

CHILD
  ${L('child_full_names')}: ${v('child_full_names')} ${v('child_surname')}
  ${L('child_dob')}: ${v('child_dob')}   ${L('child_gender')}: ${v('child_gender')}
  ${L('child_grade_applied')}: ${v('child_grade_applied')}   ${L('child_home_language')}: ${v('child_home_language')}

MOTHER
  ${v('mother_names')} ${v('mother_surname')} · ${L('mother_cell')}: ${v('mother_cell')} · ${v('mother_email')}

FATHER / GUARDIAN
  ${v('father_full_names')} ${v('father_surname')} · ${L('father_cell')}: ${v('father_cell')}

EMERGENCY CONTACT
  ${v('ec_full_name')} (${v('ec_relationship')}) · ${v('ec_cell')}

MEDICAL
  Doctor: ${v('med_family_doctor')} · Allergies: ${v('med_allergies')}
  Illnesses: ${v('med_illnesses')} · Infections: ${v('med_prone_infections')} · Conditions: ${v('med_other_conditions')}
  Fever convulsions: ${v('med_fever_convulsions')}

FINANCIAL
  Collection time: ${v('fee_option')}
  T-shirt size: ${v('tshirt_size')} · Grade R book fee: ${v('book_fee_grade_r')}
  Account payer: ${v('account_payer_name')} · ${v('account_payer_cell')} · ${v('account_payer_email')}

The full application (all sections) is in the enrolment spreadsheet:
${cfg.sheetId ? 'https://docs.google.com/spreadsheets/d/' + cfg.sheetId + '/edit' : '(sheet id not configured)'}

— Sent automatically by the ${SCHOOL_LABEL} online enrolment form.`;
}

function parentMailBody(body, meta) {
  const child = `${body.child_full_names || ''} ${body.child_surname || ''}`.trim() || 'your child';
  return `Dear ${body.mother_names || body.father_full_names || 'Parent'},

Thank you — we have received your enrolment application for ${child}.

Your reference number is: ${meta.ref}

Please quote this reference whenever you contact the school.

NEXT STEPS
1. Hand in / email the required documents: copy of I.D. documents of both parents, copy of the child's unabridged birth certificate, copy of the clinic card, proof of residence and the latest school report (if possible).
2. Pay the once-off R1 500 registration fee (newcomers only, non-refundable; includes 2 school t-shirts). Banking: D AND S COMP (PTY) LTD t/a TINGALING PREPRIMARY SCHOOLS · FNB Richards Bay · Acc 63161960886 · Branch 220830 · Reference: STUDENT NUMBER, CHILD'S NAME and SURNAME.
3. Send proof of payment to tingalingpreprimaryschool@gmail.com or WhatsApp 072 456 1282.

Please note: no cash payments are accepted at the school. School fees are payable monthly (over 11 months), due on or before the 1st of each month, one month in advance.

School hours: educational programme 06:45–17:00 · aftercare 13:00–17:00 · gate opens 06:45 · classes begin and gate closes 08:00.

Kind regards
${SCHOOL_LABEL}
20 Karanteen Street, Meerensee, Richards Bay, 3900
072 456 1282 / 061 527 4429 · tingalingpreprimaryschool@gmail.com

— This message was sent to you because you submitted an enrolment application. Your information is processed in accordance with the Protection of Personal Information Act 4 of 2013.`;
}

// ── retry queue ──
async function retryPending() {
  let lines = [];
  try { lines = fs.readFileSync(QUEUE_FILE, 'utf8').split('\n').filter(Boolean); } catch { return { tried: 0, ok: 0 }; }
  if (!lines.length) return { tried: 0, ok: 0 };
  const still = [];
  let ok = 0;
  for (const line of lines) {
    let item;
    try { item = JSON.parse(line); } catch { continue; }
    try {
      await appendToSheet(item.values);
      ok++;
      log(`SHEET-RETRY-OK ${item.ref}`);
    } catch (e) {
      still.push(line);
      log(`SHEET-RETRY-FAIL ${item.ref}: ${e.message}`);
    }
  }
  try { fs.writeFileSync(QUEUE_FILE, still.join('\n') + (still.length ? '\n' : '')); } catch {}
  return { tried: lines.length, ok };
}

// ── routes ──
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.type('html').send(renderForm());
});

app.get('/thanks', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.type('html').send(renderThanks(String(req.query.ref || ''), String(req.query.n || '')));
});

app.get('/api/enrol/health', async (req, res) => {
  let pending = 0;
  try { pending = fs.readFileSync(QUEUE_FILE, 'utf8').split('\n').filter(Boolean).length; } catch {}
  let count = 0;
  try { count = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8')).n || 0; } catch {}
  res.json({
    ok: true,
    school: SCHOOL_LABEL,
    sheetConfigured: !!cfg.sheetId,
    sheetId: cfg.sheetId || null,
    columns: SHEET_COLUMNS.length,
    submissions: count,
    pendingSheetSync: pending,
    dryRun: !!cfg.dryRun,
    time: nowSast(),
  });
});

// simple in-memory throttle: max 6 submissions / IP / 10 min
const hits = new Map();
function throttled(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 6;
}

app.post('/api/enrol/submit', async (req, res) => {
  try {
    const body = req.body || {};

    // honeypot — silently ignore bots
    if (body._hp) { log('HONEYPOT ignored'); return res.json({ ok: true, ref: 'IGNORED' }); }

    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
    if (throttled(ip)) return res.status(429).json({ ok: false, error: 'Too many submissions from this device. Please try again later.' });

    // whitelist keys
    const clean = {};
    for (const k of Object.keys(body)) if (ALLOWED_KEYS.has(k)) clean[k] = String(body[k] ?? '').trim().slice(0, 4000);

    const errors = validate(clean);
    if (errors.length) return res.status(400).json({ ok: false, error: errors.join(' ') });

    const ref = nextRef();
    const submittedAt = nowSast();
    const meta = { ref, submittedAt, ip, ua: (req.headers['user-agent'] || '').toString().slice(0, 300) };

    // 1) ALWAYS store locally first
    const record = { ref, submittedAt, school: SCHOOL_LABEL, data: clean, meta, sheet: 'pending' };
    fs.writeFileSync(path.join(SUB_DIR, `${ref}.json`), JSON.stringify(record, null, 2));
    fs.appendFileSync(path.join(DATA_DIR, 'index.jsonl'), JSON.stringify({ ref, submittedAt, child: `${clean.child_full_names || ''} ${clean.child_surname || ''}`.trim() }) + '\n');
    log(`SUBMIT ${ref} ${clean.child_full_names || ''} ${clean.child_surname || ''}`.trim());

    const values = rowValues(clean, meta);

    // 2) push to Google Sheet
    let synced = false;
    if (cfg.dryRun) {
      synced = true; record.sheet = 'dry-run';
    } else if (cfg.sheetId) {
      try {
        await appendToSheet(values);
        synced = true; record.sheet = 'synced';
        log(`SHEET-OK ${ref}`);
      } catch (e) {
        record.sheet = 'pending';
        fs.appendFileSync(QUEUE_FILE, JSON.stringify({ ref, values }) + '\n');
        log(`SHEET-FAIL ${ref}: ${e.message} (queued)`);
      }
    } else {
      record.sheet = 'no-sheet-configured';
      log(`SHEET-SKIP ${ref}: no sheetId configured`);
    }
    fs.writeFileSync(path.join(SUB_DIR, `${ref}.json`), JSON.stringify(record, null, 2));

    // 3) emails (never block the response on failure)
    if (cfg.emailSchoolNotify && cfg.schoolNotifyEmails.length) {
      sendMail({ to: cfg.schoolNotifyEmails, subject: `New enrolment application — ${clean.child_full_names || ''} ${clean.child_surname || ''} (${ref})`.trim(), body: schoolMailBody(clean, meta) });
    }
    if (cfg.emailParentConfirm) {
      const to = [clean.mother_email, clean.father_email, clean.sig1_email, clean.account_payer_email].filter(Boolean);
      const uniq = [...new Set(to.map((e) => e.toLowerCase()))];
      if (uniq.length) sendMail({ to: uniq.slice(0, 3), subject: `Enrolment received — ${SCHOOL_LABEL} (${ref})`, body: parentMailBody(clean, meta) });
    }

    res.json({ ok: true, ref, sheet: record.sheet });
  } catch (e) {
    log(`ERROR ${e.stack || e.message}`);
    res.status(500).json({ ok: false, error: 'Something went wrong. Please try again or WhatsApp 072 456 1282.' });
  }
});

// manual retry (internal)
app.post('/api/enrol/retry', async (req, res) => {
  const r = await retryPending();
  res.json({ ok: true, ...r });
});

app.get('/api/enrol/submissions', (req, res) => {
  // summary only — no children's data exposed publicly
  let files = [];
  try { files = fs.readdirSync(SUB_DIR).filter((f) => f.endsWith('.json')); } catch {}
  res.json({ count: files.length, latest: files.sort().slice(-5) });
});

app.listen(PORT, () => {
  log(`🚀 ${SCHOOL_LABEL} enrolment server on http://127.0.0.1:${PORT} (sheet=${cfg.sheetId || 'NOT SET'}, dryRun=${!!cfg.dryRun})`);
  setTimeout(() => retryPending().catch(() => {}), 20000);
  setInterval(() => retryPending().catch(() => {}), 5 * 60 * 1000);
});
