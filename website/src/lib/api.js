// ─────────────────────────────────────────────────────────────────────────
// API helper — talks to the AutoEffortless dashboard API (our own backend)
// which powers the Ting-A-Ling portal. CORS is open; JWT in localStorage.
// ─────────────────────────────────────────────────────────────────────────

const API_BASE = 'https://app.autoeffortless.com/api';

export { API_BASE };

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
    let payload = null;
    try {
      payload = await res.json();
      if (payload.error) msg = payload.error;
    } catch { /* keep default */ }
    const err = new Error(msg);
    err.status = res.status;
    if (payload) {
      err.code = payload.code;
      err.accountStatus = payload.account_status;
    }
    throw err;
  }
  return res.json();
}
