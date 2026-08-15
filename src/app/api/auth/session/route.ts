import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "aikflow_access_token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** POST — set httpOnly cookie after client login */
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

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });
    return res;
  } catch {
    return NextResponse.json({ detail: "Invalid body" }, { status: 400 });
  }
}

/** DELETE — clear session cookie on logout */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
