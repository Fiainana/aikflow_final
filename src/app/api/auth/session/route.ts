import { NextRequest, NextResponse } from "next/server";

const TOKEN_COOKIE = "aikflow_access_token";
const ROLE_COOKIE = "aikflow_is_super_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
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

    const res = NextResponse.json({ ok: true });
    res.cookies.set(TOKEN_COOKIE, token, cookieOptions(MAX_AGE));
    res.cookies.set(
      ROLE_COOKIE,
      isSuperAdmin ? "1" : "0",
      cookieOptions(MAX_AGE)
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
  return res;
}
