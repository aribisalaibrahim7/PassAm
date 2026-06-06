/**
 * Centralized, size-guarded cookie utility for PassAm.
 *
 * Hard limits (aggressive — well inside Vercel's 16 KB single-header / 32 KB total constraints):
 *  - Per cookie value (encoded):   ≤ 2,000 bytes
 *  - All passam_* cookies combined: ≤ 8,000 bytes
 *
 * What lives in cookies (identity only — tiny by design):
 *   passam_demo_session  →  "true"  (~4 bytes)
 *   passam_demo_profile  →  {name, university, targetGpa, currentGpa, gpaScale}  (~150 bytes)
 *   passam_demo_survey   →  "1" (flag only — full profile stays in localStorage)  (~1 byte)
 *
 * Everything else (studyStreak, cardsMastered, arrays) lives in localStorage only.
 */

const MAX_SINGLE_COOKIE_BYTES = 2_000;
const MAX_TOTAL_PASSAM_BYTES  = 8_000;

const PASSAM_COOKIE_NAMES = [
  "passam_demo_session",
  "passam_demo_profile",
  "passam_demo_survey",
];

function byteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}

function totalPassamCookieBytes(): number {
  if (typeof document === "undefined") return 0;
  let total = 0;
  document.cookie.split(";").forEach((part) => {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) return;
    const name = part.slice(0, eqIdx).trim();
    const value = part.slice(eqIdx + 1).trim();
    if (PASSAM_COOKIE_NAMES.includes(name)) {
      total += byteLength(name) + 1 + byteLength(value);
    }
  });
  return total;
}

/**
 * Writes a cookie after enforcing per-value and total-budget limits.
 * Returns true if written, false if blocked.
 */
export function setPassamCookie(name: string, value: string, days = 7): boolean {
  if (typeof document === "undefined") return false;

  const encoded = encodeURIComponent(value);
  const singleSize = byteLength(encoded);

  if (singleSize > MAX_SINGLE_COOKIE_BYTES) {
    console.warn(
      `[PassAm Cookie Guard] BLOCKED "${name}": ${singleSize}B > ${MAX_SINGLE_COOKIE_BYTES}B limit. ` +
      `Store this data in localStorage only.`
    );
    return false;
  }

  // Current contribution of this cookie (to subtract before projecting)
  const existing = (() => {
    const part = document.cookie.split(";").find((c) => c.trim().startsWith(`${name}=`));
    if (!part) return 0;
    const val = part.slice(part.indexOf("=") + 1).trim();
    return byteLength(name) + 1 + byteLength(val);
  })();

  const projected = totalPassamCookieBytes() - existing + byteLength(name) + 1 + singleSize;
  if (projected > MAX_TOTAL_PASSAM_BYTES) {
    console.warn(
      `[PassAm Cookie Guard] BLOCKED "${name}": projected total ${projected}B > ${MAX_TOTAL_PASSAM_BYTES}B budget.`
    );
    return false;
  }

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encoded}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
  return true;
}

/** Expires a single passam cookie immediately. */
export function deletePassamCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax`;
}

/** Deletes ALL passam_* cookies at once. */
export function clearAllPassamCookies(): void {
  PASSAM_COOKIE_NAMES.forEach(deletePassamCookie);
}

/** Returns the current combined byte size of all passam_* cookies. */
export function getPassamCookieTotalBytes(): number {
  return totalPassamCookieBytes();
}

/**
 * Builds the minimal cookie-safe profile object.
 * Only identity fields — NO runtime metrics (streak, cardsMastered, etc.)
 * Runtime metrics go to localStorage only.
 */
export function buildCookieProfile(profile: {
  name?: string;
  university?: string;
  targetGpa?: string;
  currentGpa?: string;
  gpaScale?: string;
}) {
  return {
    n: profile.name        ?? "",   // abbreviated keys to save bytes
    u: profile.university  ?? "",
    tg: profile.targetGpa  ?? "0.00",
    cg: profile.currentGpa ?? "0.00",
    gs: profile.gpaScale   ?? "5.0",
  };
}

/**
 * Reads the minimal cookie profile and expands it back to full field names.
 * Falls back to defaults if cookie is missing or malformed.
 */
export function readCookieProfile(): {
  name: string;
  university: string;
  targetGpa: string;
  currentGpa: string;
  gpaScale: string;
} {
  const defaults = {
    name: "Demo Student",
    university: "",
    targetGpa: "0.00",
    currentGpa: "0.00",
    gpaScale: "5.0",
  };

  if (typeof document === "undefined") return defaults;

  const part = document.cookie.split(";").find((c) => c.trim().startsWith("passam_demo_profile="));
  if (!part) return defaults;

  try {
    const raw = decodeURIComponent(part.slice(part.indexOf("=") + 1).trim());
    const p = JSON.parse(raw);
    return {
      name:       p.n  || p.name       || defaults.name,
      university: p.u  || p.university  || defaults.university,
      targetGpa:  p.tg || p.targetGpa   || defaults.targetGpa,
      currentGpa: p.cg || p.currentGpa  || defaults.currentGpa,
      gpaScale:   p.gs || p.gpaScale    || defaults.gpaScale,
    };
  } catch {
    return defaults;
  }
}
