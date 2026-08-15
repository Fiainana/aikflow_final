"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  membersListMembersByUser,
  membersCreateMember,
  membersAddRole,
  membersUpdateMember,
  membersRemoveMember,
} from "@/api-client";
import type {
  UserWithRolesResponse,
  RoleEnum,
  MemberResponse,
} from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { configureApiClient } from "@/lib/api";
import { apiErrorMessage } from "@/lib/errors";
import {
  profileHrefForRoles,
  profileNameLinkClass,
} from "@/lib/profile-links";
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

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function MembersPage() {
  const { isAuthenticated, isLoading: authLoading, isSuperAdmin } = useAuth();
  const [items, setItems] = useState<UserWithRolesResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<RoleEnum>("ATHLETE");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<MemberResponse | null>(null);

  const [roleModal, setRoleModal] = useState<UserWithRolesResponse | null>(null);
  const [extraRole, setExtraRole] = useState<RoleEnum>("PARENT");
  const [roleBusy, setRoleBusy] = useState(false);

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
    setSuccess(null);
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

  const handleAddRole = async (e: FormEvent) => {
    e.preventDefault();
    if (!roleModal) return;
    setRoleBusy(true);
    setError(null);
    configureApiClient();
    const { error: err } = await membersAddRole({
      body: { email: roleModal.user.email, role: extraRole },
    });
    setRoleBusy(false);
    if (err) {
      setError(apiErrorMessage(err, "Impossible d'ajouter le rôle"));
      return;
    }
    setSuccess(`Rôle ${extraRole} ajouté`);
    setRoleModal(null);
    await load();
  };

  const handleToggleMembership = async (m: MemberResponse) => {
    configureApiClient();
    const { error: err } = await membersUpdateMember({
      path: { membership_id: m.id },
      body: { is_active: !m.is_active },
    });
    if (err) {
      setError(apiErrorMessage(err, "Mise à jour impossible"));
      return;
    }
    setSuccess(m.is_active ? "Rôle désactivé" : "Rôle activé");
    await load();
  };

  const handleRemoveMembership = async (m: MemberResponse) => {
    if (!confirm(`Retirer le rôle ${m.role} pour ${m.user.email} ?`)) return;
    configureApiClient();
    const { error: err } = await membersRemoveMember({
      path: { membership_id: m.id },
    });
    if (err) {
      setError(apiErrorMessage(err, "Suppression impossible"));
      return;
    }
    setSuccess("Rôle retiré");
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Membres</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Rôles, activation et profils — cliquez un nom pour le détail
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
        <div role="alert" className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="rounded-lg border border-brand-200 bg-brand-25 px-4 py-3 text-sm text-brand-800">
          {success}
        </div>
      )}

      {created && (
        <div className="rounded-xl border border-brand-200 bg-brand-25 p-4 dark:border-brand-800 dark:bg-brand-500/10">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Membre enregistré : {created.user.first_name} {created.user.last_name} ({created.role})
          </p>
          {created.generated_password && (
            <p className="mt-2 text-sm text-brand-800">
              Mot de passe généré :{" "}
              <span className="font-mono break-all">{created.generated_password}</span>
            </p>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Nouveau membre</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Prénom *</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required disabled={submitting} />
            </div>
            <div>
              <Label>Nom *</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required disabled={submitting} />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={submitting} />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={submitting} />
            </div>
            <div className="sm:col-span-2">
              <Label>Rôle *</Label>
              <select className={selectClass} value={role} onChange={(e) => setRole(e.target.value as RoleEnum)} disabled={submitting}>
                {CLUB_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Création…" : "Créer le membre"}
          </Button>
        </form>
      )}

      {roleModal && (
        <form onSubmit={handleAddRole} className="space-y-4 rounded-xl border border-brand-200 bg-brand-25 p-5 dark:border-brand-800 dark:bg-brand-500/10">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Ajouter un rôle — {roleModal.user.first_name} {roleModal.user.last_name}
          </h2>
          <select className={selectClass} value={extraRole} onChange={(e) => setExtraRole(e.target.value as RoleEnum)} disabled={roleBusy}>
            {CLUB_ROLES.filter((r) => !roleModal.roles.includes(r.value)).map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={roleBusy}>
              {roleBusy ? "…" : "Ajouter"}
            </Button>
            <button type="button" className="text-sm text-gray-500" onClick={() => setRoleModal(null)}>
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="max-w-md">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un membre…" />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Rôles</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filtered.map((row) => {
                const isAthlete = row.roles.includes("ATHLETE");
                const isStaff = row.roles.some((r) => STAFF_ROLES.has(r));
                const isParent = row.roles.includes("PARENT");
                const isHealth = row.roles.includes("HEALTH_PRO");
                const href = profileHrefForRoles(row.user.id, row.roles);
                const displayName = `${row.user.first_name} ${row.user.last_name}`;
                return (
                  <tr key={row.user.id} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-sm">
                      {href ? (
                        <Link href={href} className={profileNameLinkClass}>{displayName}</Link>
                      ) : (
                        <span className="font-medium text-gray-900 dark:text-white">{displayName}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.user.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {row.memberships.map((m) => (
                          <div key={m.id} className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              m.is_active
                                ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
                                : "bg-gray-100 text-gray-500"
                            }`}>
                              {m.role.replace(/_/g, " ")}{!m.is_active ? " (off)" : ""}
                            </span>
                            <button type="button" className="text-[11px] text-gray-500 hover:underline" onClick={() => handleToggleMembership(m)}>
                              {m.is_active ? "Désactiver" : "Activer"}
                            </button>
                            <button type="button" className="text-[11px] text-error-600 hover:underline" onClick={() => handleRemoveMembership(m)}>
                              Retirer
                            </button>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <div className="inline-flex flex-wrap justify-end gap-2">
                        <button type="button" className="font-medium text-brand-600 hover:underline" onClick={() => {
                          setRoleModal(row);
                          const available = CLUB_ROLES.find((r) => !row.roles.includes(r.value));
                          if (available) setExtraRole(available.value);
                        }}>
                          + Rôle
                        </button>
                        {isAthlete && (
                          <Link href={`/members/${row.user.id}/athlete`} className="font-medium text-brand-600 hover:underline">Athlète</Link>
                        )}
                        {isStaff && (
                          <Link href={`/members/${row.user.id}/staff`} className="font-medium text-brand-600 hover:underline">Staff</Link>
                        )}
                        {isParent && (
                          <Link href={`/members/${row.user.id}/parent`} className="font-medium text-brand-600 hover:underline">Parent</Link>
                        )}
                        {isHealth && (
                          <Link href={`/members/${row.user.id}/health-pro`} className="font-medium text-brand-600 hover:underline">Santé</Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && !error && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-500">
                    {items.length === 0 ? "Aucun membre." : "Aucun résultat."}
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
