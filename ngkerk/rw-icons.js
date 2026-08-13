// ─────────────────────────────────────────────────────────────
// The River Whisperer — Lucide icon library (inline SVG)
// Standard icon set for all our sites (same family as Ting-A-Ling).
// Usage: rwIcon('bar-chart') → SVG markup string
// ─────────────────────────────────────────────────────────────
const RW_ICONS = {
  // ── Page / section icons ──
  'bar-chart': 'M3 3v18h18M18 17V9M13 17V5M8 17v-3',
  'calendar': 'M8 2v4M16 2v4M3 4h18a0 0 0 0 1 0 0v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a0 0 0 0 1 0 0zM3 10h18',
  'image': 'M3 3h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
  'smartphone': 'M12 18h.01M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z',
  'download': 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  'upload': 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  'x': 'M18 6 6 18M6 6l12 12',
  'check': 'M22 11.08V12a10 10 0 1 1-5.93-9.14M9 11l3 3L22 4',
  'trash': 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6',
  'arrow-left': 'M19 12H5M12 19l-7-7 7-7',
  'arrow-right': 'M5 12h14M12 5l7 7-7 7',
  'eye': 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  'message-circle': 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z',
  'cloud-sun': 'M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M15.947 12.65a4 4 0 0 0-5.925-4.128M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z',
  'zap': 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  'user': 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  'users': 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  'shield': 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
  'sunrise': 'M12 2v8M4.93 10.93l1.41 1.41M2 18h2M20 18h2M19.07 10.93l-1.41 1.41M22 22H2M8 6l4-4 4 4M16 18a4 4 0 0 0-8 0',
  'music': 'M9 18V5l12-2v13M6 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM18 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  'layout': 'M3 3h7v18H3zM14 3h7v10h-7zM14 17h7v4h-7z',
  'ship': 'M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76M12 3v6',
  'phone': 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
};

function rwIcon(name, opts) {
  const d = RW_ICONS[name] || RW_ICONS['layout'];
  const size = (opts && opts.size) || 18;
  const cls = (opts && opts.cls) || '';
  const stroke = (opts && opts.stroke) || 'currentColor';
  const paths = d.split('M').filter(Boolean).map(p => '<path d="M' + p + '"/>').join('');
  return '<svg class="rw-icon ' + cls + '" viewBox="0 0 24 24" fill="none" stroke="' + stroke +
    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:' + size + 'px;height:' + size + 'px;flex-shrink:0;vertical-align:middle;">' +
    paths + '</svg>';
}

// Replace emoji icons with Lucide SVGs across text nodes in the given root
function rwReplaceEmojis(root) {
  const map = {
    '📊': 'bar-chart', '📅': 'calendar', '🖼️': 'image', '📱': 'smartphone',
    '👤': 'user', '👥': 'users', '🛡️': 'shield', '👁️': 'eye',
    '💬': 'message-circle', '🌤️': 'cloud-sun', '⚡': 'zap',
    '🌅': 'sunrise', '🎵': 'music', '🚢': 'ship',
    '⬇': 'download', '⬆': 'upload', '✕': 'x', '✅': 'check',
    '←': 'arrow-left', '→': 'arrow-right',
  };
  const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const text = node.nodeValue || '';
    const emojiRe = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}\u{2192}\u{2715}\u{2714}]/u;
    if (!emojiRe.test(text)) return;
    let out = '';
    let rest = text;
    let changed = false;
    while (rest.length) {
      const m = emojiRe.exec(rest);
      if (!m) { out += rest; break; }
      out += rest.slice(0, m.index);
      const ch = m[0];
      const iconName = map[ch];
      if (iconName) { out += rwIcon(iconName, { size: 16 }); changed = true; }
      else { out += ch; }
      rest = rest.slice(m.index + ch.length);
    }
    if (changed) {
      const span = document.createElement('span');
      span.innerHTML = out;
      node.parentNode.replaceChild(span, node);
    }
  });
}
