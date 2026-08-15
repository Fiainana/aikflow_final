"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  wellnessAthleteToday,
  sessionrpeAthleteToday,
} from "@/api-client";
import type {
  WellnessTodayStatus,
  SessionRpeTodayStatus,
} from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { configureApiClient } from "@/lib/api";
import { apiErrorMessage } from "@/lib/errors";
import { athleteProfileHref } from "@/lib/profile-links";

export default function AthleteWellnessDetailPage() {
  const params = useParams();
  const userId = String(params.userId ?? "");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [wellness, setWellness] = useState<WellnessTodayStatus | null>(null);
  const [rpe, setRpe] = useState<SessionRpeTodayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    configureApiClient();
    const [w, r] = await Promise.all([
      wellnessAthleteToday({ path: { user_id: userId } }),
      sessionrpeAthleteToday({ path: { user_id: userId } }),
    ]);
    if (w.error && r.error) {
      setError(apiErrorMessage(w.error, "Impossible de charger les données"));
    } else {
      setError(null);
    }
    setWellness(w.data ?? null);
    setRpe(r.data ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) load();
    else if (!authLoading) setLoading(false);
  }, [authLoading, isAuthenticated, load]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const checkin = wellness?.checkin;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/wellness/radar"
          className="text-sm text-gray-500 hover:text-brand-600"
        >
          ← Radar wellness
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
          Wellness & charge — athlète
        </h1>
        <Link
          href={athleteProfileHref(userId)}
          className="mt-1 inline-block text-sm font-medium text-brand-600 hover:underline"
        >
          Voir le profil athlète →
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Check-in du jour
          </h2>
          {!wellness ? (
            <p className="mt-3 text-sm text-gray-500">Données indisponibles</p>
          ) : (
            <div className="mt-4 space-y-3 text-sm">
              <p>
                <span className="text-gray-500">Statut : </span>
                <strong className="text-gray-900 dark:text-white">
                  {wellness.submitted ? "Répondu" : "Non répondu"}
                </strong>
                {checkin?.drop_alert && (
                  <span className="ml-2 text-error-600">· Alerte baisse</span>
                )}
              </p>
              <p className="text-gray-500">Date : {wellness.checkin_date}</p>
              {checkin && (
                <>
                  <p>
                    Score :{" "}
                    <span className="text-xl font-semibold text-brand-600">
                      {checkin.wellness_score.toFixed(1)}
                    </span>
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {(
                      [
                        ["Sommeil", checkin.sleep_quality],
                        ["Énergie", checkin.energy_level],
                        ["Courbatures", checkin.muscle_soreness],
                        ["Stress", checkin.stress_level],
                        ["Motivation", checkin.motivation],
                      ] as const
                    ).map(([label, val]) => (
                      <div
                        key={label}
                        className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-950"
                      >
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {val}
                        </p>
                      </div>
                    ))}
                  </div>
                  {checkin.notes && (
                    <p className="text-gray-500">Notes : {checkin.notes}</p>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Session RPE du jour
          </h2>
          {!rpe ? (
            <p className="mt-3 text-sm text-gray-500">Données indisponibles</p>
          ) : (
            <div className="mt-4 space-y-3 text-sm">
              <p>
                <span className="text-gray-500">Charge du jour : </span>
                <strong className="text-xl text-brand-600">{rpe.daily_load}</strong>
              </p>
              <p className="text-gray-500">
                {rpe.sessions_count} séance(s) · {rpe.total_duration_minutes} min
              </p>
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {rpe.logs.map((log) => (
                  <li key={log.id} className="flex justify-between py-2">
                    <span className="text-gray-700 dark:text-gray-300">
                      {log.session_date} · {log.duration_minutes} min
                      {log.notes ? ` · ${log.notes}` : ""}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      RPE {log.rpe_score} (load {log.session_load})
                    </span>
                  </li>
                ))}
                {rpe.logs.length === 0 && (
                  <li className="py-4 text-gray-500">Aucune séance aujourd'hui</li>
                )}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
