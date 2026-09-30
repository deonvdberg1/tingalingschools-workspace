import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
for (const vp of [{w:360,h:780,n:'small-phone'},{w:414,h:896,n:'iphone'},{w:768,h:1024,n:'ipad'},{w:1280,h:900,n:'desktop'}]) {
  const p = await b.newPage({ viewport: { width: vp.w, height: vp.h } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('https://enrol.autoeffortless.com', { waitUntil: 'networkidle' });
  const r = await p.evaluate(() => {
    const de = document.documentElement;
    return {
      overflowX: de.scrollWidth > de.clientWidth ? (de.scrollWidth - de.clientWidth) : 0,
      inputs: document.querySelectorAll('#enrolForm input, #enrolForm select, #enrolForm textarea').length,
      radios: document.querySelectorAll('#enrolForm input[type=radio]').length,
      checks: document.querySelectorAll('#enrolForm input[type=checkbox]').length,
      hiddenCond: document.querySelectorAll('[data-showif-key][hidden]').length,
      progress: document.getElementById('progressText').textContent,
      cards: document.querySelectorAll('section.card').length,
      font: getComputedStyle(document.body).fontFamily.split(',')[0],
    };
  });
  // tick an "Other" multicheck and confirm the conditional field appears
  await p.evaluate(() => { const el=[...document.querySelectorAll('input[name="med_illnesses"]')].find(x=>x.value==='Other'); el.checked=true; el.dispatchEvent(new Event('change',{bubbles:true})); });
  const condShown = await p.evaluate(() => !document.querySelector('[data-showif-key="med_illnesses"]').hidden);
  console.log(vp.n, JSON.stringify(r), 'condShown:', condShown, 'errors:', errs.length);
  await p.close();
}
await b.close();
