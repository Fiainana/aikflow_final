import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/signin",
  "/signup",
  "/error-404",
  "/reset-password",
  "/access-denied",
];

const TOKEN_COOKIE = "aikflow_access_token";
const ROLE_COOKIE = "aikflow_is_super_admin";
const PORTAL_COOKIE = "aikflow_staff_portal";

/** Routes réservées au portail staff (coach / admin club / staff). */
function isStaffPortalPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return (
    pathname.startsWith("/teams") ||
    pathname.startsWith("/members") ||
    pathname.startsWith("/wellness") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/blank")
  );
}

function accessDeniedUrl(request: NextRequest) {
  const url = new URL("/access-denied", request.url);
  url.searchParams.set("reason", "mobile");
  return url;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const isSuperAdmin =
    request.cookies.get(ROLE_COOKIE)?.value === "1";
  const staffPortal =
    request.cookies.get(PORTAL_COOKIE)?.value === "1" || isSuperAdmin;

  if (!isPublic && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (isPublic && token && (pathname === "/signin" || pathname === "/signup")) {
    let dest = "/";
    if (isSuperAdmin) dest = "/admin/clubs";
    else if (!staffPortal) {
      return NextResponse.redirect(accessDeniedUrl(request));
    }
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (pathname.startsWith("/admin")) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
    if (!isSuperAdmin) {
      if (!staffPortal) {
        return NextResponse.redirect(accessDeniedUrl(request));
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (
    token &&
    isSuperAdmin &&
    (pathname === "/" ||
      pathname.startsWith("/teams") ||
      pathname.startsWith("/members") ||
      pathname.startsWith("/wellness") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/privacy") ||
      pathname.startsWith("/calendar"))
  ) {
    return NextResponse.redirect(new URL("/admin/clubs", request.url));
  }

  if (token && !isSuperAdmin && !staffPortal && isStaffPortalPath(pathname)) {
    return NextResponse.redirect(accessDeniedUrl(request));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
