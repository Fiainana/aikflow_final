/**
 * Alertes — /api/v1/alerts
 */

import { apiFetch } from "@/lib/api/http";

export type AlertType = "WELLNESS_DROP" | "HIGH_DAILY_LOAD";
export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export type AlertItem = {
  alert_type: AlertType;
  severity: AlertSeverity;
  athlete: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  organization_id: string;
  on_date: string;
  message: string;
  value: number | null;
  previous_value: number | null;
  source_id: string | null;
  detected_at: string;
};

export async function listOrgAlerts(opts?: {
  days?: number;
}): Promise<{ items: AlertItem[]; total: number }> {
  return apiFetch("/api/v1/alerts", {
    query: { days: opts?.days ?? 7 },
    fallbackError: "Impossible de charger les alertes",
  });
}

export async function listTeamAlerts(
  teamId: string,
  opts?: { days?: number },
): Promise<{ items: AlertItem[]; total: number }> {
  return apiFetch(`/api/v1/alerts/teams/${teamId}`, {
    query: { days: opts?.days ?? 7 },
    fallbackError: "Impossible de charger les alertes équipe",
  });
}

export function severityLabel(s: AlertSeverity): string {
  if (s === "CRITICAL") return "Critique";
  if (s === "WARNING") return "Attention";
  return "Info";
}

export function alertTypeLabel(t: AlertType): string {
  if (t === "WELLNESS_DROP") return "Chute wellness";
  if (t === "HIGH_DAILY_LOAD") return "Charge élevée";
  return t;
}
