import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/signin",
  "/signup",
  "/error-404",
  "/reset-password",
];

const TOKEN_COOKIE = "aikflow_access_token";
const ROLE_COOKIE = "aikflow_is_super_admin";

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

  // Non authentifié → login (sauf pages publiques)
  if (!isPublic && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Déjà connecté sur /signin ou /signup → home selon rôle
  if (isPublic && token && (pathname === "/signin" || pathname === "/signup")) {
    const dest = isSuperAdmin ? "/admin/clubs" : "/";
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
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Super Admin sur l'espace club (brief / teams / members) → admin clubs
  if (
    token &&
    isSuperAdmin &&
    (pathname === "/" ||
      pathname.startsWith("/teams") ||
      pathname.startsWith("/members") ||
      pathname.startsWith("/wellness"))
  ) {
    return NextResponse.redirect(new URL("/admin/clubs", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
