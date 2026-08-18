"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { teamsListTeamsEndpoint } from "@/api-client";
import type { TeamResponse, ErrorDetail } from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { configureApiClient } from "@/lib/api";
import {
  getCoachBrief,
  ackCoachSignal,
  criticityLabel,
  signalKindLabel,
  type CoachBriefResponse,
  type Criticity,
  type DecisionAction,
} from "@/lib/api/coach";
import { ApiError } from "@/lib/api/http";
import {
  athleteProfileHref,
  profileNameLinkClass,
} from "@/lib/profile-links";

function CriticityBadge({ level }: { level: Criticity }) {
  const styles: Record<Criticity, string> = {
    HIGH: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
    MEDIUM:
      "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
    LOW: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[level]}`}
    >
      {criticityLabel(level)}
    </span>
  );
}

export default function CoachBriefPage() {
  const { isAuthenticated, isSuperAdmin, isLoading: authLoading, user } =
    useAuth();
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [brief, setBrief] = useState<CoachBriefResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ackingKey, setAckingKey] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    configureApiClient();
    const { data, error: err } = await teamsListTeamsEndpoint({
      query: { active_only: true },
    });
    if (err) {
      const e = err as ErrorDetail;
      setError(
        typeof e.detail === "string"
          ? e.detail
          : "Impossible de charger les équipes",
      );
      setTeams([]);
      return;
    }
    const items = data?.items ?? [];
    setTeams(items);
  }, []);

  const loadBrief = useCallback(async (teamId: string | null) => {
    setError(null);
    try {
      const data = await getCoachBrief({
        teamId: teamId || null,
        includeLoad: true,
      });
      setBrief(data);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Impossible de charger le brief coach",
      );
      setBrief(null);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (isSuperAdmin) {
      setLoading(false);
      return;
    }
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      await loadTeams();
      await loadBrief(selectedTeamId);
      setLoading(false);
    })();
  }, [authLoading, isAuthenticated, isSuperAdmin, loadTeams, loadBrief, selectedTeamId]);

  const priorityAthletes = useMemo(() => {
    if (!brief?.priority_athletes) return [];
    const order: Record<Criticity, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return [...brief.priority_athletes].sort(
      (a, b) => order[a.criticity] - order[b.criticity],
    );
  }, [brief]);

  async function handleAck(
    athlete: CoachBriefResponse["priority_athletes"][number],
    action: DecisionAction,
  ) {
    const key =
      athlete.signal_keys?.[0] ??
      `${athlete.athlete_user_id}-${athlete.criticity}`;
    setAckingKey(key);
    setError(null);
    try {
      const signal = brief?.signals?.find(
        (s) => s.athlete_user_id === athlete.athlete_user_id,
      );
      await ackCoachSignal({
        signal_key: key,
        kind: signal?.kind ?? "LOW_WELLNESS",
        criticity: athlete.criticity,
        athlete_user_id: athlete.athlete_user_id,
        team_id: athlete.team_id ?? selectedTeamId,
        brief_date: brief?.brief_date,
        action,
      });
      await loadBrief(selectedTeamId);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Impossible d'enregistrer la décision",
      );
    } finally {
      setAckingKey(null);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (isSuperAdmin) {
    return (
      <div className="rounded-xl border border-brand-200 bg-brand-25 p-8 dark:border-brand-800 dark:bg-brand-500/10">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Espace Super Admin
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Gérez les clubs depuis le menu Super Admin.
        </p>
        <Link
          href="/admin/clubs"
          className="mt-4 inline-flex text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Voir les clubs →
        </Link>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">
          Connectez-vous pour accéder au brief du jour.
        </p>
        <Link
          href="/signin"
          className="mt-4 inline-flex text-sm font-medium text-brand-600"
        >
          Connexion
        </Link>
      </div>
    );
  }

  const firstName = user?.first_name ?? "Coach";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
            Brief quotidien
            {brief?.brief_date ? ` · ${brief.brief_date}` : ""}
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Bonjour {firstName}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Priorités actionnables — valider ou ignorer chaque signal
          </p>
        </div>
        <select
          value={selectedTeamId ?? ""}
          onChange={(e) => setSelectedTeamId(e.target.value || null)}
          className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        >
          <option value="">Toutes les équipes</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.age_category})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase text-gray-500">Signaux</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {brief?.total_signals ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-error-100 bg-error-50/50 p-4 dark:border-error-900/40 dark:bg-error-500/5">
          <p className="text-xs font-medium uppercase text-error-600">Haute</p>
          <p className="mt-1 text-2xl font-semibold text-error-600">
            {brief?.high_count ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-warning-100 bg-warning-50/50 p-4 dark:border-warning-900/40 dark:bg-warning-500/5">
          <p className="text-xs font-medium uppercase text-warning-700">
            Moyenne
          </p>
          <p className="mt-1 text-2xl font-semibold text-warning-600">
            {brief?.medium_count ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase text-gray-500">
            Non traités
          </p>
          <p className="mt-1 text-2xl font-semibold text-brand-600">
            {brief?.unhandled_count ?? 0}
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700"
        >
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Athlètes prioritaires
          </h2>
        </div>
        {priorityAthletes.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-gray-500">
            {teams.length === 0 ? (
              <>
                Aucune équipe.{" "}
                <Link href="/teams" className="font-medium text-brand-600">
                  Créer une équipe
                </Link>
              </>
            ) : (
              "Aucun signal prioritaire pour aujourd’hui. Tout est sous contrôle."
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {priorityAthletes.map((athlete) => {
              const rowClass =
                athlete.criticity === "HIGH"
                  ? "criticality-high"
                  : athlete.criticity === "MEDIUM"
                    ? "criticality-medium"
                    : "criticality-low";
              const busy =
                ackingKey ===
                  (athlete.signal_keys?.[0] ??
                    `${athlete.athlete_user_id}-${athlete.criticity}`);
              return (
                <li
                  key={athlete.athlete_user_id}
                  className={`flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${rowClass}`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={athleteProfileHref(athlete.athlete_user_id)}
                        className={profileNameLinkClass}
                      >
                        {athlete.first_name} {athlete.last_name}
                      </Link>
                      <CriticityBadge level={athlete.criticity} />
                      {athlete.already_handled && (
                        <span className="text-xs text-gray-400">Traité</span>
                      )}
                    </div>
                    {athlete.team_name && (
                      <p className="text-xs text-gray-500">{athlete.team_name}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {athlete.recommended_action}
                    </p>
                    {athlete.reasons?.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {athlete.reasons.map((r) => (
                          <li key={r.code} className="text-xs text-gray-500">
                            · {r.label}
                            {r.detail ? ` — ${r.detail}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {!athlete.already_handled && (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleAck(athlete, "ACKNOWLEDGED")}
                        className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                      >
                        Valider
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleAck(athlete, "IGNORED")}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        Ignorer
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleAck(athlete, "ESCALATED")}
                        className="rounded-lg border border-error-200 px-3 py-1.5 text-xs font-medium text-error-700 hover:bg-error-50 disabled:opacity-50 dark:border-error-800 dark:text-error-400"
                      >
                        Escalader
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {brief?.signals && brief.signals.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Détail des signaux
            </h2>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {brief.signals.map((s) => (
              <li
                key={s.signal_key}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
              >
                <div>
                  <Link
                    href={athleteProfileHref(s.athlete_user_id)}
                    className={profileNameLinkClass}
                  >
                    {s.first_name} {s.last_name}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {signalKindLabel(s.kind)} · {s.summary}
                  </p>
                </div>
                <CriticityBadge level={s.criticity} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/alerts"
          className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-700"
        >
          <p className="font-medium text-gray-900 dark:text-white">Alertes</p>
          <p className="mt-1 text-xs text-gray-500">Wellness & charge</p>
        </Link>
        <Link
          href="/messages"
          className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-700"
        >
          <p className="font-medium text-gray-900 dark:text-white">Messagerie</p>
          <p className="mt-1 text-xs text-gray-500">Annonces & threads</p>
        </Link>
        <Link
          href="/wellness/radar"
          className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-700"
        >
          <p className="font-medium text-gray-900 dark:text-white">Radar détail</p>
          <p className="mt-1 text-xs text-gray-500">Vue collective</p>
        </Link>
      </div>
    </div>
  );
}
