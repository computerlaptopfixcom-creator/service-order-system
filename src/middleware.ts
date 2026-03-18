import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const AUTH_COOKIE = "str_admin_session";
const SECRET = process.env.AUTH_SECRET || "str-default-secret";

interface SessionPayload {
  userId: string;
  username: string;
  role: string;
  displayName: string;
  mustChangePassword: boolean;
}

async function validateToken(token: string): Promise<SessionPayload | null> {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [payloadB64, timestampRandom, hash] = parts;
  const raw = `${payloadB64}.${timestampRandom}`;

  // Check token expiration (24 hours)
  const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
  try {
    const timestamp = parseInt(timestampRandom.split("-")[0], 10);
    if (isNaN(timestamp) || Date.now() - timestamp > SESSION_MAX_AGE_MS) return null;
  } catch {
    return null;
  }

  // Verify HMAC
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(raw));
    const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
    if (expected !== hash) return null;
  } catch {
    return null;
  }

  // Decode payload
  try {
    // base64url decode
    const b64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(b64);
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Routes that require specific roles (admin only)
const ADMIN_ONLY_ROUTES = [
  "/api/users",
  "/api/audit",
  "/api/backup",
  "/api/export",
  "/api/settings",
  "/admin/usuarios",
  "/admin/auditoria",
  "/admin/configuracion",
];

function requiresAdmin(pathname: string, method: string): boolean {
  // Settings GET is public
  if (pathname === "/api/settings" && method === "GET") return false;
  return ADMIN_ONLY_ROUTES.some(route => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Rate Limiting ───
  if (pathname === "/api/auth/login") {
    const ip = getClientIP(request);
    const { allowed, retryAfterMs } = checkRateLimit(ip + ":login", 5, 5 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: `Demasiados intentos. Intenta de nuevo en ${Math.ceil(retryAfterMs / 1000)} segundos.` },
        { status: 429 }
      );
    }
  }

  if (pathname === "/api/orders/verify") {
    const ip = getClientIP(request);
    const { allowed, retryAfterMs } = checkRateLimit(ip + ":verify", 10, 5 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: `Demasiados intentos. Intenta de nuevo en ${Math.ceil(retryAfterMs / 1000)} segundos.` },
        { status: 429 }
      );
    }
  }

  // Allow login page without auth
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Protect /admin routes (auth check)
  if (pathname.startsWith("/admin")) {
    const session = request.cookies.get(AUTH_COOKIE)?.value;
    const payload = session ? await validateToken(session) : null;

    if (!payload) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Force password change redirect
    if (payload.mustChangePassword && pathname !== "/admin/cuenta") {
      const changeUrl = new URL("/admin/cuenta?force=1", request.url);
      return NextResponse.redirect(changeUrl);
    }

    // Admin-only page check
    if (requiresAdmin(pathname, request.method) && payload.role !== "admin") {
      const dashUrl = new URL("/admin", request.url);
      return NextResponse.redirect(dashUrl);
    }

    // Pass user info to the request via headers
    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.userId);
    response.headers.set("x-user-role", payload.role);
    response.headers.set("x-user-name", payload.displayName);
    return response;
  }

  // Public API routes
  const isPublicRoute =
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/logout" ||
    pathname === "/api/orders/verify" ||
    pathname.startsWith("/api/orders/portal/") ||
    (pathname.match(/\/api\/orders\/[^/]+\/budget/) && request.method === "POST") ||
    (pathname === "/api/orders/search" && request.method === "GET") ||
    (pathname === "/api/settings" && request.method === "GET");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // All other API routes require admin auth
  if (pathname.startsWith("/api/")) {
    const session = request.cookies.get(AUTH_COOKIE)?.value;
    const payload = session ? await validateToken(session) : null;

    if (!payload) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Admin-only API route check
    if (requiresAdmin(pathname, request.method) && payload.role !== "admin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
    }

    // Pass user info to API handlers via headers
    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.userId);
    response.headers.set("x-user-role", payload.role);
    response.headers.set("x-user-name", payload.displayName);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
