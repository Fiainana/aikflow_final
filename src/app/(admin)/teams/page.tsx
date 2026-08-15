"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { teamsListTeamsEndpoint } from "@/api-client";
import type { TeamResponse, ErrorDetail } from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { configureApiClient } from "@/lib/api";

export default function TeamsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    configureApiClient();
    const { data, error: err } = await teamsListTeamsEndpoint({
      query: { active_only: true },
    });
    if (err) {
      const e = err as ErrorDetail;
      setError(typeof e.detail === "string" ? e.detail : "Erreur de chargement");
      setTeams([]);
    } else {
      setTeams(data?.items ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Équipes
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Composition et catégories du club
        </p>
      </div>
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {t.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t.age_category} · {t.gender}
              {t.season ? ` · ${t.season}` : ""}
            </p>
            <p className="mt-2 text-xs text-brand-600">
              {t.members_count ?? 0} membre(s)
            </p>
          </div>
        ))}
        {teams.length === 0 && !error && (
          <p className="col-span-full text-center text-sm text-gray-500 py-12">
            Aucune équipe active.{" "}
            <Link href="/" className="text-brand-600 font-medium">
              Retour au brief
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
