/**
 * Safeguarding — /api/v1/safeguarding
 */

import { apiFetch } from "@/lib/api/http";

export type ReportCategory =
  | "CONCERN"
  | "INCIDENT"
  | "DISCLOSURE"
  | "OTHER";
export type ReportStatus =
  | "OPEN"
  | "IN_REVIEW"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED";

export type SafeguardingReport = {
  id: string;
  organization_id: string;
  reporter_user_id: string | null;
  is_anonymous: boolean;
  category: ReportCategory;
  subject: string;
  description: string;
  status: ReportStatus;
  assigned_to_user_id: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
};

export async function listSafeguardingReports(): Promise<{
  items: SafeguardingReport[];
  total: number;
}> {
  return apiFetch("/api/v1/safeguarding/reports", {
    fallbackError: "Impossible de charger les signalements",
  });
}

export async function createSafeguardingReport(body: {
  category: ReportCategory;
  subject: string;
  description: string;
  is_anonymous?: boolean;
}): Promise<SafeguardingReport> {
  return apiFetch("/api/v1/safeguarding/reports", {
    method: "POST",
    body,
    fallbackError: "Dépôt du signalement impossible",
  });
}

export async function updateSafeguardingReport(
  reportId: string,
  body: {
    status?: ReportStatus;
    assigned_to_user_id?: string | null;
    resolution_note?: string | null;
  },
): Promise<SafeguardingReport> {
  return apiFetch(`/api/v1/safeguarding/reports/${reportId}`, {
    method: "PATCH",
    body,
    fallbackError: "Mise à jour impossible",
  });
}

export function categoryLabel(c: ReportCategory): string {
  const map: Record<ReportCategory, string> = {
    CONCERN: "Préoccupation",
    INCIDENT: "Incident",
    DISCLOSURE: "Révélation",
    OTHER: "Autre",
  };
  return map[c] ?? c;
}

export function statusLabel(s: ReportStatus): string {
  const map: Record<ReportStatus, string> = {
    OPEN: "Ouvert",
    IN_REVIEW: "En cours",
    ESCALATED: "Escaladé",
    RESOLVED: "Résolu",
    CLOSED: "Clos",
  };
  return map[s] ?? s;
}
