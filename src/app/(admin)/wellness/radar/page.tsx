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
} from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { configureApiClient } from "@/lib/api";
import { apiErrorMessage } from "@/lib/errors";
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

export default function WellnessRadarPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [radar, setRadar] = useState<TeamWellnessRadarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    configureApiClient();
    const { data, error: err } = await teamsListTeamsEndpoint({
      query: { active_only: true },
    });
    if (err) {
      setError(apiErrorMessage(err, "Impossible de charger les équipes"));
      return;
    }
    const items = data?.items ?? [];
    setTeams(items);
    if (items.length && !teamId) setTeamId(items[0].id);
  }, [teamId]);

  const loadRadar = useCallback(async (id: string) => {
    configureApiClient();
    const { data, error: err } = await wellnessRadar({
      path: { team_id: id },
    });
    if (err) {
      setError(apiErrorMessage(err, "Impossible de charger le radar"));
      setRadar(null);
      return;
    }
    setRadar(data ?? null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      (async () => {
        setLoading(true);
        await loadTeams();
        setLoading(false);
      })();
    } else if (!authLoading) setLoading(false);
  }, [authLoading, isAuthenticated, loadTeams]);

  useEffect(() => {
    if (teamId && isAuthenticated) loadRadar(teamId);
  }, [teamId, isAuthenticated, loadRadar]);

  const sorted = useMemo(() => {
    if (!radar?.items) return [];
    const order: Record<Criticality, number> = { high: 0, medium: 1, low: 2 };
    return [...radar.items].sort(
      (a, b) => order[criticalityOf(a)] - order[criticalityOf(b)]
    );
  }, [radar]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Radar wellness
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Vue collective du jour — scores, alertes baisse, non-réponses
          </p>
        </div>
        {teams.length > 0 && (
          <select
            value={teamId ?? ""}
            onChange={(e) => setTeamId(e.target.value)}
            className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.age_category})
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}

      {radar && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs uppercase text-gray-500">Date</p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-white">{radar.checkin_date}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs uppercase text-gray-500">Réponses</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
              {radar.submitted_count}/{radar.total_athletes}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs uppercase text-gray-500">Score moyen</p>
            <p className="mt-1 text-2xl font-semibold text-brand-600">
              {radar.average_score != null ? radar.average_score.toFixed(1) : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-error-100 bg-error-50/50 p-4 dark:border-error-900/40">
            <p className="text-xs uppercase text-error-600">Alertes baisse</p>
            <p className="mt-1 text-2xl font-semibold text-error-600">{radar.drop_alerts_count}</p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-950">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Athlète</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">S / E / M / Stress / Mot</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Statut</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Détail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {sorted.map((item) => {
              const level = criticalityOf(item);
              return (
                <tr key={item.user_id}>
                  <td className="px-4 py-3 text-sm">
                    <Link href={athleteProfileHref(item.user_id)} className={profileNameLinkClass}>
                      {item.first_name} {item.last_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {item.wellness_score != null ? item.wellness_score.toFixed(1) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {item.sleep_quality ?? "–"}/{item.energy_level ?? "–"}/{" "}
                    {item.muscle_soreness ?? "–"}/{item.stress_level ?? "–"}/{" "}
                    {item.motivation ?? "–"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        level === "high"
                          ? "bg-error-50 text-error-700"
                          : level === "medium"
                            ? "bg-warning-50 text-warning-700"
                            : "bg-brand-50 text-brand-700"
                      }`}
                    >
                      {!item.submitted
                        ? "Non répondu"
                        : item.drop_alert
                          ? "Alerte baisse"
                          : level === "high"
                            ? "Critique"
                            : "OK"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <Link
                      href={`/wellness/athlete/${item.user_id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      Voir
                    </Link>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                  {teams.length === 0
                    ? "Aucune équipe active."
                    : "Pas de données wellness pour aujourd'hui."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
