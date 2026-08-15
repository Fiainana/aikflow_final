"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  teamsListTeamsEndpoint,
  wellnessRadar,
} from "@/api-client";
import type {
  TeamResponse,
  TeamWellnessRadarResponse,
  TeamWellnessRadarItem,
  ErrorDetail,
} from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { configureApiClient } from "@/lib/api";
import {
  athleteProfileHref,
  profileNameLinkClass,
} from "@/lib/profile-links";

type Criticality = "high" | "medium" | "low";

function criticalityOf(item: TeamWellnessRadarItem): Criticality {
  if (item.drop_alert) return "high";
  if (item.wellness_score != null && item.wellness_score < 2.5) return "high";
  if (item.wellness_score != null && item.wellness_score < 3.2) return "medium";
  if (!item.submitted) return "medium";
  return "low";
}

function CriticalityBadge({ level }: { level: Criticality }) {
  const styles = {
    high: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
    medium:
      "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
    low: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  };
  const labels = { high: "Élevée", medium: "Moyenne", low: "Basse" };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[level]}`}
    >
      {labels[level]}
    </span>
  );
}

export default function CoachBriefPage() {
  const { isAuthenticated, isSuperAdmin, isLoading: authLoading, user } =
    useAuth();
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [radar, setRadar] = useState<TeamWellnessRadarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    configureApiClient();
    const { data, error: err } = await teamsListTeamsEndpoint({
      query: { active_only: true },
    });
    if (err) {
      const e = err as ErrorDetail;
      setError(
        typeof e.detail === "string" ? e.detail : "Impossible de charger les équipes"
      );
      setTeams([]);
      return;
    }
    const items = data?.items ?? [];
    setTeams(items);
    if (items.length && !selectedTeamId) {
      setSelectedTeamId(items[0].id);
    }
  }, [selectedTeamId]);

  const loadRadar = useCallback(async (teamId: string) => {
    configureApiClient();
    const { data, error: err } = await wellnessRadar({
      path: { team_id: teamId },
    });
    if (err) {
      const e = err as ErrorDetail;
      setError(
        typeof e.detail === "string" ? e.detail : "Impossible de charger le radar"
      );
      setRadar(null);
      return;
    }
    setRadar(data ?? null);
    setError(null);
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
      setLoading(false);
    })();
  }, [authLoading, isAuthenticated, isSuperAdmin, loadTeams]);

  useEffect(() => {
    if (selectedTeamId && isAuthenticated && !isSuperAdmin) {
      loadRadar(selectedTeamId);
    }
  }, [selectedTeamId, isAuthenticated, isSuperAdmin, loadRadar]);

  const sortedItems = useMemo(() => {
    if (!radar?.items) return [];
    const order: Record<Criticality, number> = { high: 0, medium: 1, low: 2 };
    return [...radar.items].sort(
      (a, b) => order[criticalityOf(a)] - order[criticalityOf(b)]
    );
  }, [radar]);

  const counts = useMemo(() => {
    const c = { high: 0, medium: 0, low: 0 };
    sortedItems.forEach((i) => {
      c[criticalityOf(i)]++;
    });
    return c;
  }, [sortedItems]);

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
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Bonjour {firstName}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Signaux de l'équipe — cliquez un nom pour le profil
          </p>
        </div>
        {teams.length > 0 && (
          <select
            value={selectedTeamId ?? ""}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.age_category})
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase text-gray-500">Réponses</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {radar
              ? `${radar.submitted_count}/${radar.total_athletes}`
              : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase text-gray-500">Score moyen</p>
          <p className="mt-1 text-2xl font-semibold text-brand-600">
            {radar?.average_score != null
              ? radar.average_score.toFixed(1)
              : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-error-100 bg-error-50/50 p-4 dark:border-error-900/40 dark:bg-error-500/5">
          <p className="text-xs font-medium uppercase text-error-600">Criticité élevée</p>
          <p className="mt-1 text-2xl font-semibold text-error-600">{counts.high}</p>
        </div>
        <div className="rounded-xl border border-warning-100 bg-warning-50/50 p-4 dark:border-warning-900/40 dark:bg-warning-500/5">
          <p className="text-xs font-medium uppercase text-warning-700">Moyenne</p>
          <p className="mt-1 text-2xl font-semibold text-warning-600">
            {counts.medium}
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
            Athlètes — par criticité
          </h2>
        </div>
        {!selectedTeamId || teams.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-gray-500">
            Aucune équipe.{" "}
            <Link href="/teams" className="text-brand-600 font-medium">
              Créer une équipe
            </Link>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-gray-500">
            Pas encore de données wellness pour aujourd'hui.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {sortedItems.map((item) => {
              const level = criticalityOf(item);
              const rowClass =
                level === "high"
                  ? "criticality-high"
                  : level === "medium"
                    ? "criticality-medium"
                    : "criticality-low";
              return (
                <li
                  key={item.user_id}
                  className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${rowClass}`}
                >
                  <div className="min-w-0">
                    <Link
                      href={athleteProfileHref(item.user_id)}
                      className={profileNameLinkClass}
                    >
                      {item.first_name} {item.last_name}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {item.submitted
                        ? `Score ${item.wellness_score?.toFixed(1) ?? "—"}`
                        : "Non répondu"}
                      {item.drop_alert ? " · Alerte baisse" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <CriticalityBadge level={level} />
                    <span className="text-xs text-gray-400">
                      S{item.sleep_quality ?? "–"} E{item.energy_level ?? "–"}{" "}
                      M{item.muscle_soreness ?? "–"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/teams"
          className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-700"
        >
          <p className="font-medium text-gray-900 dark:text-white">Équipes</p>
          <p className="mt-1 text-xs text-gray-500">Effectifs & composition</p>
        </Link>
        <Link
          href="/members"
          className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-700"
        >
          <p className="font-medium text-gray-900 dark:text-white">Membres</p>
          <p className="mt-1 text-xs text-gray-500">Rôles du club</p>
        </Link>
        <Link
          href="/wellness/radar"
          className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-700"
        >
          <p className="font-medium text-gray-900 dark:text-white">Radar détail</p>
          <p className="mt-1 text-xs text-gray-500">Vue collective étendue</p>
        </Link>
      </div>
    </div>
  );
}
