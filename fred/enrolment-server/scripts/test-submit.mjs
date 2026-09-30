#!/usr/bin/env node
// E2E test: posts a fully-filled enrolment form to the local server.
// Usage: node scripts/test-submit.mjs [baseUrl]
const base = process.argv[2] || 'http://127.0.0.1:3015';
const { FIELDS } = await import('../fields.js');

const body = {};
for (const f of FIELDS) {
  if (f.type === 'checkbox') body[f.key] = 'Yes';
  else if (f.type === 'radio') body[f.key] = f.options[0];
  else if (f.type === 'date') body[f.key] = f.key === 'child_dob' ? '2022-04-11' : '2026-09-30';
  else if (f.type === 'email') body[f.key] = 'test-parent@example.com';
  else if (f.type === 'tel') body[f.key] = '0821234567';
  else if (f.type === 'checkboxes') body[f.key] = f.options[0] + ', ' + (f.options[1] || '');
  else body[f.key] = 'TEST-' + f.key;
}
// realistic values for a readable test row
Object.assign(body, {
  child_surname: 'Testcase', child_full_names: 'Thandi Testcase', child_known_as: 'Thandi',
  child_dob: '2022-04-11', child_gender: 'Female', child_home_language: 'isiZulu',
  child_current_school: 'Little Stars Playgroup', child_grade_applied: 'Grade RR',
  mother_surname: 'Testcase', mother_names: 'Nomsa', mother_cell: '0821234567', mother_email: 'test-parent@example.com',
  father_full_names: 'Sipho', father_surname: 'Testcase', father_cell: '0837654321',
  ec_full_name: 'Gogo Dlamini', ec_relationship: 'Grandmother', ec_cell: '0841112222',
  fee_option: 'Grade RRR', tshirt_size: '3–4 years',
  account_payer_name: 'Nomsa Testcase', account_payer_cell: '0821234567', account_payer_email: 'test-parent@example.com',
  sig1_name: 'Nomsa Testcase', sig1_signature: 'Nomsa Testcase', sig1_date: '2026-09-30',
  med_allergies: 'Peanuts', med_fever_convulsions: 'No', consent_activities: 'Yes', consent_indemnity: 'No',
  popia_consent: 'Yes', payment_terms_accepted: 'Yes',
});
// fix constrained selects/radios
body.fee_option = '13h00 — R1 900 per month';
body.child_gender = 'Female';
body.med_fever_convulsions = 'No';
body.consent_activities = 'Yes';
body.consent_indemnity = 'Yes';
body.popia_consent = 'Yes';
body.payment_terms_accepted = 'Yes';
body.guardian_supporting_docs = 'No';
body.book_fee_grade_r = 'Yes';

const res = await fetch(base + '/api/enrol/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
console.log('HTTP', res.status);
console.log(JSON.stringify(await res.json(), null, 2));
