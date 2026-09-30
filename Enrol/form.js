/* Ting-A-Ling enrolment form — client behaviour (no dependencies) */
(function () {
  var CFG = window.ENROL_CONFIG || {};
  var API = CFG.api || '';            // '' = same origin (our own hosting)
  var THANKS = CFG.thanks || '/thanks';
  var form = document.getElementById('enrolForm');
  if (!form) return;

  // ── Conditional "Other (specify)" fields ──
  function syncConditionals() {
    document.querySelectorAll('[data-showif-key]').forEach(function (wrap) {
      var key = wrap.getAttribute('data-showif-key');
      var val = wrap.getAttribute('data-showif-value');
      var hit = false;
      document.querySelectorAll('input[name="' + key + '"]:checked').forEach(function (el) {
        if (el.value === val) hit = true;
      });
      wrap.hidden = !hit;
      if (!hit) {
        var inp = wrap.querySelector('input,textarea');
        if (inp) inp.value = '';
      }
    });
  }
  form.addEventListener('change', syncConditionals);
  syncConditionals();

  // ── Default dates ──
  var today = new Date().toISOString().slice(0, 10);
  ['sig1_date', 'sig2_date', 'witness_date'].forEach(function (k) {
    var el = form.elements[k];
    if (el && !el.value) el.value = today;
  });
  var dob = form.elements['child_dob'];
  if (dob) dob.max = today;

  // ── Copy-from-parent helpers ──
  function copy(btn, map) {
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      map.forEach(function (pair) {
        var src = form.elements[pair[0]];
        var dst = form.elements[pair[1]];
        if (src && dst && !dst.value && src.value) {
          dst.value = src.value;
          dst.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    });
  }
  copy(document.getElementById('copyMother'), [
    ['mother_names', 'sig1_name'], ['mother_surname', 'sig1_name'],
    ['mother_id', 'sig1_id'], ['mother_cell', 'sig1_cell'],
    ['mother_email', 'sig1_email'], ['mother_residential_address', 'sig1_address'],
  ]);
  copy(document.getElementById('copyFather'), [
    ['father_full_names', 'sig2_name'], ['father_surname', 'sig2_name'],
    ['father_id', 'sig2_id'], ['father_cell', 'sig2_cell'],
    ['father_email', 'sig2_email'], ['father_residential_address', 'sig2_address'],
  ]);

  // ── Required-field tracking ──
  function requiredEls() {
    return Array.prototype.filter.call(
      form.querySelectorAll('[required]'),
      function (el) { return el.type === 'radio' || el.type === 'checkbox' ? true : true; }
    );
  }
  function isFilled(el) {
    if (el.type === 'radio') {
      return !!form.querySelector('input[name="' + el.name + '"]:checked');
    }
    if (el.type === 'checkbox') return el.checked;
    return !!String(el.value || '').trim();
  }
  // de-duplicate radio groups
  function uniqueRequired() {
    var seen = {}, out = [];
    requiredEls().forEach(function (el) {
      var id = el.type === 'radio' ? 'r:' + el.name : 'k:' + (el.id || el.name);
      if (seen[id]) return;
      seen[id] = 1;
      out.push(el);
    });
    return out;
  }
  function setProgress() {
    var req = uniqueRequired();
    if (!req.length) return;
    var done = req.filter(isFilled).length;
    var pct = Math.round((done / req.length) * 100);
    var bar = document.getElementById('progressBar');
    var txt = document.getElementById('progressText');
    if (bar) bar.style.width = pct + '%';
    if (txt) txt.textContent = pct + '% complete';
  }
  form.addEventListener('input', setProgress);
  form.addEventListener('change', setProgress);
  setProgress();

  // ── Collect values ──
  function collect() {
    var data = {};
    var seen = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      var n = el.name;
      if (el.type === 'radio') {
        if (el.checked) data[n] = el.value;
        return;
      }
      if (el.type === 'checkbox') {
        if (el.checked) data[n] = data[n] ? data[n] + ', ' + el.value : el.value;
        return;
      }
      data[n] = String(el.value || '').trim();
      seen[n] = 1;
    });
    return data;
  }

  function clearErrors() {
    form.querySelectorAll('.bad').forEach(function (e) { e.classList.remove('bad'); });
    form.querySelectorAll('.err').forEach(function (e) { e.textContent = ''; });
    var fe = document.getElementById('formError');
    fe.hidden = true; fe.innerHTML = '';
  }

  function showErrors(errors) {
    var box = document.getElementById('formError');
    var items = errors.map(function (e) { return '<li>' + e + '</li>'; }).join('');
    box.innerHTML = 'Please check the following before submitting:<ul>' + items + '</ul>';
    box.hidden = false;
  }

  // ── Submit ──
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    clearErrors();

    var data = collect();
    var errors = [];
    var firstBad = null;

    // required check
    uniqueRequired().forEach(function (el) {
      if (isFilled(el)) return;
      errors.push((labelFor(el) || el.name) + ' is required.');
      if (el.type === 'radio' || el.type === 'checkbox') {
        var grp = document.querySelector('.options[data-key="' + el.name + '"]');
        if (grp) { grp.classList.add('bad'); if (!firstBad) firstBad = grp; }
        if (el.type === 'checkbox') { if (!firstBad) firstBad = el; }
      } else {
        el.classList.add('bad');
        if (!firstBad) firstBad = el;
      }
      var errEl = document.querySelector('[data-err-for="' + el.name + '"]');
      if (errEl) errEl.textContent = 'This field is required.';
    });

    // format checks
    [['mother_email', 'Email'], ['father_email', 'Email'], ['ec_email', 'Email'],
     ['sig1_email', 'Email'], ['sig2_email', 'Email'], ['account_payer_email', 'Email'],
     ['mother_cell', 'Cell number'], ['ec_cell', 'Emergency cell number'],
     ['account_payer_cell', 'Account payer cell number'], ['sig1_cell', 'Cell number']
    ].forEach(function (p) {
      var v = data[p[0]];
      if (!v) return;
      if (p[1] === 'Email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        errors.push('Please enter a valid email address for "' + (labelFor(form.elements[p[0]]) || p[0]) + '".');
        var e = form.elements[p[0]]; if (e) { e.classList.add('bad'); if (!firstBad) firstBad = e; }
      }
      if (p[1] === 'Cell number' && v.replace(/[^0-9]/g, '').length < 9) {
        errors.push('Please enter a valid cell number for "' + (labelFor(form.elements[p[0]]) || p[0]) + '".');
        var e2 = form.elements[p[0]]; if (e2) { e2.classList.add('bad'); if (!firstBad) firstBad = e2; }
      }
    });

    if (data.sig1_signature && data.sig1_name) {
      var a = data.sig1_signature.toLowerCase().replace(/\s+/g, ' ').trim();
      var b = (data.sig1_name + ' ' + '').toLowerCase();
      // loose check: signature must contain at least one word from the name
      var words = b.split(/[,\s]+/).filter(function (w) { return w.length > 1; });
      var ok = words.some(function (w) { return a.indexOf(w) !== -1; });
      if (!ok) errors.push('Parent/Guardian 1: the electronic signature should match your full name.');
    }

    if (errors.length) {
      showErrors(errors);
      var box = document.getElementById('formError');
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    var btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting…';

    fetch(API + '/api/enrol/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || !res.j.ok) throw new Error((res.j && res.j.error) || 'Submission failed');
        var child = data.child_full_names || data.child_known_as || '';
        location.href = THANKS + (THANKS.indexOf('?') === -1 ? '?' : '&') + 'ref=' + encodeURIComponent(res.j.ref) + '&n=' + encodeURIComponent(child);
      })
      .catch(function (err) {
        btn.disabled = false;
        btn.textContent = 'Submit enrolment form';
        showErrors([(err && err.message) || 'Could not submit right now. Please try again or WhatsApp 072 456 1282.']);
        document.getElementById('formError').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
  });

  function labelFor(el) {
    if (!el) return '';
    if (el.id) {
      var l = document.querySelector('label[for="' + el.id + '"]');
      if (l) return l.textContent.replace(/\s*\*$/, '').trim();
    }
    if (el.type === 'checkbox') {
      var lab = el.closest('label');
      if (lab) return lab.textContent.trim();
    }
    var wrap = el.closest('.field');
    var l2 = wrap && wrap.querySelector('.lbl');
    return l2 ? l2.textContent.replace(/\s*\*$/, '').trim() : el.name;
  }
})();
