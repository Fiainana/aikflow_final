/**
 * Configuration du client API généré (@hey-api/client-fetch).
 * À importer une fois au boot (layout ou AuthProvider).
 */

import { client } from "@/api-client/client.gen";
import { getToken, getOrganizationId } from "@/lib/auth";

const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

/**
 * Applique baseUrl + Authorization + X-Organization-Id sur le client global.
 * Appeler après login / au chargement de l'app côté client.
 */
export function configureApiClient(): void {
  client.setConfig({
    baseUrl,
    auth: () => getToken() ?? undefined,
    headers: {
      // Header multi-tenant : org active (requis si multi-memberships)
      ...(getOrganizationId()
        ? { "X-Organization-Id": getOrganizationId()! }
        : {}),
    },
  });
}

/**
 * Met à jour uniquement le header org (changement de club / contexte).
 */
export function setApiOrganizationId(orgId: string | null): void {
  const headers: Record<string, string> = {};
  if (orgId) {
    headers["X-Organization-Id"] = orgId;
  }
  client.setConfig({
    headers,
  });
}

export { client };
