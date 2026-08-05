// ─────────────────────────────────────────────────────────────────────────
// API helper — talks to the AutoEffortless dashboard API (our own backend)
// which powers the Ting-A-Ling portal. CORS is open; JWT in localStorage.
// ─────────────────────────────────────────────────────────────────────────

const API_BASE = 'https://app.autoeffortless.com/api';

export function getToken() {
  return localStorage.getItem('tingaling_token');
}
export function setToken(t) {
  if (t) localStorage.setItem('tingaling_token', t);
  else localStorage.removeItem('tingaling_token');
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      if (j.error) msg = j.error;
    } catch { /* keep default */ }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return res.json();
}
