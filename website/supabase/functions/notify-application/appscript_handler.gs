/**
 * Ting-A-Ling Schools — Application Handler
 * Deployed as a Google Apps Script Web App.
 * Receives application POSTs from the website and:
 *   1. Appends a row to the "Tingaling Applications" spreadsheet
 *   2. Emails the full application to info@tingalingschools.com
 *   3. Sends a confirmation email to the parent
 */

var NOTIFY_EMAIL = 'info@tingalingschools.com';
var SHEET_NAME = 'Tingaling Applications';

function getOrCreateSheet_() {
  var files = DriveApp.getFilesByName(SHEET_NAME);
  while (files.hasNext()) {
    var f = files.next();
    if (f.getMimeType() === MimeType.GOOGLE_SHEETS) {
      return SpreadsheetApp.openById(f.getId());
    }
  }
  // Create it once — lands in the owner's Drive (info@tingalingschools.com)
  var ss = SpreadsheetApp.create(SHEET_NAME);
  var sheet = ss.getSheets()[0];
  sheet.setName('Applications');
  sheet.appendRow([
    'Date', 'School', 'Parent Name', 'Parent Email', 'Parent Phone',
    'Child Name', 'Child Age', 'Grade/Condition', 'Previous School'
  ]);
  sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#f1f5f9');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, 9);
  return ss;
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var school = body.school || 'PrePrimary';
    var schoolLabel = school === 'SpecialNeeds' ? 'Special Needs School' : 'Pre-Primary School';
    var parentName = body.parent_name || '';
    var parentEmail = body.parent_email || '';
    var parentPhone = body.parent_phone || '';
    var childName = body.child_name || '';
    var childAge = body.child_age || '';
    var grade = body.grade || '';
    var specialNeeds = body.special_needs || '';
    var previousSchool = body.previous_school || '';
    var condition = school === 'SpecialNeeds' ? specialNeeds : grade;

    // 1) Append row to spreadsheet
    var ss = getOrCreateSheet_();
    ss.getSheets()[0].appendRow([
      new Date(), schoolLabel, parentName, parentEmail, parentPhone,
      childName, childAge, condition, previousSchool
    ]);

    // 2) Notify email to the school
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'New Application: ' + schoolLabel + ' \u2013 ' + (childName || parentName || 'Unknown'),
      htmlBody: buildNotifyHtml_(schoolLabel, parentName, parentEmail, parentPhone,
        childName, childAge, condition, previousSchool)
    });

    // 3) Confirmation email to the parent
    if (parentEmail) {
      MailApp.sendEmail({
        to: parentEmail,
        subject: 'We received your application \u2013 Ting-A-Ling Schools',
        htmlBody: buildParentHtml_(schoolLabel, childName, parentName)
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function buildNotifyHtml_(schoolLabel, parentName, parentEmail, parentPhone,
  childName, childAge, condition, previousSchool) {
  var rows = [
    ['School', schoolLabel],
    ['Parent', parentName],
    ['Email', parentEmail],
    ['Phone', parentPhone],
    ['Child', childName],
    ['Age', childAge],
    ['Grade / Condition', condition || '\u2014'],
    ['Previous School', previousSchool || '\u2014']
  ];
  var trs = rows.map(function (r) {
    return '<tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f9f9f9;">' +
      r[0] + '</td><td style="padding:8px 12px;border:1px solid #ddd;">' + r[1] + '</td></tr>';
  }).join('\n');
  return '<html><body style="font-family:sans-serif;padding:20px;">' +
    '<h2 style="color:#0f766e;">New Application \u2014 ' + schoolLabel + '</h2>' +
    '<table style="border-collapse:collapse;width:100%;max-width:520px;">' + trs + '</table>' +
    '<p style="color:#888;font-size:12px;margin-top:20px;">Submitted: ' + new Date().toISOString() + '</p>' +
    '</body></html>';
}

function buildParentHtml_(schoolLabel, childName, parentName) {
  var first = (parentName || '').split(' ')[0] || '';
  return '<html><body style="font-family:sans-serif;padding:20px;">' +
    '<h2 style="color:#0f766e;">Thank you' + (first ? ', ' + first : '') + '!</h2>' +
    '<p>We have received your application for <strong>' + schoolLabel + '</strong>' +
    (childName ? ' for <strong>' + childName + '</strong>' : '') + '.</p>' +
    '<p>Our team will be in touch with you shortly to arrange the next steps, including a meet-and-greet and assessment.</p>' +
    '<p>If you have any questions in the meantime, email us at <a href="mailto:info@tingalingschools.com">info@tingalingschools.com</a>.</p>' +
    '<p>Warm regards,<br/><strong>Ting-A-Ling Schools</strong><br/>74 Krewilkring, Meerensee \u2022 18 Elweboog, Meerensee</p>' +
    '</body></html>';
}
