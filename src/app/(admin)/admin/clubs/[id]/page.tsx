"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  adminorgsGetClubDetail,
  adminorgsUpdateClub,
} from "@/api-client";
import type {
  OrganizationDetailResponse,
  ErrorDetail,
  ClubMemberSummary,
} from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { configureApiClient } from "@/lib/api";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";

function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as ErrorDetail;
  if (typeof e?.detail === "string") return e.detail;
  return fallback;
}

export default function ClubDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = String(params?.id ?? "");
  const { isSuperAdmin, isLoading: authLoading, isAuthenticated } = useAuth();

  const [club, setClub] = useState<OrganizationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editSport, setEditSport] = useState("");
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    configureApiClient();
    const { data, error: err } = await adminorgsGetClubDetail({
      path: { org_id: orgId },
    });
    if (err || !data) {
      setError(apiErrorMessage(err, "Impossible de charger le club"));
      setClub(null);
    } else {
      setClub(data);
      setEditName(data.name);
      setEditSport(data.sport ?? "");
    }
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isSuperAdmin && orgId) {
      load();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, isSuperAdmin, orgId, load]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!club) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    configureApiClient();
    const { data, error: err } = await adminorgsUpdateClub({
      path: { org_id: club.id },
      body: {
        name: editName.trim() || null,
        sport: editSport.trim() || null,
      },
    });
    setSaving(false);
    if (err || !data) {
      setError(apiErrorMessage(err, "Échec de la mise à jour"));
      return;
    }
    setClub((prev) =>
      prev
        ? {
            ...prev,
            name: data.name,
            sport: data.sport,
            slug: data.slug,
            is_active: data.is_active,
          }
        : prev
    );
    setEditName(data.name);
    setEditSport(data.sport ?? "");
    setSuccess("Club mis à jour.");
  };

  const handleToggleActive = async () => {
    if (!club) return;
    const next = !club.is_active;
    const ok = window.confirm(
      next
        ? `Réactiver le club « ${club.name} » ?`
        : `Désactiver le club « ${club.name} » ? Les comptes club ne pourront plus se connecter normalement.`
    );
    if (!ok) return;

    setToggling(true);
    setError(null);
    setSuccess(null);
    configureApiClient();
    const { data, error: err } = await adminorgsUpdateClub({
      path: { org_id: club.id },
      body: { is_active: next },
    });
    setToggling(false);
    if (err || !data) {
      setError(apiErrorMessage(err, "Impossible de changer le statut"));
      return;
    }
    setClub((prev) => (prev ? { ...prev, is_active: data.is_active } : prev));
    setSuccess(data.is_active ? "Club activé." : "Club désactivé.");
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-error-700">
        Accès réservé au Super Administrateur.
      </div>
    );
  }

  if (!club) {
    return (
      <div className="space-y-4">
        <Link href="/admin/clubs" className="text-sm text-gray-500 hover:text-brand-600">
          ← Clubs
        </Link>
        <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-error-700">
          {error ?? "Club introuvable."}
        </div>
      </div>
    );
  }

  const members: ClubMemberSummary[] = club.members ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/clubs"
            className="text-sm text-gray-500 hover:text-brand-600"
          >
            ← Clubs
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {club.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-mono">{club.slug}</span>
            {club.sport ? ` · ${club.sport}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
              club.is_active
                ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {club.is_active ? "Actif" : "Inactif"}
          </span>
          <Button
            size="sm"
            variant="outline"
            type="button"
            disabled={toggling}
            onClick={handleToggleActive}
          >
            {toggling
              ? "…"
              : club.is_active
                ? "Désactiver"
                : "Activer"}
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="rounded-lg border border-brand-200 bg-brand-25 px-4 py-3 text-sm text-brand-800 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-300"
        >
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Édition */}
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
        >
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Modifier le club
          </h2>
          <div>
            <Label>Nom</Label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={saving}
            />
          </div>
          <div>
            <Label>Sport</Label>
            <Input
              value={editSport}
              onChange={(e) => setEditSport(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="text-xs text-gray-500">
            Créé le{" "}
            {club.created_at
              ? new Date(club.created_at).toLocaleString("fr-FR")
              : "—"}
          </div>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>

        {/* Infos + statut */}
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Identifiants
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase text-gray-500">ID</dt>
              <dd className="mt-0.5 font-mono text-gray-800 dark:text-gray-200 break-all">
                {club.id}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500">Slug</dt>
              <dd className="mt-0.5 font-mono text-gray-800 dark:text-gray-200">
                {club.slug}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-gray-500">
            La désactivation conserve les données (privacy-by-design) mais bloque
            l'usage opérationnel du tenant.
          </p>
          <button
            type="button"
            onClick={() => router.push("/admin/clubs")}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Retour à la liste
          </button>
        </div>
      </div>

      {/* Membres (si renvoyés par l'API détail) */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Membres du club
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({members.length})
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
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
                  Rôle
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {members.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    Aucun membre renvoyé par l'API (ou club encore vide).
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={`${m.user_id}-${m.role}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {m.first_name} {m.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {m.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {m.role?.replace(/_/g, " ")}
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
