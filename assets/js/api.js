/* Same-origin API client. Session cookies are HttpOnly and never exposed to JS. */
async function api(path, { method = 'GET', body, auth = true } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), path.startsWith('/api/ai/') ? 55000 : 12000);
  try {
    const res = await fetch(path, {
      method, credentials: 'same-origin', signal: controller.signal,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      const message = typeof payload.detail === 'string' ? payload.detail
        : Array.isArray(payload.detail) ? payload.detail.map(e => e.msg).join('; ') : `HTTP ${res.status}`;
      throw Object.assign(new Error(message), { status: res.status });
    }
    return res.status === 204 ? null : res.json();
  } finally {
    clearTimeout(timer);
  }
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function safeURL(value) {
  try {
    const url = new URL(String(value), location.origin);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '#';
  } catch { return '#'; }
}
