const DEFAULT_MAX_AGE = 1000 * 60 * 15; // 15 minutes

export function readCache(key, maxAgeMs = DEFAULT_MAX_AGE) {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const { ts, data } = parsed;
    if (!ts || Date.now() - ts > maxAgeMs) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeCache(key, data) {
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // ignore storage errors
  }
}
