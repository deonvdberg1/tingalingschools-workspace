// Content of the "Read me" tab — kept in one place so both sheet creation and
// later updates stay in sync. School-facing: no third-party branding.
export function readmeBanner(formUrl) {
  return [
    'Ting-A-Ling Pre-Primary School — 2027 Online Enrolment Applications',
    '',
    'HOW THIS WORKS',
    '• This spreadsheet is filled IN AUTOMATICALLY from the online enrolment form. Every new row = one application.',
    `• Parents use this link (or the QR code the school sends them): ${formUrl}`,
    '• One row is added the moment a parent submits the form — no copy-typing needed.',
    '',
    'PLEASE NOTE',
    '• Do NOT rename the "Applications" tab or delete/move columns — the form writes to it automatically.',
    '• Reference No. — quote this whenever a parent contacts you about their application.',
    '• Status — for the office to update, e.g. New → Documents received → Approved / Declined.',
    "• Documents still required from every parent: copy of I.D. documents of both parents, copy of the child's unabridged birth certificate, copy of the clinic card, proof of residence, latest school report (if possible).",
    '• The R1 500 once-off registration fee (newcomers, non-refundable) must be paid for the application to be processed.',
    '',
    'ENQUIRIES',
    '• This file belongs to Ting-A-Ling Pre-Primary School (info@tingalingschools.com).',
    '• Enquiries about the form: info@tingalingschools.com · 072 456 1282',
  ];
}
