import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ── Constants ──────────────────────────────────────────────────────────────────
/** Trigger a full cookie purge when the Cookie header exceeds this size. */
const PURGE_THRESHOLD_BYTES = 10_000;

/** These cookies survive a purge. */
const CRITICAL_COOKIES = new Set(["passam_demo_session"]);

// ── Helpers ────────────────────────────────────────────────────────────────────
function byteLen(s: string): number {
  let b = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    b += c < 0x80 ? 1 : c < 0x800 ? 2 : 3;
  }
  return b;
}

function cookieHeaderSize(req: NextRequest): number {
  return byteLen(req.headers.get("cookie") ?? "");
}

/**
 * Build a raw Set-Cookie string that expires a cookie immediately.
 * We emit two variants per cookie (HttpOnly and non-HttpOnly) so we match
 * however Supabase / the browser originally set it.
 */
function clearCookieHeader(name: string, httpOnly: boolean): string {
  const base = [
    `${encodeURIComponent(name)}=`,
    "Path=/",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "SameSite=Lax",
  ];
  if (httpOnly) base.push("HttpOnly");
  return base.join("; ");
}

/**
 * Redirect the user to /login and NUCLEAR-CLEAR every non-critical cookie.
 * Two Set-Cookie headers are emitted per cookie name — one with HttpOnly and
 * one without — so we reliably clear both HttpOnly (Supabase JWT) and
 * regular (passam_demo_*) cookies in one round-trip.
 *
 * By redirecting to /login directly (instead of /session-reset → /login)
 * we eliminate the extra hop where old cookies could reattach.
 */
function buildNuclearPurgeResponse(req: NextRequest): NextResponse {
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  const res = NextResponse.redirect(loginUrl);

  req.cookies.getAll().forEach(({ name }) => {
    if (CRITICAL_COOKIES.has(name)) return;

    // Clear as regular (non-HttpOnly) cookie
    res.headers.append("Set-Cookie", clearCookieHeader(name, false));

    // Also clear as HttpOnly cookie — required to remove Supabase JWT tokens
    res.headers.append("Set-Cookie", clearCookieHeader(name, true));
  });

  console.warn(
    `[Middleware] Purged ${req.cookies.getAll().length - CRITICAL_COOKIES.size} cookies ` +
    `(header was ${cookieHeaderSize(req)} bytes). Redirecting to /login.`
  );

  return res;
}

// ── Main middleware ────────────────────────────────────────────────────────────
export async function updateSession(request: NextRequest) {
  // ── 1. Size guard — runs BEFORE any other logic ────────────────────────────
  const cookieSize = cookieHeaderSize(request);
  if (cookieSize > PURGE_THRESHOLD_BYTES) {
    // Redirect to /login directly (not via /session-reset) to eliminate
    // the two-hop redirect that previously allowed cookies to reattach.
    return buildNuclearPurgeResponse(request);
  }

  // ── 2. Normal Supabase session refresh ─────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not add logic between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDemo = request.cookies.get("passam_demo_session")?.value === "true";
  const isAuthenticated = !!user || isDemo;

  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/study") ||
    request.nextUrl.pathname.startsWith("/assessments") ||
    request.nextUrl.pathname.startsWith("/resources") ||
    request.nextUrl.pathname.startsWith("/profile");

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register");

  if (!isAuthenticated && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // ── 3. Attach diagnostic header ────────────────────────────────────────────
  supabaseResponse.headers.set("X-PassAm-Cookie-Size", String(cookieSize));

  return supabaseResponse;
}
