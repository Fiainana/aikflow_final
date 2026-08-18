/**
 * Fetch helper pour les endpoints non encore couverts par le client OpenAPI généré.
 * Réutilise token + org + baseUrl de la stack existante.
 */

import { getToken, getOrganizationId, isTokenExpired } from "@/lib/auth";
import { notifySessionExpired } from "@/lib/api";

const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function extractMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const b = body as { detail?: unknown; message?: string };
  if (typeof b.detail === "string") return b.detail;
  if (Array.isArray(b.detail) && b.detail[0]?.msg) {
    return String(b.detail[0].msg);
  }
  if (typeof b.message === "string") return b.message;
  return fallback;
}

export async function apiFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    query?: Record<string, string | number | boolean | null | undefined>;
    fallbackError?: string;
  } = {},
): Promise<T> {
  const token = getToken();
  if (token && isTokenExpired(token)) {
    void notifySessionExpired();
    throw new ApiError("Session expirée", 401);
  }

  const url = new URL(
    path.startsWith("http") ? path : `${baseUrl.replace(/\/$/, "")}${path}`,
  );
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const orgId = getOrganizationId();
  if (orgId) headers["X-Organization-Id"] = orgId;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url.toString(), {
    method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    const isLogin = url.pathname.includes("/auth/login");
    if (!isLogin) void notifySessionExpired();
    throw new ApiError("Non autorisé", 401);
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(
      extractMessage(data, options.fallbackError ?? `Erreur ${res.status}`),
      res.status,
      data,
    );
  }

  return data as T;
}
