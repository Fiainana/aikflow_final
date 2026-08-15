/**
 * Auth helpers — stockage token + détection Super Admin vs Club SaaS
 *
 * Phase 0 : auth + séparation des deux espaces de comptes.
 * Token en localStorage (client) + cookie httpOnly (middleware).
 * Expiration JWT lue depuis le claim `exp`.
 *
 * Portail staff (ce frontend) : CLUB_ADMIN / COACH / ASSISTANT_COACH / STAFF
 * (+ SUPER_ADMIN). ATHLETE et PARENT n'ont pas accès (app mobile dédiée).
 */

import type { LoginResponse, UserBaseResponse, RoleEnum } from "@/api-client";

const TOKEN_KEY = "aikflow_access_token";
const USER_KEY = "aikflow_user";
const ORG_KEY = "aikflow_organization_id";

/** Rôles autorisés sur le portail web staff / admin club. */
export const STAFF_PORTAL_ROLES = new Set<string>([
  "SUPER_ADMIN",
  "CLUB_ADMIN",
  "COACH",
  "ASSISTANT_COACH",
  "STAFF",
]);

/** Rôles explicitement exclus du portail web (Phase 0). */
export const BLOCKED_PORTAL_ROLES = new Set<string>(["ATHLETE", "PARENT"]);

/** Payload JWT minimal (sans vérification crypto — le backend valide). */
type JwtPayload = {
  exp?: number;
  iat?: number;
  sub?: string;
  [key: string]: unknown;
};

/**
 * Décode le payload d'un JWT (base64url) sans vérifier la signature.
 * Retourne null si le format est invalide.
 */
export function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** Timestamp d'expiration (ms) ou null si absent / invalide. */
export function getTokenExpiresAt(token?: string | null): number | null {
  const t = token ?? (typeof window !== "undefined" ? getToken() : null);
  if (!t) return null;
  const payload = parseJwtPayload(t);
  if (!payload?.exp || typeof payload.exp !== "number") return null;
  return payload.exp * 1000;
}

/**
 * True si le token est absent, mal formé, ou expiré.
 * `skewMs` : marge avant expiration (défaut 15s).
 */
export function isTokenExpired(
  token?: string | null,
  skewMs = 15_000
): boolean {
  const t = token ?? (typeof window !== "undefined" ? getToken() : null);
  if (!t) return true;
  const expiresAt = getTokenExpiresAt(t);
  // Pas de claim exp → on ne force pas l'expiration côté client
  if (expiresAt == null) return false;
  return Date.now() >= expiresAt - skewMs;
}

/** Secondes restantes avant expiration (0 si déjà expiré). */
export function getTokenTtlSeconds(token?: string | null): number | null {
  const expiresAt = getTokenExpiresAt(token);
  if (expiresAt == null) return null;
  return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuth(login: LoginResponse): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, login.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(login.user));
  // Org par défaut = premier membership non Super Admin si présent
  const orgId =
    login.user.memberships?.find((m) => m.role !== "SUPER_ADMIN")?.organization
      ?.id ??
    login.user.memberships?.[0]?.organization?.id ??
    null;
  if (orgId) {
    localStorage.setItem(ORG_KEY, orgId);
  }
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ORG_KEY);
}

export function getStoredUser(): UserBaseResponse | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserBaseResponse;
  } catch {
    return null;
  }
}

export function getOrganizationId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ORG_KEY);
}

export function setOrganizationId(orgId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ORG_KEY, orgId);
}

/** True si l'utilisateur a le rôle SUPER_ADMIN (au moins un membership). */
export function isSuperAdmin(user?: UserBaseResponse | null): boolean {
  const u = user ?? getStoredUser();
  if (!u?.memberships?.length) return false;
  return u.memberships.some((m) => m.role === "SUPER_ADMIN");
}

/** Rôles présents dans les memberships. */
export function getRoles(user?: UserBaseResponse | null): string[] {
  const u = user ?? getStoredUser();
  if (!u?.memberships?.length) return [];
  return [...new Set(u.memberships.map((m) => m.role))];
}

/**
 * Accès au portail web staff / admin club.
 * - SUPER_ADMIN, CLUB_ADMIN, COACH, ASSISTANT_COACH, STAFF → oui
 * - ATHLETE / PARENT seuls → non (même si multi-rôles, un rôle staff suffit)
 */
export function canAccessStaffPortal(user?: UserBaseResponse | null): boolean {
  const roles = getRoles(user);
  if (!roles.length) return false;
  return roles.some((r) => STAFF_PORTAL_ROLES.has(r));
}

/** True si l'utilisateur n'a que des rôles bloqués (ATHLETE / PARENT). */
export function isBlockedPortalUser(user?: UserBaseResponse | null): boolean {
  const roles = getRoles(user);
  if (!roles.length) return false;
  return !roles.some((r) => STAFF_PORTAL_ROLES.has(r));
}

/**
 * Redirection post-login selon le type de compte.
 * ATHLETE / PARENT → page accès refusé (pas le dashboard staff).
 */
export function getPostLoginPath(user: UserBaseResponse): string {
  if (isSuperAdmin(user)) {
    return "/admin/clubs";
  }
  if (!canAccessStaffPortal(user)) {
    return "/access-denied";
  }
  return "/";
}

export type ClubRole = Extract<
  RoleEnum,
  | "CLUB_ADMIN"
  | "COACH"
  | "ASSISTANT_COACH"
  | "STAFF"
  | "ATHLETE"
  | "PARENT"
  | "HEALTH_PRO"
  | "MARKETPLACE_PRO"
>;
