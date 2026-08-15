import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware de base.
 *
 * Note : le token est en localStorage (client). Ce middleware ne peut pas le lire.
 * Protection réelle = côté client (AuthProvider + redirection) + vérification API 401.
 *
 * Pour une vraie protection edge, migrer le token vers un cookie httpOnly
 * (set via Route Handler après login) et lire ce cookie ici.
 *
 * Routes publiques : signin, signup, error pages, assets.
 */

const PUBLIC_PATHS = [
  "/signin",
  "/signup",
  "/error-404",
  "/reset-password",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Laisser passer assets et API routes Next
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  // Cookie optionnel pour future migration httpOnly
  const token = request.cookies.get("aikflow_access_token")?.value;

  if (!isPublic && !token) {
    // Sans cookie : on laisse passer (auth client) ; si cookie présent et invalide, l'API renverra 401
    // Quand le token sera en cookie, décommenter :
    // const url = request.nextUrl.clone();
    // url.pathname = "/signin";
    // url.searchParams.set("from", pathname);
    // return NextResponse.redirect(url);
  }

  if (isPublic && token && (pathname === "/signin" || pathname === "/signup")) {
    // Déjà connecté via cookie → dashboard
    // return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
