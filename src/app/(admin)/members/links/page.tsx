"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  profilesListLinks,
  profilesCreateLink,
  profilesDeleteLink,
  membersListMembersByUser,
} from "@/api-client";
import type {
  ParentAthleteLinkResponse,
  UserWithRolesResponse,
  ParentRelationshipEnum,
} from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { configureApiClient } from "@/lib/api";
import { apiErrorMessage } from "@/lib/errors";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";

const RELATIONS: { value: ParentRelationshipEnum; label: string }[] = [
  { value: "MOTHER", label: "Mère" },
  { value: "FATHER", label: "Père" },
  { value: "GUARDIAN", label: "Tuteur" },
  { value: "OTHER", label: "Autre" },
];

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white";

export default function ParentAthleteLinksPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [links, setLinks] = useState<ParentAthleteLinkResponse[]>([]);
  const [members, setMembers] = useState<UserWithRolesResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parentId, setParentId] = useState("");
  const [athleteId, setAthleteId] = useState("");
  const [relation, setRelation] = useState<ParentRelationshipEnum>("GUARDIAN");
  const [primary, setPrimary] = useState(true);
  const [legal, setLegal] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    configureApiClient();
    const [l, m] = await Promise.all([
      profilesListLinks(),
      membersListMembersByUser({ query: { active_only: true } }),
    ]);
    if (l.error) setError(apiErrorMessage(l.error, "Impossible de charger les liens"));
    else {
      setLinks(Array.isArray(l.data) ? l.data : []);
      setError(null);
    }
    setMembers(m.data?.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) load();
    else if (!authLoading) setLoading(false);
  }, [authLoading, isAuthenticated, load]);

  const parents = useMemo(
    () => members.filter((x) => x.roles.includes("PARENT")),
    [members]
  );
  const athletes = useMemo(
    () => members.filter((x) => x.roles.includes("ATHLETE")),
    [members]
  );

  const nameOf = (userId: string) => {
    const m = members.find((x) => x.user.id === userId);
    return m ? `${m.user.first_name} ${m.user.last_name}` : userId.slice(0, 8);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!parentId || !athleteId) return;
    setSubmitting(true);
    setError(null);
    configureApiClient();
    const { error: err } = await profilesCreateLink({
      body: {
        parent_user_id: parentId,
        athlete_user_id: athleteId,
        relationship: relation,
        is_primary_contact: primary,
        is_legal_guardian: legal,
      },
    });
    setSubmitting(false);
    if (err) {
      setError(apiErrorMessage(err, "Création du lien impossible"));
      return;
    }
    setParentId("");
    setAthleteId("");
    await load();
  };

  const handleDelete = async (linkId: string) => {
    if (!confirm("Supprimer ce lien parent ↔ athlète ?")) return;
    configureApiClient();
    const { error: err } = await profilesDeleteLink({
      path: { link_id: linkId },
    });
    if (err) {
      setError(apiErrorMessage(err, "Suppression impossible"));
      return;
    }
    await load();
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
        <Link href="/members" className="text-sm text-gray-500 hover:text-brand-600">
          ← Membres
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
          Liens parent ↔ athlète
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Relation légale / contact principal (mineurs)
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Nouveau lien</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Parent</Label>
            <select className={selectClass} value={parentId} onChange={(e) => setParentId(e.target.value)} required>
              <option value="">—</option>
              {parents.map((p) => (
                <option key={p.user.id} value={p.user.id}>
                  {p.user.first_name} {p.user.last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Athlète</Label>
            <select className={selectClass} value={athleteId} onChange={(e) => setAthleteId(e.target.value)} required>
              <option value="">—</option>
              {athletes.map((a) => (
                <option key={a.user.id} value={a.user.id}>
                  {a.user.first_name} {a.user.last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Relation</Label>
            <select className={selectClass} value={relation} onChange={(e) => setRelation(e.target.value as ParentRelationshipEnum)}>
              {RELATIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2 self-end pb-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={primary} onChange={(e) => setPrimary(e.target.checked)} />
              Contact principal
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={legal} onChange={(e) => setLegal(e.target.checked)} />
              Tuteur légal
            </label>
          </div>
        </div>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "Création…" : "Créer le lien"}
        </Button>
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-950">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Parent</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Athlète</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Relation</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {links.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 text-sm">{nameOf(l.parent_user_id)}</td>
                <td className="px-4 py-3 text-sm">{nameOf(l.athlete_user_id)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {l.relationship ?? "—"}
                  {l.is_primary_contact ? " · principal" : ""}
                  {l.is_legal_guardian ? " · tuteur" : ""}
                </td>
                <td className="px-4 py-3 text-right">
                  <button type="button" className="text-sm text-error-600 hover:underline" onClick={() => handleDelete(l.id)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {links.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-500">
                  Aucun lien enregistré
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
