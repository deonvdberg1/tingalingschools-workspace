#!/usr/bin/env node
// E2E browser test of the enrolment form (run against a server where
// ENROL_NO_EMAIL=1 so no real emails are sent).
//   node scripts/e2e.mjs [baseUrl]
import { chromium } from 'playwright';

const base = process.argv[2] || 'https://enrol.autoeffortless.com';
const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 414, height: 900 }, deviceScaleFactor: 2 });
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('requestfailed', (r) => errors.push('reqfail: ' + r.url() + ' ' + (r.failure() || {}).errorText));

const log = (...a) => console.log('•', ...a);

log('loading', base);
await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
log('title:', await page.title());

// ── 1. empty submit → validation must block ──
await page.click('#submitBtn');
await page.waitForTimeout(700);
const errShown = await page.$eval('#formError', (el) => !el.hidden && el.textContent.trim().length > 0).catch(() => false);
log('empty-submit blocked:', errShown ? 'YES' : 'NO ❌');
log('still on form:', (await page.$('#enrolForm')) ? 'YES' : 'NO ❌');

// ── 2. fill the form ──
await page.evaluate(() => {
  const f = document.getElementById('enrolForm');
  const set = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
  const radios = {};
  Array.prototype.forEach.call(f.elements, (el) => {
    if (!el.name || el.name === '_hp') return;
    if (el.type === 'radio') { if (!radios[el.name]) { el.checked = true; radios[el.name] = 1; el.dispatchEvent(new Event('change', { bubbles: true })); } return; }
    if (!el.required) return;
    if (el.type === 'checkbox') { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); return; }
    if (el.type === 'date') return set(el, el.name === 'child_dob' ? '2022-04-11' : '2026-09-30');
    if (el.name.includes('email')) return set(el, 'e2e-test@example.com');
    if (el.type === 'tel' || el.name.includes('cell')) return set(el, '0821234567');
    set(el, el.tagName === 'SELECT' ? el.options[1].value : 'E2E Test');
  });
  const real = {
    child_surname: 'E2ECase', child_full_names: 'Lwazi E2ECase', child_known_as: 'Lwazi',
    child_home_language: 'English', child_dob: '2022-04-11', child_gender: 'Male', child_grade_applied: 'Grade RR',
    mother_surname: 'E2ECase', mother_names: 'Zanele', mother_cell: '0821234567', mother_email: 'e2e-test@example.com',
    father_surname: 'E2ECase', father_full_names: 'Bongani',
    ec_full_name: 'Gogo Ndlovu', ec_relationship: 'Grandmother', ec_cell: '0841112222', ec_email: 'e2e-test@example.com',
    account_payer_name: 'Zanele E2ECase', account_payer_cell: '0821234567', account_payer_email: 'e2e-test@example.com',
    sig1_name: 'Zanele E2ECase', sig1_signature: 'Zanele E2ECase', sig1_cell: '0821234567', sig1_email: 'e2e-test@example.com', sig1_date: '2026-09-30',
    med_allergies: 'Peanuts', med_immunisation: 'Up to date', med_medication_details: 'None',
  };
  Object.keys(real).forEach((k) => { if (f.elements[k]) set(f.elements[k], real[k]); });
});
log('form filled');
await page.screenshot({ path: '/tmp/enrol-form-top.png' });

// ── 3. submit → /thanks ──
await Promise.all([
  page.waitForURL('**/thanks**', { timeout: 40000 }).catch(() => null),
  page.click('#submitBtn'),
]);
await page.waitForTimeout(600);
const url = page.url();
const text = await page.evaluate(() => document.body.innerText.slice(0, 500));
const m = text.match(/TAL-PP-2027-\d+/);
log('redirected to:', url);
log('reference:', m ? m[0] : '(none) ❌');
await page.screenshot({ path: '/tmp/enrol-thanks.png', fullPage: true });

// ── 4. desktop screenshot of the form top ──
const d = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
await d.goto(base, { waitUntil: 'networkidle' });
await d.screenshot({ path: '/tmp/enrol-desktop.png' });
await d.close();

console.log('\nconsole/page errors:', errors.length);
errors.slice(0, 10).forEach((e) => console.log('  !', e));
await browser.close();
process.exit(m && errors.length === 0 ? 0 : 1);
