import type { ErrorDetail } from "@/api-client";

/** Message lisible depuis ErrorDetail / HttpValidationError OpenAPI. */
export function apiErrorMessage(
  err: unknown,
  fallback = "Une erreur est survenue"
): string {
  if (!err) return fallback;
  const e = err as ErrorDetail;
  if (typeof e.detail === "string") return e.detail;
  if (Array.isArray(e.detail) && e.detail.length > 0) {
    const first = e.detail[0] as { msg?: string };
    if (first?.msg) return first.msg;
    return "Données invalides";
  }
  return fallback;
}

export function emptyToNull(v: string): string | null {
  const t = v.trim();
  return t ? t : null;
}

export function emptyToNumber(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
