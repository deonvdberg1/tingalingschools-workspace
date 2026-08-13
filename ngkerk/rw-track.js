// ── NG Kerk Meerensee — self-hosted analytics beacon ──
// Sends pageviews on load + whatsapp-click events on booking links.
(function () {
  var INTERNAL_KEY = 'rw_internal';
  var internal = (function () {
    try { return localStorage.getItem(INTERNAL_KEY) === '1' ? 1 : 0; } catch (e) { return 0; }
  })();

  function send(payload) {
    try {
      // Skip automated browsers (render checks, scanners, bots) —
      // they must never count as customer traffic.
      if (navigator.webdriver === true) return;
      if (/HeadlessChrome|RWMonitor/i.test(navigator.userAgent)) return;
      var body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
      } else {
        fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true });
      }
    } catch (e) {}
  }

  function base() {
    return {
      path: location.pathname + location.search,
      title: document.title,
      referrer: document.referrer || '',
      ua: navigator.userAgent,
      screen: screen.width + 'x' + screen.height,
      internal: internal
    };
  }

  // Pageview
  send(base());

  // WhatsApp booking clicks — label = cruise from the wa.me text param
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href*="wa.me"]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var label = 'booking';
    try {
      var q = href.split('?')[1] || '';
      var params = new URLSearchParams(q);
      if (params.get('text')) label = decodeURIComponent(params.get('text'));
    } catch (e2) {}
    var payload = base();
    payload.event = 'whatsapp-click';
    payload.label = label;
    send(payload);
  }, true);
})();
