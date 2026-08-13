const KEY = "qa-prep:device";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let cached: string | null = null;

function newUuid(): string {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
    if (typeof crypto.getRandomValues === "function") {
      const b = crypto.getRandomValues(new Uint8Array(16));
      b[6] = (b[6] & 0x0f) | 0x40;
      b[8] = (b[8] & 0x3f) | 0x80;
      const hex = [...b].map((n) => n.toString(16).padStart(2, "0")).join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  }
  /* Non-secure context with no crypto at all. Weaker, but the alternative is
     no id and no sync; the id guards study notes, not secrets. */
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * The anonymous identity the server keys rows on. Generated once per browser
 * and kept in localStorage, so clearing site data starts a fresh, empty
 * account — the same trade the rest of this app makes.
 */
export function getDeviceId(): string {
  if (cached) return cached;
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored && UUID.test(stored)) {
      cached = stored;
      return stored;
    }
    const fresh = newUuid();
    window.localStorage.setItem(KEY, fresh);
    cached = fresh;
    return fresh;
  } catch {
    /* Private mode: hold the id in memory so this session still syncs. It is
       lost on reload, which reads as a new device — acceptable and rare. */
    cached = newUuid();
    return cached;
  }
}

/** Test seam. */
export function resetDeviceIdCache(): void {
  cached = null;
}
