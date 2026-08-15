"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminorgsListClubs, adminorgsUpdateClub } from "@/api-client";
import type { OrganizationResponse, ErrorDetail } from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { configureApiClient } from "@/lib/api";
import Button from "@/components/ui/button/Button";

function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as ErrorDetail;
  if (typeof e?.detail === "string") return e.detail;
  return fallback;
}

export default function AdminClubsPage() {
  const { isSuperAdmin, isLoading: authLoading, isAuthenticated } = useAuth();
  const [clubs, setClubs] = useState<OrganizationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    configureApiClient();
    const { data, error: err } = await adminorgsListClubs();
    if (err) {
      setError(apiErrorMessage(err, "Impossible de charger les clubs"));
      setClubs([]);
    } else {
      setClubs(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isSuperAdmin) {
      load();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, isSuperAdmin, load]);

  const toggleActive = async (club: OrganizationResponse) => {
    const next = !club.is_active;
    const ok = window.confirm(
      next
        ? `Activer « ${club.name} » ?`
        : `Désactiver « ${club.name} » ?`
    );
    if (!ok) return;

    setBusyId(club.id);
    setError(null);
    configureApiClient();
    const { data, error: err } = await adminorgsUpdateClub({
      path: { org_id: club.id },
      body: { is_active: next },
    });
    setBusyId(null);
    if (err || !data) {
      setError(apiErrorMessage(err, "Échec du changement de statut"));
      return;
    }
    setClubs((prev) =>
      prev.map((c) => (c.id === data.id ? { ...c, ...data } : c))
    );
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
        Accès réservé au Super Administrateur Aikflow.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Clubs
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestion des organisations (Super Admin) — liste, détail, édition,
            activation
          </p>
        </div>
        <Link href="/admin/clubs/new">
          <Button size="sm" type="button">
            Créer un club
          </Button>
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400"
        >
          {error}
          <button
            type="button"
            onClick={load}
            className="ml-3 underline font-medium"
          >
            Réessayer
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Nom
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Sport
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Créé le
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {clubs.length === 0 && !error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-gray-500"
                  >
                    Aucun club. Créez le premier club pour démarrer.
                  </td>
                </tr>
              ) : (
                clubs.map((club) => (
                  <tr
                    key={club.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      <Link
                        href={`/admin/clubs/${club.id}`}
                        className="hover:text-brand-600 dark:hover:text-brand-400"
                      >
                        {club.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {club.sport || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                      {club.slug}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          club.is_active
                            ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {club.is_active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {club.created_at
                        ? new Date(club.created_at).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-3">
                        <Link
                          href={`/admin/clubs/${club.id}`}
                          className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                        >
                          Détail
                        </Link>
                        <button
                          type="button"
                          disabled={busyId === club.id}
                          onClick={() => toggleActive(club)}
                          className="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {busyId === club.id
                            ? "…"
                            : club.is_active
                              ? "Désactiver"
                              : "Activer"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
