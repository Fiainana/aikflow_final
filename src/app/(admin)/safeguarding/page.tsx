"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  listSafeguardingReports,
  createSafeguardingReport,
  updateSafeguardingReport,
  categoryLabel,
  statusLabel,
  type SafeguardingReport,
  type ReportCategory,
  type ReportStatus,
} from "@/lib/api/safeguarding";
import { ApiError } from "@/lib/api/http";

const CATEGORIES: ReportCategory[] = [
  "CONCERN",
  "INCIDENT",
  "DISCLOSURE",
  "OTHER",
];

const STATUSES: ReportStatus[] = [
  "OPEN",
  "IN_REVIEW",
  "ESCALATED",
  "RESOLVED",
  "CLOSED",
];

function StatusBadge({ status }: { status: ReportStatus }) {
  const styles: Record<ReportStatus, string> = {
    OPEN: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
    IN_REVIEW:
      "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
    ESCALATED:
      "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
    RESOLVED:
      "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
    CLOSED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}

export default function SafeguardingPage() {
  const { isAuthenticated, isSuperAdmin, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<SafeguardingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<ReportCategory>("CONCERN");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listSafeguardingReports();
      setItems(data.items ?? []);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 403 || e.status === 401)) {
        setItems([]);
        setError(null);
      } else {
        setError(
          e instanceof ApiError
            ? e.message
            : "Impossible de charger les signalements",
        );
        setItems([]);
      }
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || isSuperAdmin) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [authLoading, isAuthenticated, isSuperAdmin, load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createSafeguardingReport({
        category,
        subject: subject.trim(),
        description: description.trim(),
        is_anonymous: isAnonymous,
      });
      setSubject("");
      setDescription("");
      setIsAnonymous(false);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Dépôt impossible",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(id: string, status: ReportStatus) {
    setUpdatingId(id);
    setError(null);
    try {
      await updateSafeguardingReport(id, { status });
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Mise à jour impossible",
      );
    } finally {
      setUpdatingId(null);
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
          Safeguarding
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Module club — sélectionnez un club.
        </p>
        <Link href="/admin/clubs" className="mt-4 inline-flex text-sm font-medium text-brand-600">
          Voir les clubs →
        </Link>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">
          Connectez-vous pour accéder au module safeguarding.
        </p>
        <Link href="/signin" className="mt-4 inline-flex text-sm font-medium text-brand-600">
          Connexion
        </Link>
      </div>
    );
  }

  const openCount = items.filter(
    (i) => i.status === "OPEN" || i.status === "IN_REVIEW",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
            Protection
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Safeguarding
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Signalements et suivi (MOD-02)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="h-11 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
        >
          Déposer un signalement
        </button>
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
            Ouverts / en cours
          </p>
          <p className="mt-1 text-2xl font-semibold text-error-600">
            {openCount}
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

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
        >
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Nouveau signalement
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReportCategory)}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c)}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-gray-300"
              />
              Anonyme
            </label>
          </div>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Sujet"
            required
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description factuelle…"
            required
            rows={4}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              Envoyer
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Signalements
          </h2>
          <p className="text-xs text-gray-500">
            La liste complète est réservée aux admins club. Tout staff peut
            déposer.
          </p>
        </div>
        {items.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-gray-500">
            Aucun signalement visible, ou droits insuffisants pour la liste.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((r) => (
              <li key={r.id} className="space-y-2 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {r.subject}
                    </p>
                    <p className="text-xs text-gray-500">
                      {categoryLabel(r.category)}
                      {r.is_anonymous ? " · anonyme" : ""} ·{" "}
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {r.description}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-xs text-gray-500">Statut :</label>
                  <select
                    value={r.status}
                    disabled={updatingId === r.id}
                    onChange={(e) =>
                      handleStatusChange(r.id, e.target.value as ReportStatus)
                    }
                    className="h-8 rounded border border-gray-300 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
