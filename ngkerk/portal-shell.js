// ─────────────────────────────────────────────────────────────
// NG Kerk Meerensee — Portal shell (AutoEffortless blueprint)
// Injects sidebar + mobile header + footer, handles auth check.
// Pages set window.RW_PAGE = 'dashboard' | 'analytics' | ...
// ─────────────────────────────────────────────────────────────
(function () {
  const PAGE = window.RW_PAGE || 'dashboard';
  const NAV = [
    { id: 'dashboard', href: '/admin', label: 'Dashboard', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
    { id: 'analytics', href: '/analytics', label: 'Analytics', icon: 'M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z' },
  ];
  const ICONS = {
    logout: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5z',
    back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  };
  const svg = (d, cls) => '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px;flex-shrink:0;"><path d="' + d + '"/></svg>';

  function shell(user) {
    const isAdmin = user.role === 'admin';
    const navHtml = NAV.map((n) => {
      return '<a href="' + n.href + '" class="' + (PAGE === n.id ? 'active' : '') + '">' + svg(n.icon) + ' ' + n.label + '</a>';
    }).join('');

    const sidebar =
      '<aside class="portal-sidebar">' +
        '<a href="/" class="brand">' +
          '<div class="brand-logo">⛪</div>' +
          '<div><div class="brand-name">NG Kerk Meerensee</div><div class="brand-sub">Portal</div></div>' +
        '</a>' +
        '<nav>' + navHtml + '</nav>' +
        '<div class="sidebar-foot">' +
          '<span class="role-badge">' + (user.role || 'admin') + '</span>' +
          '<button class="btn-logout" id="shellLogout">' + svg(ICONS.logout) + ' Sign out</button>' +
          '<a href="/" class="back-link">' + svg(ICONS.back) + ' Back to website</a>' +
        '</div>' +
      '</aside>';

    const mobileHeader =
      '<div class="portal-mobile-header">' +
        '<a href="/" class="mobile-brand">' +
          '<div class="brand-logo">⛪</div>' +
          '<span>NG Kerk Meerensee</span>' +
        '</a>' +
        '<div class="mobile-actions">' +
          '<span class="role-badge">' + (user.role || 'admin') + '</span>' +
          '<button class="btn btn-ghost" id="shellLogoutMobile" style="padding:6px 10px;color:#dc2626;">' + svg(ICONS.logout) + '</button>' +
        '</div>' +
      '</div>';

    const footer =
      '<footer class="portal-footer">NG Kerk Meerensee · Galjoengolf 11, Meerensee · ' +
      'WhatsApp 071 903 3791</footer>';

    const shellEl = document.createElement('div');
    shellEl.className = 'portal-shell';
    shellEl.innerHTML = sidebar + '<div class="portal-main">' + mobileHeader + '<main class="portal-content">' + document.body.innerHTML + '</main>' + footer + '</div>';
    document.body.innerHTML = '';
    document.body.appendChild(shellEl);

    const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    const doLogout = async () => { try { await fetch('/api/logout', { method: 'POST' }); } catch (e) {} window.location.href = '/'; };
    bind('shellLogout', doLogout);
    bind('shellLogoutMobile', doLogout);
  }

  async function init() {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      if (!data.authenticated || data.user.role !== 'admin') {
        window.location.href = '/login.html';
        return;
      }
      shell(data.user);
      if (window.RW_ON_LOAD) window.RW_ON_LOAD(data.user);
    } catch (e) {
      window.location.href = '/login.html';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
