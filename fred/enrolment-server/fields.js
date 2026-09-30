// ─────────────────────────────────────────────────────────────────────────────
// Ting-A-Ling Pre-Primary — 2027 Enrolment Form
// SINGLE SOURCE OF TRUTH for: form rendering, validation, and Google Sheet columns.
//
// Source: "Enrolment Form 2026-27 Tingaling PrePrimary School.docx"
// Parent-facing sections only. "FOR OFFICE USE ONLY" section is intentionally
// excluded (school captures that internally).
//
// To add/rename a field: edit SECTIONS below. The sheet header, the online form
// and validation all follow automatically. Existing sheet columns do NOT move
// if you append (the row builder writes by key order of this file).
// ─────────────────────────────────────────────────────────────────────────────

export const SHEET_TAB = 'Applications';
export const SCHOOL_LABEL = 'Ting-A-Ling Pre-Primary School';
export const FORM_YEAR = '2027';
export const REF_PREFIX = 'TAL-PP-2027';

// Metadata columns prepended to every row (not part of the parent form).
export const META_COLUMNS = [
  { key: '_ref', label: 'Reference No.' },
  { key: '_submitted_at', label: 'Submitted At (SAST)' },
  { key: '_school', label: 'School' },
  { key: '_status', label: 'Status' },
];

export const SECTIONS = [
  {
    id: 'child',
    title: '1. Details of the child',
    fields: [
      { key: 'child_surname', label: 'Surname (child)', type: 'text', required: true, half: true },
      { key: 'child_full_names', label: 'Full names (child)', type: 'text', required: true, half: true },
      { key: 'child_known_as', label: 'Name child is known as', type: 'text', half: true },
      { key: 'child_dob', label: 'Date of birth', type: 'date', required: true, half: true },
      { key: 'child_gender', label: 'Gender', type: 'select', required: true, half: true, options: ['Female', 'Male', 'Other / prefer not to say'] },
      { key: 'child_home_language', label: 'Home language', type: 'text', required: true, half: true },
      { key: 'child_current_school', label: 'Current school (if applicable)', type: 'text', half: true },
      { key: 'child_grade_applied', label: 'Grade applied for', type: 'select', required: true, half: true, options: ['Grade RRR', 'Grade RR', 'Grade R'] },
    ],
  },
  {
    id: 'mother',
    title: "2. Details of the mother",
    fields: [
      { key: 'mother_surname', label: "Mother's surname", type: 'text', required: true, half: true },
      { key: 'mother_names', label: "Mother's full names", type: 'text', required: true, half: true },
      { key: 'mother_id', label: 'ID number of mother', type: 'text', half: true },
      { key: 'mother_marital_status', label: 'Marital status', type: 'select', half: true, options: ['Married', 'Single', 'Divorced', 'Widowed', 'Other'] },
      { key: 'mother_residential_address', label: 'Residential address', type: 'textarea', full: true },
      { key: 'mother_postal_address', label: 'Postal address', type: 'textarea', full: true },
      { key: 'mother_occupation', label: 'Occupation of mom', type: 'text', half: true },
      { key: 'mother_employer', label: 'Employer', type: 'text', half: true },
      { key: 'mother_work_address', label: 'Work address', type: 'textarea', full: true },
      { key: 'mother_work_tel', label: 'Work telephone no. of mom', type: 'tel', half: true },
      { key: 'mother_cell', label: 'Cell number of mom', type: 'tel', required: true, half: true },
      { key: 'mother_email', label: 'Email', type: 'email', half: true },
    ],
  },
  {
    id: 'father',
    title: '3. Details of the father / guardian',
    note: 'Please inform us immediately of any changes to your contact details.',
    fields: [
      { key: 'father_surname', label: "Father's surname", type: 'text', half: true },
      { key: 'father_full_names', label: "Father's full names", type: 'text', half: true },
      { key: 'father_id', label: 'ID number', type: 'text', half: true },
      { key: 'father_marital_status', label: 'Marital status / relationship', type: 'select', half: true, options: ['Married', 'Single', 'Divorced', 'Widowed', 'Other'] },
      { key: 'father_residential_address', label: 'Residential address', type: 'textarea', full: true },
      { key: 'father_postal_address', label: 'Postal address', type: 'textarea', full: true },
      { key: 'father_occupation', label: 'Occupation', type: 'text', half: true },
      { key: 'father_employer', label: 'Employer', type: 'text', half: true },
      { key: 'father_work_address', label: 'Work address', type: 'textarea', full: true },
      { key: 'father_work_tel', label: 'Work telephone', type: 'tel', half: true },
      { key: 'father_cell', label: 'Cell number', type: 'tel', half: true },
      { key: 'father_email', label: 'Email', type: 'email', half: true },
    ],
  },
  {
    id: 'guardian',
    title: '4. Legal guardian (only if applicable)',
    note: 'If only one parent or legal guardian has legal authority to enrol the child, please provide supporting documentation where applicable.',
    fields: [
      { key: 'guardian_surname', label: "Legal guardian's surname", type: 'text', half: true },
      { key: 'guardian_names', label: "Legal guardian's full names", type: 'text', half: true },
      { key: 'guardian_cell', label: 'Cell no.', type: 'tel', half: true },
      { key: 'guardian_relationship', label: 'Relationship', type: 'text', half: true },
      { key: 'guardian_supporting_docs', label: 'Supporting documentation attached', type: 'radio', options: ['Yes', 'No'], full: true },
    ],
  },
  {
    id: 'emergency',
    title: '5. Emergency contact',
    note: 'Please provide an emergency contact who is not one of the parents or guardians listed above.',
    fields: [
      { key: 'ec_full_name', label: 'Full name and surname', type: 'text', required: true, full: true },
      { key: 'ec_relationship', label: 'Relationship to child', type: 'text', required: true, half: true },
      { key: 'ec_cell', label: 'Cell phone number', type: 'tel', required: true, half: true },
      { key: 'ec_alt', label: 'Alternative number', type: 'tel', half: true },
      { key: 'ec_email', label: 'Email address', type: 'email', half: true },
    ],
  },
  {
    id: 'transport',
    title: '6. Details of transport',
    fields: [
      { key: 'transport_driver_name', label: "Driver's name and surname", type: 'text', full: true },
      { key: 'transport_driver_cell', label: 'Cell no. of driver', type: 'tel', half: true },
      { key: 'transport_driver_vehicle_reg', label: 'Driver vehicle registration number', type: 'text', half: true },
    ],
  },
  {
    id: 'medical',
    title: '7. Medical history',
    note: 'Please complete all medical information fully. If your child has a medical condition (e.g. asthma), provide details including prescribed medication, dosage and emergency instructions. A copy of the immunisation card must be enclosed with your enrolment documents.',
    fields: [
      { key: 'med_family_doctor', label: 'Family doctor name', type: 'text', half: true },
      { key: 'med_immunisation', label: 'Immunisation', type: 'text', required: true, half: true, help: 'e.g. up to date / outstanding immunisations' },
      { key: 'med_allergies', label: 'Allergies', type: 'textarea', full: true, help: 'Food, medication, insect stings, etc. Write "None" if none.' },
      { key: 'med_illnesses', label: 'Previous illnesses (tick all that apply)', type: 'checkboxes', full: true, options: ['Measles', 'German Measles', 'Chicken Pox', 'Scarlet Fever', 'Mumps', 'Hepatitis', 'Tuberculosis (TB)', 'Tonsillectomy', 'Circumcision', 'Other'] },
      { key: 'med_illnesses_other', label: 'Other illness or operations (please specify)', type: 'text', full: true, showIf: { key: 'med_illnesses', value: 'Other' } },
      { key: 'med_prone_infections', label: 'Prone to infections (tick all that apply)', type: 'checkboxes', full: true, options: ['Ear', 'Nose', 'Throat', 'Chest', 'Bladder', 'Other'] },
      { key: 'med_prone_infections_other', label: 'Other (please specify)', type: 'text', full: true, showIf: { key: 'med_prone_infections', value: 'Other' } },
      { key: 'med_other_conditions', label: 'Other medical history (tick all that apply)', type: 'checkboxes', full: true, options: ['Epilepsy', 'Asthma', 'Diabetes', 'Other'] },
      { key: 'med_other_conditions_other', label: 'Other (please specify)', type: 'text', full: true, showIf: { key: 'med_other_conditions', value: 'Other' } },
      { key: 'med_fever_convulsions', label: 'Does your child develop high temperature and have fever convulsions?', type: 'radio', required: true, options: ['No', 'Yes'], full: true },
      { key: 'med_medication_details', label: 'Prescribed medication, dosage and emergency instructions', type: 'textarea', full: true, help: 'Write "None" if no regular medication.' },
    ],
  },
  {
    id: 'policies',
    title: '8. School policies and procedures',
    info: true,
    body: [
      ['Extramural activities', 'Presented by our own teachers at no additional cost: movement activities, music and dance, puppet shows, fantasy and imaginative play, sports and educational activities. Parents will be informed separately if any activity carries an additional charge.'],
      ['Food policy', 'The school does not provide meals. Children must eat breakfast at home and bring their own lunch. Full-day learners must bring enough food for lunch and snack time. Please provide healthy food — sweets, cakes and similar items are not permitted unless approved by the school for a special event. Please inform the school of any food allergies or dietary requirements.'],
      ['Medicine', 'Please hand in all medicine at the office — do not put any medicine in your child\'s bag. Parents must complete and sign the school\'s medication register or authorisation form. No medicine will be given without a parent\'s signature in the medicine book. The school will contact the parent or emergency services if urgent medical assistance is required.'],
      ['Monthly planner', 'Monthly planners are posted on the official WhatsApp group during the first week of the month. All monthly activities are stipulated on the calendar. Please let us know if your cell number or email changes.'],
      ['Personal belongings', 'Please label all clothing, shoes, bags and personal belongings clearly with the child\'s name. The school takes reasonable care of learners\' belongings but cannot accept responsibility for ordinary loss or damage to unlabelled or personal items. Please provide an extra set of clothing and a plastic bag for emergencies. Toys, cell phones and iPads are not permitted at school.'],
    ],
  },
  {
    id: 'consent',
    title: '9. Activities consent and indemnity',
    fields: [
      { key: 'consent_activities', label: 'I/We give permission for my/our child to participate in school activities, including extramural activities, educational tours, excursions, sports, games and the use of appropriate school equipment.', type: 'radio', required: true, options: ['Yes', 'No'], full: true, wide: true },
      { key: 'consent_indemnity', label: 'I/We have read and understood the indemnity clause and agree to indemnify and hold harmless the school, its principal, employees and authorised assistants against claims arising from my/our child\'s participation in school activities, except where loss or injury results from proven negligence, gross negligence, wilful misconduct or unlawful conduct by the school or its representatives.', type: 'radio', required: true, options: ['Yes', 'No'], full: true, wide: true },
      { key: 'consent_initials', label: 'Parent/guardian initials', type: 'text', required: true, half: true },
    ],
  },
  {
    id: 'financial',
    title: '10. Financial contract',
    note: 'School fees for 2027 are payable over 11 months. Fees are due on or before the 1st of each month, one month in advance. The R1 500 once-off registration fee (newcomers only, non-refundable, includes 2 school t-shirts) must be paid with the application for it to be processed.',
    fields: [
      { key: 'fee_option', label: 'My child will be collected at', type: 'radio', required: true, full: true, options: ['13h00 — R1 900 per month', '15h00 — R2 000 per month', '17h00 — R2 200 per month'] },
      { key: 'tshirt_size', label: 'School t-shirt size (tick your child\'s size)', type: 'radio', required: true, full: true, options: ['3–4 years', '5–6 years', '7–8 years'] },
      { key: 'book_fee_grade_r', label: 'Grade R book fee (R350) applicable', type: 'radio', full: true, options: ['Yes', 'No'] },
      { key: 'payment_terms_accepted', label: 'I/We accept the payment terms and conditions set out above, including that fees are due on or before the 1st of each month, one month in advance.', type: 'radio', required: true, options: ['Yes', 'No'], full: true, wide: true },
      { key: 'account_payer_name', label: 'Primary account payer — full name and surname', type: 'text', required: true, half: true },
      { key: 'account_payer_id', label: 'Identity number', type: 'text', half: true },
      { key: 'account_payer_relationship', label: 'Relationship to child', type: 'text', half: true },
      { key: 'account_payer_cell', label: 'Cell phone number', type: 'tel', required: true, half: true },
      { key: 'account_payer_email', label: 'Email address', type: 'email', required: true, half: true },
      { key: 'account_payer_address', label: 'Residential address', type: 'textarea', full: true },
    ],
    infoBody: [
      ['Banking details', 'Account name: D AND S COMP (PTY) LTD trading as TINGALING PREPRIMARY SCHOOLS · Bank: FNB Richards Bay · Account number: 63161960886 · Branch code: 220830. Payment reference: STUDENT NUMBER, CHILD\'S NAME and SURNAME. Send proof of payment to tingalingpreprimaryschool@gmail.com or WhatsApp 072 456 1282.'],
      ['Payment terms', 'No cash payments are accepted at the school. Accepted payment methods: electronic funds transfer, debit order or stop order. Fees not paid on the 1st are overdue; late payments attract interest of 2% per month and reasonable administration fees. One full calendar month\'s written notice is required to withdraw a learner; fees remain payable during the notice period. Where two parents or guardians sign, each may be held responsible for the full amount due. Parents experiencing financial difficulty should contact the principal in writing before the account becomes overdue. This agreement is governed by the laws of the Republic of South Africa, including the Consumer Protection Act 68 of 2008 and POPIA.'],
    ],
  },
  {
    id: 'popia',
    title: '11. Protection of personal information (POPIA)',
    info: true,
    body: [
      ['How we use information', 'Information is collected and used for: enrolment and administration; learner safety and emergency contact; educational planning and support; parent and guardian communication; medical and health administration; fee administration and collection; and compliance with legal obligations.'],
      ['Who we share it with', 'Authorised school staff on a need-to-know basis; emergency services or medical professionals; service providers acting on behalf of the school; attorneys or debt collectors where legally necessary; and credit bureaux where legally permitted.'],
      ['Your rights', 'The school takes reasonable steps to protect personal information and retains it only for as long as reasonably necessary or legally required. Parents and guardians may request access to or correction of their personal information, subject to applicable law. Complaints may be directed to the school\'s Information Officer or the Information Regulator.'],
    ],
    fields: [
      { key: 'popia_initials', label: 'Parent/guardian initials', type: 'text', required: true, half: true },
      { key: 'popia_consent', label: 'I/We consent to the lawful processing of personal information as described above.', type: 'radio', required: true, options: ['Yes', 'No'], half: true, wide: true },
    ],
  },
  {
    id: 'operating',
    title: '12. School operating information',
    info: true,
    body: [
      ['Hours', 'Educational programme: 06:45–17:00 · Aftercare: 13:00–17:00 · Gate opens: 06:45 · Classes begin and gate closes: 08:00.'],
      ['Please note', 'Please ensure that your child arrives on time and is collected promptly. If the collection time changes, written notice must be given to the principal before the beginning of the relevant month — the applicable fee will be charged according to the selected collection time.'],
    ],
  },
  {
    id: 'acknowledge',
    title: '13. Acknowledgement',
    note: 'Please read and tick every box.',
    fields: [
      { key: 'ack_form_read', label: 'I/We have read and understood this enrolment form.', type: 'checkbox', required: true, full: true },
      { key: 'ack_policies_received', label: "I/We have received or reviewed the school's policies and fee schedule.", type: 'checkbox', required: true, full: true },
      { key: 'ack_payment_obligations', label: 'I/We understand the payment obligations and due dates.', type: 'checkbox', required: true, full: true },
      { key: 'ack_late_consequences', label: 'I/We understand the consequences of late or non-payment.', type: 'checkbox', required: true, full: true },
      { key: 'ack_joint_liability', label: 'I/We understand the joint and several liability provisions, where applicable.', type: 'checkbox', required: true, full: true },
      { key: 'ack_withdrawal_notice', label: 'I/We understand the withdrawal notice requirements.', type: 'checkbox', required: true, full: true },
      { key: 'ack_popia_consent', label: 'I/We consent to the lawful processing of personal information as described above.', type: 'checkbox', required: true, full: true },
      { key: 'ack_activities_consent', label: 'I/We consent to the child participating in school activities.', type: 'checkbox', required: true, full: true },
      { key: 'ack_indemnity_read', label: 'I/We have read and understood the indemnity clause.', type: 'checkbox', required: true, full: true },
      { key: 'ack_info_accurate', label: 'I/We have provided complete and accurate information.', type: 'checkbox', required: true, full: true },
      { key: 'ack_notify_changes', label: 'I/We will notify the school in writing of any relevant changes.', type: 'checkbox', required: true, full: true },
    ],
  },
  {
    id: 'signatures',
    title: '14. Signatures',
    note: 'Type your full name in the signature field to sign this form electronically (Electronic Communications and Transactions Act 25 of 2002).',
    preHtml:
      '<div class="copyrow">' +
      '<button type="button" class="copybtn" id="copyMother">Copy from mother\u2019s details</button>' +
      '<button type="button" class="copybtn" id="copyFather">Copy from father\u2019s details</button>' +
      '</div>',
    fields: [
      { key: 'sig1_name', label: 'Parent/Guardian 1 — full name and surname', type: 'text', required: true, half: true },
      { key: 'sig1_id', label: 'Identity number', type: 'text', half: true },
      { key: 'sig1_cell', label: 'Cell phone number', type: 'tel', half: true },
      { key: 'sig1_email', label: 'Email address', type: 'email', half: true },
      { key: 'sig1_relationship', label: 'Relationship to child', type: 'text', half: true },
      { key: 'sig1_date', label: 'Date', type: 'date', required: true, half: true },
      { key: 'sig1_signature', label: 'Parent/Guardian 1 — electronic signature (type your full name)', type: 'signature', required: true, full: true },
      { key: 'sig1_address', label: 'Residential address (if different from above)', type: 'textarea', full: true },

      { key: 'sig2_name', label: 'Parent/Guardian 2 — full name and surname', type: 'text', half: true },
      { key: 'sig2_id', label: 'Identity number', type: 'text', half: true },
      { key: 'sig2_cell', label: 'Cell phone number', type: 'tel', half: true },
      { key: 'sig2_email', label: 'Email address', type: 'email', half: true },
      { key: 'sig2_relationship', label: 'Relationship to child', type: 'text', half: true },
      { key: 'sig2_date', label: 'Date', type: 'date', half: true },
      { key: 'sig2_signature', label: 'Parent/Guardian 2 — electronic signature (type your full name)', type: 'signature', full: true },
      { key: 'sig2_address', label: 'Residential address (if different from above)', type: 'textarea', full: true },

      { key: 'witness_name', label: 'Witness — full name and surname', type: 'text', half: true },
      { key: 'witness_id', label: 'Identity number', type: 'text', half: true },
      { key: 'witness_date', label: 'Date', type: 'date', half: true },
      { key: 'witness_signature', label: 'Witness — signature', type: 'text', half: true },
    ],
  },
];

// ── Derived: every input field, in order ──
export const FIELDS = SECTIONS.flatMap((s) => s.fields || []);

// ── Sheet columns: metadata + every field label ──
export const SHEET_COLUMNS = [...META_COLUMNS, ...FIELDS.map((f) => ({ key: f.key, label: f.label }))];

// ── Keys the server will accept (whitelist) ──
export const ALLOWED_KEYS = new Set(FIELDS.map((f) => f.key));
