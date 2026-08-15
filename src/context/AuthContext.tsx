"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { authLogin, authGetMe } from "@/api-client";
import type { LoginRequest, UserBaseResponse, ErrorDetail } from "@/api-client";
import {
  clearAuth,
  getPostLoginPath,
  getStoredUser,
  getToken,
  getTokenExpiresAt,
  isSuperAdmin as checkSuperAdmin,
  isTokenExpired,
  canAccessStaffPortal,
  setAuth,
  setOrganizationId,
  getOrganizationId,
  getTokenTtlSeconds,
} from "@/lib/auth";
import {
  configureApiClient,
  setApiOrganizationId,
  setSessionExpiredHandler,
} from "@/lib/api";

type AuthState = {
  user: UserBaseResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  canAccessPortal: boolean;
  organizationId: string | null;
  login: (credentials: LoginRequest) => Promise<{ redirectTo: string }>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  setActiveOrganization: (orgId: string) => void;
  error: string | null;
};

const AuthContext = createContext<AuthState | null>(null);

function extractErrorMessage(error: unknown): string {
  if (!error) return "Une erreur est survenue";
  const e = error as ErrorDetail;
  if (typeof e.detail === "string") return e.detail;
  if (Array.isArray(e.detail)) return "Données invalides";
  return "Une erreur est survenue";
}

async function setSessionCookie(
  accessToken: string,
  isSuperAdminFlag: boolean,
  staffPortal: boolean
) {
  const expiresIn = getTokenTtlSeconds(accessToken);
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token: accessToken,
      is_super_admin: isSuperAdminFlag,
      staff_portal: staffPortal,
      ...(expiresIn != null ? { expires_in: expiresIn } : {}),
    }),
  });
}

async function clearSessionCookie() {
  await fetch("/api/auth/session", { method: "DELETE" });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserBaseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrgId] = useState<string | null>(null);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loggingOutRef = useRef(false);

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    clearExpiryTimer();
    clearAuth();
    try {
      await clearSessionCookie();
    } catch {
      // ignore network errors on logout
    }
    setUser(null);
    setOrgId(null);
    setError(null);
    loggingOutRef.current = false;
  }, [clearExpiryTimer]);

  /** Déconnexion forcée (token expiré / 401) + redirect login. */
  const forceLogout = useCallback(async () => {
    await logout();
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path !== "/signin" && path !== "/signup" && path !== "/access-denied") {
        router.replace(`/signin?from=${encodeURIComponent(path)}&reason=expired`);
        router.refresh();
      }
    }
  }, [logout, router]);

  const scheduleExpiryLogout = useCallback(
    (token: string) => {
      clearExpiryTimer();
      const expiresAt = getTokenExpiresAt(token);
      if (expiresAt == null) return;
      const delay = Math.max(0, expiresAt - Date.now() - 5_000);
      expiryTimerRef.current = setTimeout(() => {
        void forceLogout();
      }, delay);
    },
    [clearExpiryTimer, forceLogout]
  );

  useEffect(() => {
    setSessionExpiredHandler(() => forceLogout());
    return () => setSessionExpiredHandler(null);
  }, [forceLogout]);

  const refreshMe = useCallback(async () => {
    const token = getToken();
    if (!token || isTokenExpired(token)) {
      clearAuth();
      await clearSessionCookie();
      setUser(null);
      setIsLoading(false);
      return;
    }
    configureApiClient();
    const { data, error: err } = await authGetMe();
    if (err || !data) {
      clearAuth();
      await clearSessionCookie();
      clearExpiryTimer();
      setUser(null);
      setIsLoading(false);
      return;
    }
    setUser(data);
    setOrgId(getOrganizationId());
    await setSessionCookie(
      token,
      checkSuperAdmin(data),
      canAccessStaffPortal(data)
    );
    scheduleExpiryLogout(token);
    setIsLoading(false);
  }, [clearExpiryTimer, scheduleExpiryLogout]);

  useEffect(() => {
    const token = getToken();
    if (token && isTokenExpired(token)) {
      clearAuth();
      void clearSessionCookie();
      setUser(null);
      setIsLoading(false);
      return;
    }
    const stored = getStoredUser();
    if (stored && token) {
      setUser(stored);
      setOrgId(getOrganizationId());
      configureApiClient();
      scheduleExpiryLogout(token);
      refreshMe();
    } else {
      setIsLoading(false);
    }
    return () => clearExpiryTimer();
  }, [refreshMe, scheduleExpiryLogout, clearExpiryTimer]);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      setError(null);
      configureApiClient();
      const { data, error: err } = await authLogin({ body: credentials });
      if (err || !data) {
        const message = extractErrorMessage(err);
        setError(message);
        throw new Error(message);
      }

      const staffPortal = canAccessStaffPortal(data.user);
      setAuth(data);
      await setSessionCookie(
        data.access_token,
        checkSuperAdmin(data.user),
        staffPortal
      );
      configureApiClient();
      setUser(data.user);
      setOrgId(getOrganizationId());
      scheduleExpiryLogout(data.access_token);

      return { redirectTo: getPostLoginPath(data.user) };
    },
    [scheduleExpiryLogout]
  );

  const setActiveOrganization = useCallback((orgId: string) => {
    setOrganizationId(orgId);
    setApiOrganizationId(orgId);
    setOrgId(orgId);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user && !!getToken() && !isTokenExpired(),
      isSuperAdmin: checkSuperAdmin(user),
      canAccessPortal: canAccessStaffPortal(user),
      organizationId,
      login,
      logout,
      refreshMe,
      setActiveOrganization,
      error,
    }),
    [
      user,
      isLoading,
      organizationId,
      login,
      logout,
      refreshMe,
      setActiveOrganization,
      error,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
