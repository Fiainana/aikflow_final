import { NextRequest, NextResponse } from "next/server";

const TOKEN_COOKIE = "aikflow_access_token";
const ROLE_COOKIE = "aikflow_is_super_admin";
/** 1 = accès portail staff (coach/admin/staff), 0 = ATHLETE/PARENT bloqués */
const PORTAL_COOKIE = "aikflow_staff_portal";
/** Fallback si le client n'envoie pas expires_in (ex. JWT sans claim exp). */
const DEFAULT_MAX_AGE = 60 * 60 * 24; // 24h

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function parseJwtExpSeconds(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = Buffer.from(padded, "base64").toString("utf8");
    const payload = JSON.parse(json) as { exp?: number };
    if (typeof payload.exp !== "number") return null;
    const ttl = payload.exp - Math.floor(Date.now() / 1000);
    return ttl > 0 ? ttl : 0;
  } catch {
    return null;
  }
}

/** POST — set httpOnly cookies after client login */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body?.access_token as string | undefined;
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { detail: "access_token required" },
        { status: 400 }
      );
    }

    const isSuperAdmin = Boolean(body?.is_super_admin);
    // staff_portal : true par défaut pour Super Admin ; sinon flag client
    const staffPortal = isSuperAdmin
      ? true
      : body?.staff_portal !== false && body?.staff_portal !== 0;

    let maxAge = DEFAULT_MAX_AGE;
    if (typeof body?.expires_in === "number" && body.expires_in > 0) {
      maxAge = Math.floor(body.expires_in);
    } else {
      const fromJwt = parseJwtExpSeconds(token);
      if (fromJwt != null) maxAge = fromJwt;
    }

    const res = NextResponse.json({ ok: true, max_age: maxAge });
    res.cookies.set(TOKEN_COOKIE, token, cookieOptions(maxAge));
    res.cookies.set(
      ROLE_COOKIE,
      isSuperAdmin ? "1" : "0",
      cookieOptions(maxAge)
    );
    res.cookies.set(
      PORTAL_COOKIE,
      staffPortal ? "1" : "0",
      cookieOptions(maxAge)
    );
    return res;
  } catch {
    return NextResponse.json({ detail: "Invalid body" }, { status: 400 });
  }
}

/** DELETE — clear session cookies on logout */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(TOKEN_COOKIE, "", cookieOptions(0));
  res.cookies.set(ROLE_COOKIE, "", cookieOptions(0));
  res.cookies.set(PORTAL_COOKIE, "", cookieOptions(0));
  return res;
}
