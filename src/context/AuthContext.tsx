"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authLogin, authGetMe } from "@/api-client";
import type { LoginRequest, UserBaseResponse, ErrorDetail } from "@/api-client";
import {
  clearAuth,
  getPostLoginPath,
  getStoredUser,
  getToken,
  isSuperAdmin as checkSuperAdmin,
  setAuth,
  setOrganizationId,
  getOrganizationId,
} from "@/lib/auth";
import { configureApiClient, setApiOrganizationId } from "@/lib/api";

type AuthState = {
  user: UserBaseResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
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
  isSuperAdminFlag: boolean
) {
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token: accessToken,
      is_super_admin: isSuperAdminFlag,
    }),
  });
}

async function clearSessionCookie() {
  await fetch("/api/auth/session", { method: "DELETE" });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserBaseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrgId] = useState<string | null>(null);

  const refreshMe = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    configureApiClient();
    const { data, error: err } = await authGetMe();
    if (err || !data) {
      clearAuth();
      await clearSessionCookie();
      setUser(null);
      setIsLoading(false);
      return;
    }
    setUser(data);
    setOrgId(getOrganizationId());
    // Resync role cookie (ex. après refresh token / me)
    await setSessionCookie(token, checkSuperAdmin(data));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored && getToken()) {
      setUser(stored);
      setOrgId(getOrganizationId());
      configureApiClient();
      refreshMe();
    } else {
      setIsLoading(false);
    }
  }, [refreshMe]);

  const login = useCallback(async (credentials: LoginRequest) => {
    setError(null);
    configureApiClient();
    const { data, error: err } = await authLogin({ body: credentials });
    if (err || !data) {
      const message = extractErrorMessage(err);
      setError(message);
      throw new Error(message);
    }
    setAuth(data);
    await setSessionCookie(data.access_token, checkSuperAdmin(data.user));
    configureApiClient();
    setUser(data.user);
    setOrgId(getOrganizationId());
    return { redirectTo: getPostLoginPath(data.user) };
  }, []);

  const logout = useCallback(async () => {
    clearAuth();
    await clearSessionCookie();
    setUser(null);
    setOrgId(null);
    setError(null);
  }, []);

  const setActiveOrganization = useCallback((orgId: string) => {
    setOrganizationId(orgId);
    setApiOrganizationId(orgId);
    setOrgId(orgId);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user && !!getToken(),
      isSuperAdmin: checkSuperAdmin(user),
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
