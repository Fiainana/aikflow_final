"use client";

import { useCallback, useEffect, useState } from "react";
import { membersListMembersByUser } from "@/api-client";
import type { UserWithRolesResponse, ErrorDetail } from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { configureApiClient } from "@/lib/api";

export default function MembersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<UserWithRolesResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    configureApiClient();
    const { data, error: err } = await membersListMembersByUser({
      query: { active_only: true },
    });
    if (err) {
      const e = err as ErrorDetail;
      setError(typeof e.detail === "string" ? e.detail : "Erreur de chargement");
      setItems([]);
    } else {
      setItems(data?.items ?? []);
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
          Membres
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Utilisateurs et rôles dans le club
        </p>
      </div>
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-950">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Nom
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Rôles
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {items.map((row) => (
              <tr key={row.user.id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  {row.user.first_name} {row.user.last_name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {row.user.email}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {row.roles.map((r) => (
                      <span
                        key={r}
                        className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && !error && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-12 text-center text-sm text-gray-500"
                >
                  Aucun membre
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
