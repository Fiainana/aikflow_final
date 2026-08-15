"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  privacyListConsents,
  privacyCreateConsent,
  privacyExportMyData,
  privacyDeleteMyAccount,
} from "@/api-client";
import type { ConsentResponse, ConsentPurposeEnum } from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { configureApiClient } from "@/lib/api";
import { apiErrorMessage } from "@/lib/errors";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";

const PURPOSES: { value: ConsentPurposeEnum; label: string }[] = [
  { value: "ACCOUNT", label: "Compte" },
  { value: "TRAINING_DATA", label: "Données d'entraînement" },
  { value: "HEALTH_SHARE", label: "Partage santé" },
  { value: "MARKETING", label: "Marketing" },
  { value: "ANALYTICS", label: "Analytics" },
  { value: "PARENTAL", label: "Consentement parental" },
];

export default function PrivacyPage() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [consents, setConsents] = useState<ConsentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<ConsentPurposeEnum>("TRAINING_DATA");
  const [granted, setGranted] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    configureApiClient();
    const { data, error: err } = await privacyListConsents();
    if (err) {
      setError(apiErrorMessage(err, "Impossible de charger les consentements"));
      setConsents([]);
    } else {
      setConsents(Array.isArray(data) ? data : []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) load();
    else if (!authLoading) setLoading(false);
  }, [authLoading, isAuthenticated, load]);

  const handleConsent = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    configureApiClient();
    const { error: err } = await privacyCreateConsent({
      body: { purpose, granted, version: "1.0" },
    });
    setSubmitting(false);
    if (err) {
      setError(apiErrorMessage(err, "Enregistrement impossible"));
      return;
    }
    setSuccess("Consentement enregistré");
    await load();
  };

  const handleExport = async () => {
    setError(null);
    setSuccess(null);
    configureApiClient();
    const { data, error: err } = await privacyExportMyData();
    if (err || !data) {
      setError(apiErrorMessage(err, "Export impossible"));
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aikflow-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccess("Export téléchargé");
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Demander la suppression de votre compte ? Cette action est irréversible après la période de purge."
      )
    ) {
      return;
    }
    configureApiClient();
    const { data, error: err } = await privacyDeleteMyAccount();
    if (err) {
      setError(apiErrorMessage(err, "Suppression impossible"));
      return;
    }
    setSuccess(data?.message ?? "Demande de suppression enregistrée");
    await logout();
  };

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
          Confidentialité & RGPD
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Consentements, export de données et suppression de compte
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="rounded-lg border border-brand-200 bg-brand-25 px-4 py-3 text-sm text-brand-800">
          {success}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Historique des consentements
        </h2>
        <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
          {consents.map((c) => (
            <li key={c.id} className="flex justify-between py-2 text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                {PURPOSES.find((p) => p.value === c.purpose)?.label ?? c.purpose}{" "}
                · v{c.version}
              </span>
              <span className={c.granted ? "text-brand-600" : "text-gray-500"}>
                {c.granted ? "Accordé" : "Refusé"} ·{" "}
                {new Date(c.created_at).toLocaleDateString("fr-FR")}
              </span>
            </li>
          ))}
          {consents.length === 0 && (
            <li className="py-6 text-center text-sm text-gray-500">
              Aucun consentement enregistré
            </li>
          )}
        </ul>
      </section>

      <form
        onSubmit={handleConsent}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
      >
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Enregistrer un consentement
        </h2>
        <div>
          <Label>Finalité</Label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as ConsentPurposeEnum)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            disabled={submitting}
          >
            {PURPOSES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={granted}
            onChange={(e) => setGranted(e.target.checked)}
          />
          Consentement accordé
        </label>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>

      <section className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <Button type="button" size="sm" onClick={handleExport}>
          Exporter mes données (JSON)
        </Button>
        <button
          type="button"
          onClick={handleDelete}
          className="h-10 rounded-lg border border-error-200 px-4 text-sm font-medium text-error-600 hover:bg-error-50"
        >
          Demander la suppression du compte
        </button>
      </section>
    </div>
  );
}
