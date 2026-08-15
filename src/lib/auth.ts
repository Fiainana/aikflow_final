/**
 * Auth helpers — stockage token + détection Super Admin vs Club SaaS
 *
 * Phase 0 : auth + séparation des deux espaces de comptes.
 * Token en localStorage pour le dev ; passer à cookie httpOnly en prod.
 */

import type { LoginResponse, UserBaseResponse, RoleEnum } from "@/api-client";

const TOKEN_KEY = "aikflow_access_token";
const USER_KEY = "aikflow_user";
const ORG_KEY = "aikflow_organization_id";

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

/** Rôles présents dans les memberships (hors org). */
export function getRoles(user?: UserBaseResponse | null): string[] {
  const u = user ?? getStoredUser();
  if (!u?.memberships?.length) return [];
  return [...new Set(u.memberships.map((m) => m.role))];
}

/** Redirection post-login selon le type de compte. */
export function getPostLoginPath(user: UserBaseResponse): string {
  if (isSuperAdmin(user)) {
    return "/admin/clubs"; // espace Super Admin
  }
  return "/"; // dashboard club (coach / admin club / staff)
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
