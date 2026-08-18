/**
 * Coach brief — /api/v1/coach
 */

import { apiFetch } from "@/lib/api/http";

export type Criticity = "LOW" | "MEDIUM" | "HIGH";
export type SignalKind =
  | "MISSING_WELLNESS"
  | "WELLNESS_DROP"
  | "LOW_WELLNESS"
  | "HIGH_RPE"
  | "HIGH_LOAD";
export type DecisionAction =
  | "ACKNOWLEDGED"
  | "MODIFIED"
  | "IGNORED"
  | "ESCALATED";

export type CoachBriefResponse = {
  organization_id: string;
  brief_date: string;
  total_signals: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  unhandled_count: number;
  priority_athletes: {
    athlete_user_id: string;
    first_name: string;
    last_name: string;
    team_id?: string | null;
    team_name?: string | null;
    criticity: Criticity;
    recommended_action: string;
    already_handled?: boolean;
    signal_keys?: string[];
    reasons: { code: string; label: string; detail: string }[];
  }[];
  signals: {
    signal_key: string;
    kind: SignalKind;
    criticity: Criticity;
    athlete_user_id: string;
    first_name: string;
    last_name: string;
    summary: string;
    already_handled?: boolean;
  }[];
};

export type DecisionLogResponse = {
  id: string;
  signal_kind: SignalKind;
  criticity: Criticity;
  action: DecisionAction;
  signal_key: string;
  brief_date: string;
  note?: string | null;
  created_at: string;
};

export async function getCoachBrief(opts?: {
  teamId?: string | null;
  onDate?: string | null;
  includeLoad?: boolean;
}): Promise<CoachBriefResponse> {
  return apiFetch<CoachBriefResponse>("/api/v1/coach/brief", {
    query: {
      team_id: opts?.teamId ?? undefined,
      on_date: opts?.onDate ?? undefined,
      include_load: opts?.includeLoad ?? true,
    },
    fallbackError: "Impossible de charger le brief coach",
  });
}

export async function ackCoachSignal(body: {
  signal_key: string;
  kind: SignalKind;
  criticity: Criticity;
  athlete_user_id: string;
  team_id?: string | null;
  brief_date?: string | null;
  action?: DecisionAction;
  note?: string | null;
}): Promise<DecisionLogResponse> {
  return apiFetch<DecisionLogResponse>("/api/v1/coach/brief/ack", {
    method: "POST",
    body,
    fallbackError: "Impossible d'enregistrer la décision",
  });
}

export async function listCoachDecisions(opts?: {
  briefDate?: string | null;
  limit?: number;
}): Promise<{ items: DecisionLogResponse[]; total: number }> {
  return apiFetch("/api/v1/coach/decisions", {
    query: {
      brief_date: opts?.briefDate ?? undefined,
      limit: opts?.limit ?? 50,
    },
    fallbackError: "Impossible de charger les décisions",
  });
}

export function criticityLabel(c: Criticity): string {
  if (c === "HIGH") return "Haute";
  if (c === "MEDIUM") return "Moyenne";
  return "Faible";
}

export function signalKindLabel(k: SignalKind | string): string {
  const map: Record<string, string> = {
    MISSING_WELLNESS: "Wellness manquant",
    WELLNESS_DROP: "Chute wellness",
    LOW_WELLNESS: "Wellness bas",
    HIGH_RPE: "RPE élevé",
    HIGH_LOAD: "Charge élevée",
  };
  return map[k] ?? k;
}
