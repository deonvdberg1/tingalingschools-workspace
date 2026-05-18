// ── Ting-A-Ling Dashboard v2 — Professional Redesign ──
// Generates the complete dashboard HTML with embedded conversation data.
// Call: generateDashboard(convList, totalMsgs, humanReqs, serverStatus)
//
// Design principles (2025-2026 best practices):
//   - Clarity at a glance: 3-second understanding
//   - Card-based layout with clear visual hierarchy
//   - Dark mode (user preference)
//   - Mobile-first responsive
//   - Minimal cognitive load — show what matters now
//   - Consistent color system with school branding
//   - Reduced visual noise, intentional whitespace

function generateDashboard(convList, totalMsgs, humanReqs) {
  const pending = convList.filter(c => c.humanRequests > c.autoReplied).length;

  // Server-side helpers
  function escHtml(text) {
    if (!text) return '';
    return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function fmtTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const isThisYear = d.getFullYear() === now.getFullYear();
    if (isToday) return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
    if (isThisYear) return d.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
    return d.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: '2-digit' });
  }

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ting-A-Ling Schools — WhatsApp Dashboard</title>
<link rel="manifest" href="/manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Ting-A-Ling">
<meta name="theme-color" content="#0d9488">
<style>
/* ── Design System ── */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

[data-theme="light"] {
  --primary: #0d9488;
  --primary-light: #14b8a6;
  --primary-dark: #0f766e;
  --primary-bg: #f0fdfa;
  --accent: #d97706;
  --accent-light: #f59e0b;
  --accent-bg: #fffbeb;
  --bg: #f1f5f9;
  --surface: #ffffff;
  --surface-hover: #f8fafc;
  --surface-active: #f1f5f9;
  --border: #e2e8f0;
  --border-light: #f1f5f9;
  --text: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --green: #10b981;
  --green-bg: #ecfdf5;
  --red: #ef4444;
  --red-bg: #fef2f2;
  --amber: #f59e0b;
  --amber-bg: #fffbeb;
  --blue: #3b82f6;
  --blue-bg: #eff6ff;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04);
  --msg-in-bg: #ffffff;
  --msg-out-bg: #dbeafe;
  --msg-shadow: 0 1px 2px rgba(0,0,0,0.05);
  --sidebar-width: 380px;
  --nav-height: 60px;
}

[data-theme="dark"] {
  --primary: #14b8a6;
  --primary-light: #2dd4bf;
  --primary-dark: #0d9488;
  --primary-bg: #042f2e;
  --accent: #f59e0b;
  --accent-light: #fbbf24;
  --accent-bg: #451a03;
  --bg: #0f172a;
  --surface: #1e293b;
  --surface-hover: #334155;
  --surface-active: #1e293b;
  --border: #334155;
  --border-light: #1e293b;
  --text: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --green: #34d399;
  --green-bg: #064e3b;
  --red: #f87171;
  --red-bg: #7f1d1d;
  --amber: #fbbf24;
  --amber-bg: #78350f;
  --blue: #60a5fa;
  --blue-bg: #1e3a5f;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.2);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -2px rgba(0,0,0,0.2);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.4), 0 4px 6px -4px rgba(0,0,0,0.2);
  --msg-in-bg: #1e293b;
  --msg-out-bg: #1e3a5f;
  --msg-shadow: 0 1px 2px rgba(0,0,0,0.15);
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
  height: 100vh;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ── App Shell ── */
.app { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

/* ── Navigation Bar ── */
.nav {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 0 20px;
  display: flex;
  align-items: center;
  height: var(--nav-height);
  flex-shrink: 0;
  gap: 12px;
  z-index: 100;
}
.nav-brand { display: flex; align-items: center; gap: 12px; }
.nav-brand img { height: 32px; width: 32px; border-radius: 8px; object-fit: cover; }
.nav-brand-text { line-height: 1.2; }
.nav-brand-text .title { font-size: 15px; font-weight: 600; color: var(--text); }
.nav-brand-text .subtitle { font-size: 11px; color: var(--text-muted); }
.nav-spacer { flex: 1; }
.nav-actions { display: flex; align-items: center; gap: 8px; }

/* Theme toggle */
.theme-toggle {
  background: var(--surface-hover);
  border: 1px solid var(--border);
  width: 36px; height: 36px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--text-muted);
  transition: all 0.15s;
}
.theme-toggle:hover { background: var(--surface-active); color: var(--text); }

/* Status badge */
.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: ${pending > 0 ? 'var(--amber-bg)' : 'var(--green-bg)'};
  color: ${pending > 0 ? 'var(--accent)' : 'var(--green)'};
  border: 1px solid ${pending > 0 ? 'var(--accent-bg)' : 'var(--green-bg)'};
}
.status-badge .dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: ${pending > 0 ? 'var(--accent)' : 'var(--green)'};
  flex-shrink: 0;
}

/* Mobile menu toggle */
.mobile-toggle {
  display: none;
  background: none;
  border: none;
  width: 36px; height: 36px;
  border-radius: 10px;
  cursor: pointer;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--text-muted);
}

/* ── Layout ── */
.layout { display: flex; flex: 1; overflow: hidden; min-height: 0; }

/* ── Sidebar ── */
.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  z-index: 50;
}

/* Stats cards row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 16px 16px 12px;
}
.stat-card {
  background: var(--bg);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  border: 1px solid var(--border-light);
}
.stat-card .num {
  font-size: 22px;
  font-weight: 700;
  color: var(--primary);
  line-height: 1;
}
.stat-card .num.accent { color: var(--accent); }
.stat-card .num.muted { color: var(--text-secondary); }
.stat-card .label {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-top: 4px;
  font-weight: 500;
}
.stat-card .icon {
  font-size: 11px;
  margin-bottom: 4px;
}

/* Mini activity chart */
.activity-mini {
  padding: 0 16px 10px;
}
.activity-mini canvas {
  width: 100%;
  height: 36px;
  border-radius: 8px;
  background: var(--bg);
  display: block;
}

/* Search bar */
.search-bar {
  padding: 6px 16px 8px;
  position: relative;
}
.search-bar input {
  width: 100%;
  padding: 10px 14px 10px 36px;
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 13px;
  outline: none;
  background: var(--bg);
  color: var(--text);
  transition: border-color 0.15s;
}
.search-bar input:focus { border-color: var(--primary); }
.search-bar input::placeholder { color: var(--text-muted); }
.search-icon {
  position: absolute;
  left: 26px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 14px;
  pointer-events: none;
}

/* Conversation list */
.conv-list { flex: 1; overflow-y: auto; min-height: 0; }
.conv-list::-webkit-scrollbar { width: 4px; }
.conv-list::-webkit-scrollbar-track { background: transparent; }
.conv-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

.conv-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.1s;
  border-left: 3px solid transparent;
  align-items: center;
  border-bottom: 1px solid var(--border-light);
}
.conv-item:hover { background: var(--surface-hover); }
.conv-item.active {
  background: var(--primary-bg);
  border-left-color: var(--primary);
}
[data-theme="dark"] .conv-item.active { background: #0f3329; }

.conv-avatar {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}
.conv-info { flex: 1; min-width: 0; }
.conv-name { font-size: 14px; font-weight: 600; color: var(--text); }
.conv-name small { font-weight: 400; color: var(--text-muted); font-size: 12px; }
.conv-preview {
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.conv-preview .indicator {
  font-size: 10px;
  color: var(--text-muted);
}
.conv-meta { text-align: right; flex-shrink: 0; }
.conv-time { font-size: 11px; color: var(--text-muted); white-space: nowrap; }
.conv-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 6px;
  margin-top: 5px;
  display: inline-block;
  font-weight: 600;
  letter-spacing: 0.2px;
}
.conv-tag.bot { background: var(--blue-bg); color: var(--blue); }
.conv-tag.human { background: var(--amber-bg); color: var(--accent); }

.empty-sidebar {
  padding: 60px 30px;
  text-align: center;
  color: var(--text-muted);
}
.empty-sidebar .icon { font-size: 42px; margin-bottom: 14px; opacity: 0.5; }
.empty-sidebar p { font-size: 13px; line-height: 1.6; }
.empty-sidebar strong { color: var(--text-secondary); }

/* ── Main Panel ── */
.main { flex: 1; display: flex; flex-direction: column; background: var(--bg); min-height: 0; }

/* Empty state */
.empty-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}
.empty-main .icon { font-size: 52px; margin-bottom: 16px; opacity: 0.35; }
.empty-main h2 { font-size: 18px; color: var(--text); margin-bottom: 6px; }
.empty-main p { font-size: 13px; color: var(--text-muted); max-width: 400px; line-height: 1.6; }

/* Quick send card */
.quick-send {
  margin-top: 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px;
  width: 100%;
  max-width: 420px;
  text-align: left;
  box-shadow: var(--shadow-sm);
}
.quick-send h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 14px;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 8px;
}
.quick-send input,
.quick-send textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  background: var(--bg);
  color: var(--text);
  transition: border-color 0.15s;
  resize: none;
}
.quick-send input:focus,
.quick-send textarea:focus { border-color: var(--primary); }
.quick-send textarea { margin-bottom: 10px; }
.quick-send input { margin-bottom: 8px; }

.btn-primary {
  background: var(--primary);
  color: #fff;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: background 0.15s, transform 0.1s;
}
.btn-primary:hover { background: var(--primary-dark); }
.btn-primary:active { transform: scale(0.98); }

.send-status {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  margin-top: 8px;
}

/* ── Chat Panel ── */
.chat-panel { flex: 1; display: none; flex-direction: column; min-height: 0; }

.chat-header {
  padding: 12px 20px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.chat-header .back {
  display: none;
  cursor: pointer;
  font-size: 18px;
  color: var(--text-muted);
  text-decoration: none;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background 0.1s;
}
.chat-header .back:hover { background: var(--surface-hover); }
.chat-avatar-sm {
  width: 38px; height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  flex-shrink: 0;
}
.chat-header-info { line-height: 1.2; }
.chat-header-name { font-size: 15px; font-weight: 600; color: var(--text); }
.chat-header-phone { font-size: 12px; color: var(--text-muted); }

/* Messages area */
.chat-msgs {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 24px;
  position: relative;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
  background: var(--bg);
}
.chat-msgs::-webkit-scrollbar { width: 4px; }
.chat-msgs::-webkit-scrollbar-track { background: transparent; }
.chat-msgs::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

.msg {
  margin-bottom: 10px;
  padding: 10px 16px;
  border-radius: 14px;
  max-width: 72%;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  position: relative;
  box-shadow: var(--msg-shadow);
}
.msg.in {
  background: var(--msg-in-bg);
  margin-right: auto;
  border-bottom-left-radius: 4px;
}
.msg.out {
  background: var(--msg-out-bg);
  margin-left: auto;
  border-bottom-right-radius: 4px;
}
.msg .sender {
  font-size: 11px;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 2px;
}
.msg.out .sender { color: var(--blue); }
.msg .body { color: var(--text); }
.msg .meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 5px;
  font-size: 10px;
  color: var(--text-muted);
}
.msg .meta .status {
  font-size: 11px;
}

/* Date separators */
.date-sep {
  text-align: center;
  margin: 16px 0;
  position: relative;
}
.date-sep::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: var(--border);
}
.date-sep span {
  background: var(--bg);
  padding: 4px 14px;
  border-radius: 10px;
  font-size: 11px;
  color: var(--text-muted);
  position: relative;
  font-weight: 500;
  border: 1px solid var(--border-light);
}

/* Scroll to bottom button */
.scroll-btn {
  position: sticky;
  bottom: 16px;
  left: 100%;
  transform: translateX(-48px);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--surface);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  font-size: 16px;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: opacity 0.2s, transform 0.15s;
  margin-top: -52px;
  margin-bottom: 4px;
}
.scroll-btn:hover { background: var(--surface-hover); transform: translateX(-48px) scale(1.05); }
.scroll-btn.visible { display: flex; }

/* Input area */
.chat-input {
  padding: 12px 16px;
  background: var(--surface);
  border-top: 1px solid var(--border);
  display: flex;
  gap: 10px;
  align-items: flex-end;
}
.chat-input textarea {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  resize: none;
  max-height: 100px;
  line-height: 1.4;
  background: var(--bg);
  color: var(--text);
  transition: border-color 0.15s;
}
.chat-input textarea:focus { border-color: var(--primary); }
.chat-input textarea::placeholder { color: var(--text-muted); }
.chat-input .send-btn {
  background: var(--primary);
  color: #fff;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, transform 0.1s;
}
.chat-input .send-btn:hover { background: var(--primary-dark); }
.chat-input .send-btn:active { transform: scale(0.95); }
.chat-input .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Toast ── */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.toast {
  background: var(--surface);
  color: var(--text);
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border);
  transform: translateY(20px);
  opacity: 0;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 360px;
}
.toast.show { transform: translateY(0); opacity: 1; }
.toast.success { border-color: var(--green); background: var(--green-bg); color: var(--green); }
.toast.error { border-color: var(--red); background: var(--red-bg); color: var(--red); }

/* ── Responsive (Mobile) ── */
@media (max-width: 820px) {
  :root { --sidebar-width: 100%; }
  .mobile-toggle { display: flex; }
  .sidebar { position: absolute; left: 0; top: var(--nav-height); bottom: 0; z-index: 90; transform: translateX(-100%); transition: transform 0.25s ease; }
  .sidebar.open { transform: translateX(0); }
  .main { width: 100%; }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .chat-msgs { padding: 16px; }
  .msg { max-width: 85%; }
  .nav-actions .status-badge { display: none; }
  .quick-send { max-width: 100%; margin-left: 16px; margin-right: 16px; }
}

@media (max-width: 480px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); gap: 6px; }
  .stat-card { padding: 10px 8px; }
  .stat-card .num { font-size: 18px; }
  .nav { padding: 0 12px; }
  .nav-brand-text .subtitle { display: none; }
}
</style>
</head>
<body>
<div class="app">
  <!-- Navigation -->
  <nav class="nav">
    <button class="mobile-toggle" id="mobileToggle" onclick="toggleSidebar()" aria-label="Toggle sidebar">☰</button>
    <div class="nav-brand">
      <img src="/logo" alt="Ting-A-Ling">
      <div class="nav-brand-text">
        <div class="title">Ting-A-Ling Schools</div>
        <div class="subtitle">WhatsApp Communication</div>
      </div>
    </div>
    <div class="nav-spacer"></div>
    <div class="nav-actions">
      <span class="status-badge" id="statusBadge">
        <span class="dot"></span>
        ${pending > 0 ? pending + ' need reply' : 'All caught up'}
      </span>
      <button class="theme-toggle" onclick="toggleTheme()" id="themeToggle" title="Toggle theme">🌙</button>
    </div>
  </nav>

  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
      <div class="stats-row">
        <div class="stat-card"><div class="num">${convList.length}</div><div class="label">Chats</div></div>
        <div class="stat-card"><div class="num">${totalMsgs}</div><div class="label">Messages</div></div>
        <div class="stat-card"><div class="num accent">${pending}</div><div class="label">Pending</div></div>
        <div class="stat-card"><div class="num muted">${humanReqs}</div><div class="label">Hand-offs</div></div>
      </div>

      <div class="activity-mini">
        <canvas id="sparkline"></canvas>
      </div>

      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input type="text" placeholder="Search conversations..." oninput="filterConvs(this.value)" id="searchInput">
      </div>

      <div class="conv-list" id="convList">
        ${convList.length === 0 ? `
        <div class="empty-sidebar">
          <div class="icon">💬</div>
          <p><strong>No conversations yet</strong><br>When parents message the Ting-A-Ling number, their chats will appear here automatically.</p>
        </div>` : convList.map((conv, idx) => {
          const lastMsg = conv.messages[conv.messages.length - 1];
          const needsHuman = conv.humanRequests > conv.autoReplied;
          const lastTime = lastMsg ? fmtTime(lastMsg.timestamp) : '';
          return `
        <div class="conv-item" data-idx="${idx}" onclick="showChat(${idx})">
          <div class="conv-avatar">${(conv.name !== 'Unknown' ? conv.name : conv.phone)[0].toUpperCase()}</div>
          <div class="conv-info">
            <div class="conv-name">${conv.name !== 'Unknown' ? conv.name : 'Parent'}<small> · ${conv.phone.slice(-4)}</small></div>
            <div class="conv-preview">${lastMsg ? (lastMsg.direction === 'out' ? '<span style="font-size:10px;color:var(--text-muted)">→ </span>' : '') + escHtml((lastMsg.text || '').substring(0, 60)) + ((lastMsg.text || '').length > 60 ? '…' : '') : ''}</div>
          </div>
          <div class="conv-meta">
            <div class="conv-time">${lastTime}</div>
            <span class="conv-tag ${needsHuman ? 'human' : 'bot'}">${needsHuman ? 'You' : 'Auto'}</span>
          </div>
        </div>`;
        }).join('')}
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main" id="mainPanel">
      <!-- Empty State -->
      <div class="empty-main" id="emptyMain">
        <div class="icon">📱</div>
        <h2>WhatsApp Communication Hub</h2>
        <p>Select a conversation from the sidebar to view messages and reply. Use the quick-send form below to start a new conversation.</p>
        <div class="quick-send">
          <h3>✏️ Send a Message</h3>
          <input type="tel" id="phoneInput" placeholder="Phone number (e.g. 27615274429)">
          <textarea id="msgInput" rows="2" placeholder="Type your message..." style="margin-bottom:10px;"></textarea>
          <button class="btn-primary" onclick="sendMsg()">Send as Ting-A-Ling</button>
          <div class="send-status" id="sendStatus"></div>
        </div>
      </div>

      <!-- Chat Panel -->
      <div class="chat-panel" id="chatPanel">
        <div class="chat-header">
          <a href="#" class="back" id="backBtn" onclick="backToSidebar()">←</a>
          <div class="chat-avatar-sm" id="chatAvatar">?</div>
          <div class="chat-header-info">
            <div class="chat-header-name" id="chatName">Name</div>
            <div class="chat-header-phone" id="chatPhone">Phone</div>
          </div>
        </div>
        <div class="chat-msgs" id="chatMsgs">
          <button class="scroll-btn" id="scrollBtn" onclick="scrollToBottom()">↓</button>
        </div>
        <div class="chat-input">
          <textarea id="replyInput" rows="1" placeholder="Type a reply…"
            onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendReply()}"></textarea>
          <button class="send-btn" onclick="sendReply()" id="sendBtn" title="Send">➤</button>
        </div>
      </div>
    </main>
  </div>
</div>

<!-- Toast container -->
<div class="toast-container" id="toastContainer"></div>

<script>
// ── Embedded Data ──
const convs = ${JSON.stringify(convList.map(c => ({
  name: c.name,
  phone: c.phone,
  messages: (c.messages || []).slice(-100),
  autoReplied: c.autoReplied,
  humanRequests: c.humanRequests
})))};
let current = -1;

// ── Utilities ──
function escapeHtml(text) {
  if (!text) return '';
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isThisYear = d.getFullYear() === now.getFullYear();
  if (isToday) return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  if (isThisYear) return d.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: '2-digit' });
}

function formatDateFull(ts) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isYesterday = new Date(now - 86400000).toDateString() === d.toDateString();
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' });
}

// ── Sparkline ──
function drawSparkline() {
  const canvas = document.getElementById('sparkline');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = canvas.parentElement.clientWidth * 2;
  canvas.height = 72;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = '36px';
  const w = canvas.width, h = canvas.height;

  // Build activity data: messages per day for last 14 days
  const dayCounts = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    dayCounts[key] = 0;
  }
  convs.forEach(c => {
    c.messages.forEach(m => {
      const key = new Date(m.timestamp).toDateString();
      if (dayCounts[key] !== undefined) dayCounts[key]++;
    });
  });
  const vals = Object.values(dayCounts);
  const max = Math.max(...vals, 1);

  // Colors
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const lineColor = isDark ? '#2dd4bf' : '#0d9488';
  const fillColor = isDark ? 'rgba(45, 212, 191, 0.1)' : 'rgba(13, 148, 136, 0.08)';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(100, 116, 139, 0.08)';

  ctx.clearRect(0, 0, w, h);

  const pad = 2;
  const graphW = w - pad * 2;
  const graphH = h - pad * 2;

  // Grid lines
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const y = pad + (graphH / 3) * i;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(w - pad, y);
    ctx.stroke();
  }

  // Fill
  ctx.beginPath();
  vals.forEach((v, i) => {
    const x = pad + (graphW / (vals.length - 1)) * i;
    const y = pad + graphH - (v / max) * graphH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(w - pad, pad + graphH);
  ctx.lineTo(pad, pad + graphH);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();

  // Line
  ctx.beginPath();
  vals.forEach((v, i) => {
    const x = pad + (graphW / (vals.length - 1)) * i;
    const y = pad + graphH - (v / max) * graphH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  // Dot on last value
  const lastX = w - pad;
  const lastY = pad + graphH - (vals[vals.length - 1] / max) * graphH;
  ctx.beginPath();
  ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
  ctx.fillStyle = lineColor;
  ctx.fill();
}
setTimeout(drawSparkline, 50);
window.addEventListener('resize', drawSparkline);

// ── Theme Toggle ──
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  document.getElementById('themeToggle').textContent = next === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('tingaling-theme', next);
  setTimeout(drawSparkline, 100);
  // Update theme-color meta
  document.querySelector('meta[name="theme-color"]').content = next === 'dark' ? '#0f172a' : '#0d9488';
}

// Restore saved theme
(function() {
  const saved = localStorage.getItem('tingaling-theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('themeToggle').textContent = saved === 'dark' ? '☀️' : '🌙';
    document.querySelector('meta[name="theme-color"]').content = saved === 'dark' ? '#0f172a' : '#0d9488';
  }
})();

// ── Mobile Sidebar ──
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ── Conversation List ──
function showChat(idx) {
  current = idx;
  const conv = convs[idx];
  document.getElementById('emptyMain').style.display = 'none';
  document.getElementById('chatPanel').style.display = 'flex';
  document.getElementById('chatAvatar').textContent = (conv.name !== 'Unknown' ? conv.name : conv.phone)[0].toUpperCase();
  document.getElementById('chatName').textContent = conv.name !== 'Unknown' ? conv.name : 'Parent';
  document.getElementById('chatPhone').textContent = conv.phone;
  document.getElementById('backBtn').style.display = window.innerWidth <= 820 ? 'flex' : 'none';
  renderMsgs();

  // Highlight active
  document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('active'));
  document.querySelector('.conv-item[data-idx="' + idx + '"]')?.classList.add('active');

  // Close sidebar on mobile
  if (window.innerWidth <= 820) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

function backToSidebar() {
  document.getElementById('chatPanel').style.display = 'none';
  document.getElementById('emptyMain').style.display = 'flex';
}

// ── Render Messages ──
function renderMsgs() {
  const conv = convs[current];
  if (!conv) return;
  const el = document.getElementById('chatMsgs');
  const msgs = conv.messages;

  if (msgs.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);font-size:13px;">No messages yet in this conversation.</div>' +
      '<button class="scroll-btn visible" id="scrollBtn" onclick="scrollToBottom()">↓</button>';
    return;
  }

  let lastDate = '';
  let html = '';
  msgs.forEach(m => {
    const isOut = m.direction === 'out';
    const dateKey = new Date(m.timestamp).toDateString();

    if (dateKey !== lastDate) {
      html += '<div class="date-sep"><span>' + formatDateFull(m.timestamp) + '</span></div>';
      lastDate = dateKey;
    }

    const time = new Date(m.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
    const senderName = isOut ? 'Ting-A-Ling' : (conv.name !== 'Unknown' ? conv.name : 'Parent');
    const statusIcon = isOut ? '✓✓' : '';

    html += '<div class="msg ' + (isOut ? 'out' : 'in') + '">' +
      '<div class="sender">' + escapeHtml(senderName) + '</div>' +
      '<div class="body">' + escapeHtml(m.text || '') + '</div>' +
      '<div class="meta"><span>' + time + '</span>' + (statusIcon ? '<span class="status">' + statusIcon + '</span>' : '') + '</div>' +
      '</div>';
  });

  el.innerHTML = html + '<button class="scroll-btn" id="scrollBtn" onclick="scrollToBottom()">↓</button>';
  el.scrollTop = el.scrollHeight;

  // Scroll button visibility
  el.addEventListener('scroll', function() {
    const btn = document.getElementById('scrollBtn');
    if (!btn) return;
    const isNearBottom = this.scrollHeight - this.scrollTop - this.clientHeight < 80;
    btn.classList.toggle('visible', !isNearBottom);
  });
}

function scrollToBottom() {
  const el = document.getElementById('chatMsgs');
  el.scrollTop = el.scrollHeight;
  const btn = document.getElementById('scrollBtn');
  if (btn) btn.classList.remove('visible');
}

// ── Search ──
function filterConvs(q) {
  q = q.toLowerCase();
  document.querySelectorAll('.conv-item').forEach(el => {
    const text = el.textContent.toLowerCase();
    el.style.display = !q || text.includes(q) ? 'flex' : 'none';
  });
}

// ── Toast System ──
function toast(text, type) {
  const container = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = 'toast ' + (type || '') + ' show';
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  t.innerHTML = '<span>' + icon + '</span><span>' + escapeHtml(text) + '</span>';
  container.appendChild(t);
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 2800);
}

// ── Send Messages ──
function sendMsg() {
  const phone = document.getElementById('phoneInput')?.value.trim();
  const msg = document.getElementById('msgInput')?.value.trim();
  if (!phone || !msg) { toast('Fill in both fields', 'error'); return; }
  doSend(phone, msg, document.getElementById('sendStatus')).then(success => {
    if (success) {
      const idx = convs.findIndex(c => c.phone === phone);
      if (idx >= 0) showChat(idx);
    }
  });
}

function sendReply() {
  const input = document.getElementById('replyInput');
  const msg = input.value.trim();
  if (!msg || current < 0) return;
  const phone = convs[current].phone;
  input.value = '';
  document.getElementById('sendBtn').disabled = true;
  doSend(phone, msg).then(() => {
    document.getElementById('sendBtn').disabled = false;
  });
}

async function doSend(phone, msg, statusEl) {
  if (statusEl) statusEl.textContent = 'Sending…';
  try {
    const res = await fetch('/send', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({to: phone, text: msg})
    });
    const data = await res.json();
    if (data.success) {
      toast('Message sent', 'success');
      const now = new Date().toISOString();
      let conv = convs.find(c => c.phone === phone);
      if (!conv) {
        conv = { name: 'Parent', phone: phone, messages: [], autoReplied: 0, humanRequests: 0 };
        convs.push(conv);
      }
      conv.messages.push({ direction: 'out', text: msg, timestamp: now, id: data.id });
      if (current >= 0 && convs[current]?.phone === phone) renderMsgs();
      if (statusEl) statusEl.textContent = '';
      const input = document.getElementById('msgInput');
      if (input) input.value = '';
      const phoneInput = document.getElementById('phoneInput');
      if (phoneInput) phoneInput.value = '';
      return true;
    } else {
      toast('Failed: ' + (data.error || 'Unknown error'), 'error');
      if (statusEl) statusEl.textContent = '❌ Failed';
      return false;
    }
  } catch(e) {
    toast('Network error', 'error');
    if (statusEl) statusEl.textContent = '❌ Network error';
    return false;
  }
}

// ── Background Polling ──
let lastMsgCount = convs.reduce((s,c) => s + c.messages.length, 0);
let lastConvCount = convs.length;

async function pollUpdates() {
  try {
    const res = await fetch('/dashboard-data');
    const data = await res.json();
    if (data.count !== lastConvCount || data.total !== lastMsgCount) {
      location.reload();
    }
  } catch(e) {}
}
setInterval(pollUpdates, 12000);

// ── PWA Service Worker ──
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
</script>
</body>
</html>`;
}

module.exports = { generateDashboard };
