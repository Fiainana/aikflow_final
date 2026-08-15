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
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/blank")
  );
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

  // Non authentifié → login (sauf pages publiques)
  if (!isPublic && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Déjà connecté sur /signin ou /signup → home selon rôle
  if (isPublic && token && (pathname === "/signin" || pathname === "/signup")) {
    let dest = "/";
    if (isSuperAdmin) dest = "/admin/clubs";
    else if (!staffPortal) dest = "/access-denied";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Routes Super Admin : uniquement SUPER_ADMIN
  if (pathname.startsWith("/admin")) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
    if (!isSuperAdmin) {
      // ATHLETE/PARENT → accès refusé ; staff club → dashboard
      const dest = staffPortal ? "/" : "/access-denied";
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  // Super Admin sur l'espace club → admin clubs
  // Exception profils individuels éventuels déjà gérés ailleurs si besoin
  if (
    token &&
    isSuperAdmin &&
    (pathname === "/" ||
      pathname.startsWith("/teams") ||
      pathname.startsWith("/members") ||
      pathname.startsWith("/wellness") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/calendar"))
  ) {
    return NextResponse.redirect(new URL("/admin/clubs", request.url));
  }

  // ATHLETE / PARENT : pas d'accès au portail staff
  if (token && !isSuperAdmin && !staffPortal && isStaffPortalPath(pathname)) {
    return NextResponse.redirect(new URL("/access-denied", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
