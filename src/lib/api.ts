/**
 * Configuration du client API généré (@hey-api/client-fetch).
 * À importer une fois au boot (layout ou AuthProvider).
 *
 * Intercepteur 401 → déconnexion automatique (token expiré / invalide).
 */

import { client } from "@/api-client/client.gen";
import { getToken, getOrganizationId, isTokenExpired } from "@/lib/auth";

const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type SessionExpiredHandler = () => void | Promise<void>;

let onSessionExpired: SessionExpiredHandler | null = null;
let handlingExpiry = false;

/**
 * Enregistre le callback appelé sur 401 ou token expiré côté client.
 * Typiquement : clearAuth + redirect /signin.
 */
export function setSessionExpiredHandler(
  handler: SessionExpiredHandler | null
): void {
  onSessionExpired = handler;
}

export async function notifySessionExpired(): Promise<void> {
  if (handlingExpiry) return;
  handlingExpiry = true;
  try {
    await onSessionExpired?.();
  } finally {
    // laisser un court délai pour éviter une boucle si plusieurs 401 parallèles
    setTimeout(() => {
      handlingExpiry = false;
    }, 1500);
  }
}

let interceptorsInstalled = false;

function installAuthInterceptors(): void {
  if (interceptorsInstalled) return;
  interceptorsInstalled = true;

  // Avant requête : si JWT déjà expiré, forcer la déconnexion
  client.interceptors.request.use(async (request) => {
    const token = getToken();
    if (token && isTokenExpired(token)) {
      void notifySessionExpired();
    }
    return request;
  });

  // Après réponse : 401 Unauthorized → session expirée
  client.interceptors.response.use(async (response) => {
    if (response.status === 401) {
      // Ne pas déclencher sur la page login elle-même (auth/login 401 = mauvais mdp)
      const url = response.url || "";
      const isLoginCall =
        url.includes("/auth/login") || url.includes("/api/v1/auth/login");
      if (!isLoginCall) {
        void notifySessionExpired();
      }
    }
    return response;
  });
}

/**
 * Applique baseUrl + Authorization + X-Organization-Id sur le client global.
 * Appeler après login / au chargement de l'app côté client.
 */
export function configureApiClient(): void {
  installAuthInterceptors();
  client.setConfig({
    baseUrl,
    auth: () => {
      const token = getToken();
      if (!token || isTokenExpired(token)) return undefined;
      return token;
    },
    headers: {
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
