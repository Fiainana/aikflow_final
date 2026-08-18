"use client";

/**
 * Alertes opérationnelles (backend /api/v1/alerts).
 * Remplace l’ancienne page démo UI.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  listOrgAlerts,
  severityLabel,
  alertTypeLabel,
  type AlertItem,
  type AlertSeverity,
} from "@/lib/api/alerts";
import { ApiError } from "@/lib/api/http";
import {
  athleteProfileHref,
  profileNameLinkClass,
} from "@/lib/profile-links";

function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const styles: Record<AlertSeverity, string> = {
    CRITICAL:
      "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
    WARNING:
      "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
    INFO: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[severity]}`}
    >
      {severityLabel(severity)}
    </span>
  );
}

export default function AlertsPage() {
  const { isAuthenticated, isSuperAdmin, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<AlertItem[]>([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listOrgAlerts({ days });
      setItems(data.items ?? []);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : "Impossible de charger les alertes";
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || isSuperAdmin) {
      setLoading(false);
      return;
    }
    void load();
  }, [authLoading, isAuthenticated, isSuperAdmin, load]);

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
          Alertes club
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Disponible dans le contexte d’un club, pas en Super Admin plateforme.
        </p>
        <Link
          href="/admin/clubs"
          className="mt-4 inline-flex text-sm font-medium text-brand-600"
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
          Connectez-vous pour voir les alertes.
        </p>
        <Link href="/signin" className="mt-4 inline-flex text-sm font-medium text-brand-600">
          Connexion
        </Link>
      </div>
    );
  }

  const critical = items.filter((i) => i.severity === "CRITICAL").length;
  const warning = items.filter((i) => i.severity === "WARNING").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
            Monitoring
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Alertes
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Chutes wellness et charges élevées — {days} derniers jours
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        >
          <option value={3}>3 jours</option>
          <option value={7}>7 jours</option>
          <option value={14}>14 jours</option>
          <option value={30}>30 jours</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase text-gray-500">Total</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {items.length}
          </p>
        </div>
        <div className="rounded-xl border border-error-100 bg-error-50/50 p-4 dark:border-error-900/40 dark:bg-error-500/5">
          <p className="text-xs font-medium uppercase text-error-600">
            Critiques
          </p>
          <p className="mt-1 text-2xl font-semibold text-error-600">
            {critical}
          </p>
        </div>
        <div className="rounded-xl border border-warning-100 bg-warning-50/50 p-4 dark:border-warning-900/40 dark:bg-warning-500/5">
          <p className="text-xs font-medium uppercase text-warning-700">
            Attention
          </p>
          <p className="mt-1 text-2xl font-semibold text-warning-600">
            {warning}
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
            Liste des alertes
          </h2>
        </div>
        {items.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-gray-500">
            Aucune alerte sur la période sélectionnée.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((item, idx) => (
              <li
                key={`${item.source_id ?? idx}-${item.on_date}-${item.alert_type}`}
                className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={athleteProfileHref(item.athlete.id)}
                      className={profileNameLinkClass}
                    >
                      {item.athlete.first_name} {item.athlete.last_name}
                    </Link>
                    <SeverityBadge severity={item.severity} />
                    <span className="text-xs text-gray-400">
                      {alertTypeLabel(item.alert_type)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {item.message}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {item.on_date}
                    {item.value != null ? ` · valeur ${item.value}` : ""}
                    {item.previous_value != null
                      ? ` (préc. ${item.previous_value})`
                      : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-3">
        <Link
          href="/"
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ← Brief du jour
        </Link>
      </div>
    </div>
  );
}
