// Renders the parent-facing form HTML from the field spec in fields.js.
import { SECTIONS, SCHOOL_LABEL, FORM_YEAR } from './fields.js';

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function fieldHtml(f) {
  const id = `f_${f.key}`;
  const req = f.required ? ' required' : '';
  const star = f.required ? ' <span class="req" title="Required">*</span>' : '';
  const help = f.help ? `<p class="help">${esc(f.help)}</p>` : '';
  const cls = f.full ? 'field full' : f.half ? 'field half' : 'field full';
  let control = '';

  switch (f.type) {
    case 'textarea':
      control = `<textarea id="${id}" name="${f.key}" rows="2"${req}></textarea>`;
      break;
    case 'select':
      control =
        `<select id="${id}" name="${f.key}"${req}><option value="">Please select…</option>` +
        f.options.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join('') +
        `</select>`;
      break;
    case 'radio':
      control =
        `<div class="options" data-key="${f.key}">` +
        f.options
          .map(
            (o, i) =>
              `<label class="opt"><input type="radio" name="${f.key}" value="${esc(o)}"${req ? ' required' : ''} data-i="${i}"><span>${esc(o)}</span></label>`
          )
          .join('') +
        `</div>`;
      break;
    case 'checkboxes':
      control =
        `<div class="options" data-key="${f.key}" data-multi="1">` +
        f.options
          .map(
            (o) =>
              `<label class="opt"><input type="checkbox" name="${f.key}" value="${esc(o)}"><span>${esc(o)}</span></label>`
          )
          .join('') +
        `</div>`;
      break;
    case 'checkbox':
      control = `<label class="opt solo"><input type="checkbox" name="${f.key}" value="Yes"${req ? ' required' : ''}><span>${esc(f.label)}</span></label>`;
      break;
    case 'signature':
      control =
        `<input type="text" id="${id}" name="${f.key}" autocomplete="off"${req} placeholder="Type your full name as your electronic signature">` +
        `<p class="help">By typing your name you are signing this form electronically in terms of the Electronic Communications and Transactions Act 25 of 2002.</p>`;
      break;
    default:
      control = `<input type="${f.type}" id="${id}" name="${f.key}"${req}>`;
  }

  if (f.type === 'checkbox') {
    return `<div class="${cls} wide"><div class="fieldwrap">${control}</div></div>`;
  }

  const showIf = f.showIf
    ? ` data-showif-key="${f.showIf.key}" data-showif-value="${esc(f.showIf.value)}" hidden`
    : '';

  return `<div class="${cls}${f.wide ? ' wide' : ''}"${showIf}>
    <label class="lbl" for="${id}">${esc(f.label)}${star}</label>
    ${control}
    ${help}
    <p class="err" data-err-for="${f.key}"></p>
  </div>`;
}

function sectionHtml(s) {
  const parts = [];
  if (s.body) {
    parts.push(
      `<dl class="info">` +
        s.body.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join('') +
        `</dl>`
    );
  }
  if (s.note) parts.push(`<p class="note">${esc(s.note)}</p>`);
  if (s.preHtml) parts.push(s.preHtml);
  const fields = (s.fields || []).map(fieldHtml).join('\n');
  if (fields) parts.push(`<div class="grid">${fields}</div>`);
  if (s.infoBody) {
    parts.push(
      `<details class="info-fold"><summary>Banking details &amp; payment terms</summary><dl class="info">` +
        s.infoBody.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join('') +
        `</dl></details>`
    );
  }
  return `<section class="card" id="sec_${s.id}" data-title="${esc(s.title)}">
    <h2>${esc(s.title)}</h2>
    ${parts.join('\n')}
  </section>`;
}

export function renderForm(opts = {}) {
  const assetBase = opts.assetBase ?? '/';
  const cfg = { api: opts.apiBase || '', static: !!opts.static, thanks: opts.thanksHref || '/thanks' };
  const sections = SECTIONS.map(sectionHtml).join('\n');

  const nav = SECTIONS.filter((s) => !s.info)
    .map((s) => {
      const n = s.title.split('.')[0];
      return `<a class="navpill" href="#sec_${s.id}">${esc(n)}. ${esc(s.title.replace(/^\d+\.\s*/, ''))}</a>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en-ZA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0f766e">
<meta name="robots" content="noindex, nofollow">
<title>${esc(SCHOOL_LABEL)} — ${esc(FORM_YEAR)} Online Enrolment Form</title>
<link rel="icon" href="/logo.png">
<link rel="stylesheet" href="${assetBase}form.css">
</head>
<body>
<header class="top">
  <div class="wrap narrow">
    <img src="/logo.png" alt="${esc(SCHOOL_LABEL)}" class="logo">
    <div>
      <h1>${esc(FORM_YEAR)} Enrolment Form</h1>
      <p class="sub">${esc(SCHOOL_LABEL)} · 20 Karanteen Street, Meerensee, Richards Bay</p>
    </div>
  </div>
</header>

<main class="wrap narrow">
  <div class="intro card">
    <p>This form must be completed by the parent or legal guardian. All applicable sections must be completed for the application to be considered.</p>
    <p class="note"><strong>Please have these documents ready</strong> — your enrolment is only complete once the school has received them: copy of I.D. documents of both parents · copy of the child's unabridged birth certificate · copy of the clinic card · proof of residence · latest school report (if possible).</p>
    <p>Please notify the school in writing of any changes to your contact details, medical information, authorised collection arrangements or financial circumstances.</p>
    <div class="progress" aria-hidden="true"><div class="bar" id="progressBar"></div></div>
    <p class="help" id="progressText">0% complete</p>
  </div>

  <nav class="nav">${nav}</nav>

  <form id="enrolForm" novalidate>
    <div style="position:absolute;left:-9999px" aria-hidden="true">
      <label for="_hp">Do not fill this in</label>
      <input type="text" id="_hp" name="_hp" tabindex="-1" autocomplete="off">
    </div>
    ${sections}

    <div class="card submit-card">
      <div id="formError" class="formerror" hidden></div>
      <button type="submit" class="btn" id="submitBtn">Submit enrolment form</button>
      <p class="help">You will receive a confirmation on screen and a reference number. The school will contact you about the required documents and the R1 500 registration fee.</p>
    </div>
  </form>
</main>

<footer class="foot wrap narrow">
  <p>${esc(SCHOOL_LABEL)} · Contact 072 456 1282 / 061 527 4429 · tingalingpreprimaryschool@gmail.com</p>
  <p class="help">Your information is processed in accordance with the Protection of Personal Information Act 4 of 2013.</p>
</footer>

<script>window.ENROL_CONFIG = ${JSON.stringify(cfg)};</script>
<script src="${assetBase}form.js"></script>
</body>
</html>`;
}

export function renderThanks(ref, childName) {
  return `<!doctype html>
<html lang="en-ZA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Enrolment received — ${esc(SCHOOL_LABEL)}</title>
<link rel="icon" href="/logo.png">
<link rel="stylesheet" href="/form.css">
</head>
<body>
<header class="top"><div class="wrap narrow"><img src="/logo.png" alt="" class="logo"><div><h1>Enrolment received</h1><p class="sub">${esc(SCHOOL_LABEL)}</p></div></div></header>
<main class="wrap narrow">
  <div class="card done">
    <div class="tick">✓</div>
    <h2>Thank you${childName ? ', ' + esc(childName.split(' ')[0]) : ''}!</h2>
    <p>We have received your enrolment application for <strong>${esc(childName || 'your child')}</strong>.</p>
    <p class="refbox">Your reference number:<br><strong>${esc(ref)}</strong></p>
    <p>Please quote this reference whenever you contact the school. Keep it for your records.</p>
    <p class="note">Next steps: the school will be in touch about the required documents and the R1 500 once-off registration fee (newcomers only, non-refundable). Your application is complete once these have been received.</p>
    <p>
      <a class="btn" href="https://wa.me/27615274429?text=${encodeURIComponent('Hi Ting-A-Ling, I submitted enrolment ' + ref + ' for my child.')}" target="_blank" rel="noopener">Follow up on WhatsApp</a>
    </p>
  </div>
</main>
<footer class="foot wrap narrow"><p>${esc(SCHOOL_LABEL)} · 072 456 1282 / 061 527 4429 · tingalingpreprimaryschool@gmail.com</p></footer>
</body>
</html>`;
}

// Static thanks page (hosted on the school's own site; reads ?ref=&n= client-side)
export function renderThanksStatic() {
  return `<!doctype html>
<html lang="en-ZA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Enrolment received — ${esc(SCHOOL_LABEL)}</title>
<link rel="icon" href="/logo.png">
<link rel="stylesheet" href="../form.css">
</head>
<body>
<header class="top"><div class="wrap narrow"><img src="/logo.png" alt="" class="logo"><div><h1>Enrolment received</h1><p class="sub">${esc(SCHOOL_LABEL)}</p></div></div></header>
<main class="wrap narrow">
  <div class="card done">
    <div class="tick">✓</div>
    <h2>Thank you<span id="dear"></span>!</h2>
    <p>We have received your enrolment application for <strong id="child">your child</strong>.</p>
    <p class="refbox">Your reference number:<br><strong id="ref">—</strong></p>
    <p>Please quote this reference whenever you contact the school. Keep it for your records.</p>
    <p class="note">Next steps: the school will be in touch about the required documents and the R1 500 once-off registration fee (newcomers only, non-refundable). Your application is complete once these have been received.</p>
    <p><a class="btn" id="wa" href="https://wa.me/27615274429" target="_blank" rel="noopener">Follow up on WhatsApp</a></p>
  </div>
</main>
<footer class="foot wrap narrow"><p>${esc(SCHOOL_LABEL)} · 072 456 1282 / 061 527 4429 · tingalingpreprimaryschool@gmail.com</p></footer>
<script>
(function () {
  var q = new URLSearchParams(location.search);
  var ref = q.get('ref') || '';
  var child = q.get('n') || '';
  if (ref) document.getElementById('ref').textContent = ref;
  if (child) {
    document.getElementById('child').textContent = child;
    document.getElementById('dear').textContent = ', ' + child.split(' ')[0];
  }
  document.getElementById('wa').href = 'https://wa.me/27615274429?text=' + encodeURIComponent('Hi Ting-A-Ling, I submitted enrolment ' + ref + ' for my child.');
})();
</script>
</body>
</html>`;
}
