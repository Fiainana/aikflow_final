"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  membersListMembersByUser,
  membersCreateMember,
} from "@/api-client";
import type {
  UserWithRolesResponse,
  RoleEnum,
  MemberResponse,
} from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { configureApiClient } from "@/lib/api";
import { apiErrorMessage } from "@/lib/errors";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";

const CLUB_ROLES: { value: RoleEnum; label: string }[] = [
  { value: "ATHLETE", label: "Athlète" },
  { value: "COACH", label: "Coach" },
  { value: "ASSISTANT_COACH", label: "Coach adjoint" },
  { value: "STAFF", label: "Staff" },
  { value: "CLUB_ADMIN", label: "Admin club" },
  { value: "PARENT", label: "Parent" },
  { value: "HEALTH_PRO", label: "Pro santé" },
  { value: "MARKETPLACE_PRO", label: "Marketplace" },
];

const STAFF_ROLES = new Set(["COACH", "ASSISTANT_COACH", "STAFF", "CLUB_ADMIN"]);

export default function MembersPage() {
  const { isAuthenticated, isLoading: authLoading, isSuperAdmin } = useAuth();
  const [items, setItems] = useState<UserWithRolesResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<RoleEnum>("ATHLETE");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<MemberResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    configureApiClient();
    const { data, error: err } = await membersListMembersByUser({
      query: { active_only: false },
    });
    if (err) {
      setError(apiErrorMessage(err, "Impossible de charger les membres"));
      setItems([]);
    } else {
      setItems(data?.items ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated && !isSuperAdmin) load();
    else if (!authLoading) setLoading(false);
  }, [authLoading, isAuthenticated, isSuperAdmin, load]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setCreated(null);
    configureApiClient();
    const { data, error: err } = await membersCreateMember({
      body: {
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phone.trim() || null,
        role,
      },
    });
    setSubmitting(false);
    if (err || !data) {
      setError(apiErrorMessage(err, "Échec de la création du membre"));
      return;
    }
    setCreated(data);
    setEmail("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setRole("ATHLETE");
    await load();
  };

  const filtered = items.filter((row) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const hay = `${row.user.first_name} ${row.user.last_name} ${row.user.email} ${row.roles.join(" ")}`.toLowerCase();
    return hay.includes(q);
  });

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Membres
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Utilisateurs et rôles du club (multi-rôles possible)
          </p>
        </div>
        <Button
          size="sm"
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            setCreated(null);
          }}
        >
          {showForm ? "Fermer" : "Ajouter un membre"}
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400"
        >
          {error}
        </div>
      )}

      {created && (
        <div className="rounded-xl border border-brand-200 bg-brand-25 p-4 dark:border-brand-800 dark:bg-brand-500/10">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Membre enregistré : {created.user.first_name}{" "}
            {created.user.last_name} ({created.role.replace(/_/g, " ")})
          </p>
          {created.generated_password && (
            <p className="mt-2 text-sm text-brand-800 dark:text-brand-300">
              Mot de passe généré (à transmettre une seule fois) :{" "}
              <span className="font-mono break-all">
                {created.generated_password}
              </span>
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-3">
            {created.role === "ATHLETE" && (
              <Link
                href={`/members/${created.user.id}/athlete`}
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Compléter le profil athlète →
              </Link>
            )}
            {STAFF_ROLES.has(created.role) && (
              <Link
                href={`/members/${created.user.id}/staff`}
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Compléter le profil coach/staff →
              </Link>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
        >
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Nouveau membre
          </h2>
          <p className="text-xs text-gray-500">
            Nouvel email → compte + membership + profil. Email déjà présent avec
            un autre rôle → ajout du rôle uniquement.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>
                Prénom <span className="text-error-500">*</span>
              </Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <div>
              <Label>
                Nom <span className="text-error-500">*</span>
              </Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <div>
              <Label>
                Email <span className="text-error-500">*</span>
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>
                Rôle <span className="text-error-500">*</span>
              </Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as RoleEnum)}
                disabled={submitting}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                {CLUB_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Création…" : "Créer le membre"}
          </Button>
        </form>
      )}

      <div className="max-w-md">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un membre…"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
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
                  Rôles
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                  Profils
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filtered.map((row) => {
                const isAthlete = row.roles.includes("ATHLETE");
                const isStaff = row.roles.some((r) => STAFF_ROLES.has(r));
                return (
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
                            {r.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <div className="inline-flex flex-wrap justify-end gap-3">
                        {isAthlete && (
                          <Link
                            href={`/members/${row.user.id}/athlete`}
                            className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                          >
                            Athlète
                          </Link>
                        )}
                        {isStaff && (
                          <Link
                            href={`/members/${row.user.id}/staff`}
                            className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                          >
                            Coach / staff
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && !error && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-sm text-gray-500"
                  >
                    {items.length === 0
                      ? "Aucun membre. Ajoutez le premier athlète ou coach."
                      : "Aucun résultat pour cette recherche."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
