"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  teamsGetTeamEndpoint,
  teamsUpdateTeamEndpoint,
  teamsAddMemberEndpoint,
  teamsRemoveMemberEndpoint,
  membersListMembersByUser,
} from "@/api-client";
import type {
  TeamDetailResponse,
  AgeCategoryEnum,
  TeamGenderEnum,
  TeamMemberRoleEnum,
  UserWithRolesResponse,
} from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { configureApiClient } from "@/lib/api";
import { apiErrorMessage, emptyToNull, emptyToNumber } from "@/lib/errors";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";

const AGE_CATEGORIES: AgeCategoryEnum[] = [
  "U7",
  "U9",
  "U11",
  "U13",
  "U15",
  "U17",
  "U19",
  "U21",
  "SENIOR",
  "OTHER",
];

const GENDERS: { value: TeamGenderEnum; label: string }[] = [
  { value: "MALE", label: "Masculin" },
  { value: "FEMALE", label: "Féminin" },
  { value: "MIXED", label: "Mixte" },
];

const TEAM_ROLES: { value: TeamMemberRoleEnum; label: string }[] = [
  { value: "ATHLETE", label: "Athlète" },
  { value: "COACH", label: "Coach" },
  { value: "ASSISTANT_COACH", label: "Adjoint" },
  { value: "STAFF", label: "Staff" },
];

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = String(params?.id ?? "");
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [team, setTeam] = useState<TeamDetailResponse | null>(null);
  const [clubUsers, setClubUsers] = useState<UserWithRolesResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [ageCategory, setAgeCategory] = useState<AgeCategoryEnum>("U15");
  const [gender, setGender] = useState<TeamGenderEnum>("MALE");
  const [season, setSeason] = useState("");
  const [description, setDescription] = useState("");
  const [maxRoster, setMaxRoster] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const [addUserId, setAddUserId] = useState("");
  const [addRole, setAddRole] = useState<TeamMemberRoleEnum>("ATHLETE");
  const [addJersey, setAddJersey] = useState("");
  const [addCaptain, setAddCaptain] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const rosterUserIds = useMemo(
    () => new Set((team?.members ?? []).map((m) => m.user_id)),
    [team]
  );

  const candidates = useMemo(
    () => clubUsers.filter((u) => !rosterUserIds.has(u.user.id)),
    [clubUsers, rosterUserIds]
  );

  const load = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    configureApiClient();

    const [teamRes, membersRes] = await Promise.all([
      teamsGetTeamEndpoint({ path: { team_id: teamId } }),
      membersListMembersByUser({ query: { active_only: true } }),
    ]);

    if (teamRes.error || !teamRes.data) {
      setError(apiErrorMessage(teamRes.error, "Équipe introuvable"));
      setTeam(null);
    } else {
      const t = teamRes.data;
      setTeam(t);
      setName(t.name);
      setAgeCategory(t.age_category);
      setGender(t.gender);
      setSeason(t.season ?? "");
      setDescription(t.description ?? "");
      setMaxRoster(t.max_roster_size != null ? String(t.max_roster_size) : "");
      setIsActive(t.is_active);
    }

    if (membersRes.data) {
      setClubUsers(membersRes.data.items ?? []);
    }

    setLoading(false);
  }, [teamId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && teamId) load();
    else if (!authLoading) setLoading(false);
  }, [authLoading, isAuthenticated, teamId, load]);

  const handleSaveTeam = async (e: FormEvent) => {
    e.preventDefault();
    if (!team) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    configureApiClient();
    const { data, error: err } = await teamsUpdateTeamEndpoint({
      path: { team_id: team.id },
      body: {
        name: name.trim() || null,
        age_category: ageCategory,
        gender,
        season: emptyToNull(season),
        description: emptyToNull(description),
        max_roster_size: emptyToNumber(maxRoster),
        is_active: isActive,
      },
    });
    setSaving(false);
    if (err || !data) {
      setError(apiErrorMessage(err, "Échec de la mise à jour"));
      return;
    }
    setSuccess("Équipe mise à jour.");
    await load();
  };

  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!team || !addUserId) return;
    setAdding(true);
    setError(null);
    setSuccess(null);
    configureApiClient();
    const { error: err } = await teamsAddMemberEndpoint({
      path: { team_id: team.id },
      body: {
        user_id: addUserId,
        role_in_team: addRole,
        jersey_number: emptyToNumber(addJersey),
        is_captain: addCaptain,
      },
    });
    setAdding(false);
    if (err) {
      setError(apiErrorMessage(err, "Impossible d'ajouter le membre"));
      return;
    }
    setAddUserId("");
    setAddJersey("");
    setAddCaptain(false);
    setAddRole("ATHLETE");
    setSuccess("Membre ajouté à l'effectif.");
    await load();
  };

  const handleRemove = async (memberId: string, label: string) => {
    if (!team) return;
    if (!window.confirm(`Retirer ${label} de l'équipe ?`)) return;
    setRemovingId(memberId);
    setError(null);
    configureApiClient();
    const { error: err } = await teamsRemoveMemberEndpoint({
      path: { team_id: team.id, member_id: memberId },
    });
    setRemovingId(null);
    if (err) {
      setError(apiErrorMessage(err, "Impossible de retirer le membre"));
      return;
    }
    setSuccess("Membre retiré.");
    await load();
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="space-y-4">
        <Link href="/teams" className="text-sm text-gray-500 hover:text-brand-600">
          ← Équipes
        </Link>
        <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-error-700">
          {error ?? "Équipe introuvable."}
        </div>
      </div>
    );
  }

  const members = team.members ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/teams" className="text-sm text-gray-500 hover:text-brand-600">
          ← Équipes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
          {team.name}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {team.age_category} · {team.gender}
          {team.season ? ` · ${team.season}` : ""} ·{" "}
          {members.length} dans l'effectif
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="rounded-lg border border-brand-200 bg-brand-25 px-4 py-3 text-sm text-brand-800 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-300">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSaveTeam}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
      >
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Paramètres de l'équipe
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={saving} />
          </div>
          <div>
            <Label>Catégorie</Label>
            <select className={selectClass} value={ageCategory} onChange={(e) => setAgeCategory(e.target.value as AgeCategoryEnum)} disabled={saving}>
              {AGE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Genre</Label>
            <select className={selectClass} value={gender} onChange={(e) => setGender(e.target.value as TeamGenderEnum)} disabled={saving}>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Saison</Label>
            <Input value={season} onChange={(e) => setSeason(e.target.value)} disabled={saving} />
          </div>
          <div>
            <Label>Effectif max</Label>
            <Input type="number" value={maxRoster} onChange={(e) => setMaxRoster(e.target.value)} disabled={saving} />
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} disabled={saving} />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="team-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={saving}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <label htmlFor="team-active" className="text-sm text-gray-700 dark:text-gray-300">
              Équipe active
            </label>
          </div>
        </div>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "…" : "Enregistrer"}
        </Button>
      </form>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Effectif
          </h2>
        </div>

        <form
          onSubmit={handleAddMember}
          className="grid gap-3 border-b border-gray-200 p-5 sm:grid-cols-2 lg:grid-cols-5 dark:border-gray-800"
        >
          <div className="lg:col-span-2">
            <Label>Membre du club</Label>
            <select
              className={selectClass}
              value={addUserId}
              onChange={(e) => setAddUserId(e.target.value)}
              disabled={adding}
              required
            >
              <option value="">Sélectionner…</option>
              {candidates.map((u) => (
                <option key={u.user.id} value={u.user.id}>
                  {u.user.first_name} {u.user.last_name} ({u.user.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Rôle dans l'équipe</Label>
            <select
              className={selectClass}
              value={addRole}
              onChange={(e) => setAddRole(e.target.value as TeamMemberRoleEnum)}
              disabled={adding}
            >
              {TEAM_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>N° maillot</Label>
            <Input type="number" value={addJersey} onChange={(e) => setAddJersey(e.target.value)} disabled={adding} />
          </div>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={addCaptain}
                onChange={(e) => setAddCaptain(e.target.checked)}
                disabled={adding}
                className="h-4 w-4 rounded border-gray-300 text-brand-500"
              />
              Capitaine
            </label>
            <Button type="submit" size="sm" disabled={adding || !addUserId}>
              {adding ? "…" : "Ajouter"}
            </Button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Rôle</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Maillot</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Cap.</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                    Effectif vide. Ajoutez des athlètes ou coachs du club.
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const label =
                    m.user
                      ? `${m.user.first_name ?? ""} ${m.user.last_name ?? ""}`.trim() ||
                        m.user.email
                      : m.user_id;
                  return (
                    <tr key={m.id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {label}
                        {m.user && (
                          <div className="text-xs text-gray-500">{m.user.email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {m.role_in_team.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {m.jersey_number ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {m.is_captain ? "Oui" : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-3">
                          {m.role_in_team === "ATHLETE" && (
                            <Link
                              href={`/members/${m.user_id}/athlete`}
                              className="text-sm font-medium text-brand-600 hover:text-brand-700"
                            >
                              Profil
                            </Link>
                          )}
                          <button
                            type="button"
                            disabled={removingId === m.id}
                            onClick={() => handleRemove(m.id, label || "ce membre")}
                            className="text-sm font-medium text-error-600 hover:text-error-700 disabled:opacity-50"
                          >
                            {removingId === m.id ? "…" : "Retirer"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
