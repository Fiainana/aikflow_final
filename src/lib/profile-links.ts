/**
 * Liens profil club selon les rôles (athlète prioritaire si multi-rôles).
 */

const STAFF_ROLES = new Set([
  "COACH",
  "ASSISTANT_COACH",
  "STAFF",
  "CLUB_ADMIN",
]);

export function profileHrefForRoles(
  userId: string,
  roles: string[]
): string | null {
  if (!userId) return null;
  if (roles.includes("ATHLETE")) return `/members/${userId}/athlete`;
  if (roles.some((r) => STAFF_ROLES.has(r))) return `/members/${userId}/staff`;
  if (roles.includes("PARENT")) return `/members/${userId}/parent`;
  if (roles.includes("HEALTH_PRO")) return `/members/${userId}/health-pro`;
  return null;
}

/** Rôle équipe → profil. */
export function profileHrefForTeamRole(
  userId: string,
  roleInTeam: string
): string | null {
  if (!userId) return null;
  if (roleInTeam === "ATHLETE") return `/members/${userId}/athlete`;
  if (
    roleInTeam === "COACH" ||
    roleInTeam === "ASSISTANT_COACH" ||
    roleInTeam === "STAFF"
  ) {
    return `/members/${userId}/staff`;
  }
  return null;
}

/** Brief wellness : athlètes → profil athlète. */
export function athleteProfileHref(userId: string): string {
  return `/members/${userId}/athlete`;
}

export const profileNameLinkClass =
  "font-medium text-gray-900 transition hover:text-brand-600 hover:underline dark:text-white dark:hover:text-brand-400";
