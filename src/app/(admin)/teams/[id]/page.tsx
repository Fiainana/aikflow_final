"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  teamsGetTeamEndpoint,
  teamsUpdateTeamEndpoint,
  teamsDeleteTeamEndpoint,
  teamsAddMemberEndpoint,
  teamsRemoveMemberEndpoint,
  teamsUpdateMemberEndpoint,
  membersListMembersByUser,
} from "@/api-client";
import type {
  TeamDetailResponse,
  TeamMemberResponse,
  TeamMemberRoleEnum,
  AgeCategoryEnum,
  TeamGenderEnum,
  UserWithRolesResponse,
} from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { configureApiClient } from "@/lib/api";
import { apiErrorMessage, emptyToNull, emptyToNumber } from "@/lib/errors";
import {
  profileHrefForTeamRole,
  profileNameLinkClass,
} from "@/lib/profile-links";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";

const AGE_CATEGORIES: AgeCategoryEnum[] = [
  "U7", "U9", "U11", "U13", "U15", "U17", "U19", "U21", "SENIOR", "OTHER",
];
const GENDERS: { value: TeamGenderEnum; label: string }[] = [
  { value: "MALE", label: "Masculin" },
  { value: "FEMALE", label: "Féminin" },
  { value: "MIXED", label: "Mixte" },
];
const TEAM_ROLES: { value: TeamMemberRoleEnum; label: string }[] = [
  { value: "ATHLETE", label: "Athlète" },
  { value: "COACH", label: "Coach" },
  { value: "ASSISTANT_COACH", label: "Assistant" },
  { value: "STAFF", label: "Staff" },
];

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

function teamRoleFromClubRoles(roles: string[]): TeamMemberRoleEnum {
  if (roles.includes("COACH")) return "COACH";
  if (roles.includes("ASSISTANT_COACH")) return "ASSISTANT_COACH";
  if (roles.includes("STAFF") || roles.includes("CLUB_ADMIN")) return "STAFF";
  return "ATHLETE";
}

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = String(params.id ?? "");
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [team, setTeam] = useState<TeamDetailResponse | null>(null);
  const [clubMembers, setClubMembers] = useState<UserWithRolesResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [ageCategory, setAgeCategory] = useState<AgeCategoryEnum>("U15");
  const [gender, setGender] = useState<TeamGenderEnum>("MALE");
  const [season, setSeason] = useState("");
  const [description, setDescription] = useState("");
  const [maxRoster, setMaxRoster] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [jersey, setJersey] = useState("");
  const [isCaptain, setIsCaptain] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
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
      setError(null);
    }
    setClubMembers(membersRes.data?.items ?? []);
    setLoading(false);
  }, [teamId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) load();
    else if (!authLoading) setLoading(false);
  }, [authLoading, isAuthenticated, load]);

  const rosterIds = useMemo(
    () => new Set((team?.members ?? []).map((m) => m.user_id)),
    [team]
  );

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clubMembers
      .filter((m) => !rosterIds.has(m.user.id))
      .filter((m) => {
        if (!q) return true;
        const hay = `${m.user.first_name} ${m.user.last_name} ${m.user.email}`;
        return hay.toLowerCase().includes(q);
      });
  }, [clubMembers, rosterIds, search]);

  const handleSaveTeam = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    configureApiClient();
    const { data, error: err } = await teamsUpdateTeamEndpoint({
      path: { team_id: teamId },
      body: {
        name: name.trim(),
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
    setSuccess("Équipe mise à jour");
    setEditOpen(false);
    await load();
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer définitivement cette équipe ?")) return;
    configureApiClient();
    const { error: err } = await teamsDeleteTeamEndpoint({
      path: { team_id: teamId },
    });
    if (err) {
      setError(apiErrorMessage(err, "Suppression impossible"));
      return;
    }
    router.push("/teams");
  };

  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    const member = clubMembers.find((m) => m.user.id === selectedUserId);
    const roleInTeam = teamRoleFromClubRoles(member?.roles ?? []);
    setAdding(true);
    setError(null);
    configureApiClient();
    const { error: err } = await teamsAddMemberEndpoint({
      path: { team_id: teamId },
      body: {
        user_id: selectedUserId,
        role_in_team: roleInTeam,
        jersey_number: emptyToNumber(jersey),
        is_captain: isCaptain,
      },
    });
    setAdding(false);
    if (err) {
      setError(apiErrorMessage(err, "Ajout impossible"));
      return;
    }
    setSelectedUserId("");
    setJersey("");
    setIsCaptain(false);
    setAddOpen(false);
    setSuccess("Membre ajouté à l'équipe");
    await load();
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Retirer ce membre de l'équipe ?")) return;
    configureApiClient();
    const { error: err } = await teamsRemoveMemberEndpoint({
      path: { team_id: teamId, member_id: memberId },
    });
    if (err) {
      setError(apiErrorMessage(err, "Retrait impossible"));
      return;
    }
    setSuccess("Membre retiré");
    await load();
  };

  const handleToggleCaptain = async (m: TeamMemberResponse) => {
    configureApiClient();
    const { error: err } = await teamsUpdateMemberEndpoint({
      path: { team_id: teamId, member_id: m.id },
      body: { is_captain: !m.is_captain },
    });
    if (err) {
      setError(apiErrorMessage(err, "Mise à jour impossible"));
      return;
    }
    await load();
  };

  const handleToggleActive = async (m: TeamMemberResponse) => {
    configureApiClient();
    const { error: err } = await teamsUpdateMemberEndpoint({
      path: { team_id: teamId, member_id: m.id },
      body: { is_active: !m.is_active },
    });
    if (err) {
      setError(apiErrorMessage(err, "Mise à jour impossible"));
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

  if (!team) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-error-600">{error ?? "Équipe introuvable"}</p>
        <Link href="/teams" className="text-sm text-brand-600">
          ← Retour aux équipes
        </Link>
      </div>
    );
  }

  const members = team.members ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/teams" className="text-sm text-gray-500 hover:text-brand-600">
            ← Équipes
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {team.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {team.age_category} · {team.gender}
            {team.season ? ` · ${team.season}` : ""} · {" "}
            {team.members_count ?? members.length} membre(s)
            {!team.is_active && (
              <span className="ml-2 text-warning-600">(inactive)</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" type="button" onClick={() => setEditOpen((v) => !v)}>
            {editOpen ? "Fermer" : "Modifier"}
          </Button>
          <Button size="sm" type="button" onClick={() => setAddOpen((v) => !v)}>
            {addOpen ? "Fermer" : "Ajouter un membre"}
          </Button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-10 rounded-lg border border-error-200 px-3 text-sm font-medium text-error-600 hover:bg-error-50 dark:border-error-800 dark:hover:bg-error-500/10"
          >
            Supprimer
          </button>
        </div>
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

      {editOpen && (
        <form onSubmit={handleSaveTeam} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Modifier l'équipe</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Nom *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required disabled={saving} />
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
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Équipe active
            </label>
          </div>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>
      )}

      {addOpen && (
        <form onSubmit={handleAddMember} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Ajouter un membre</h2>
          <p className="text-xs text-gray-500">
            Le rôle dans l'équipe est dérivé du rôle club (athlète / coach / staff).
          </p>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un membre du club…" />
          <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
            {candidates.length === 0 ? (
              <p className="p-3 text-sm text-gray-500">Aucun candidat disponible</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {candidates.map((m) => {
                  const role = teamRoleFromClubRoles(m.roles);
                  return (
                    <li key={m.user.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedUserId(m.user.id)}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/[0.03] ${
                          selectedUserId === m.user.id ? "bg-brand-50 dark:bg-brand-500/10" : ""
                        }`}
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {m.user.first_name} {m.user.last_name}
                        </span>
                        <span className="text-xs text-gray-500">{role}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>N° maillot</Label>
              <Input type="number" value={jersey} onChange={(e) => setJersey(e.target.value)} disabled={adding} />
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" checked={isCaptain} onChange={(e) => setIsCaptain(e.target.checked)} />
              Capitaine
            </label>
          </div>
          <Button type="submit" size="sm" disabled={adding || !selectedUserId}>
            {adding ? "Ajout…" : "Ajouter à l'équipe"}
          </Button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Effectif</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Rôle</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">N°</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {members.map((m) => {
                const display =
                  m.user
                    ? `${m.user.first_name} ${m.user.last_name}`
                    : m.user_id.slice(0, 8);
                const href = profileHrefForTeamRole(m.user_id, m.role_in_team);
                return (
                  <tr key={m.id} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-sm">
                      {href ? (
                        <Link href={href} className={profileNameLinkClass}>
                          {display}
                          {m.is_captain && (
                            <span className="ml-1 text-xs text-brand-600">(C)</span>
                          )}
                        </Link>
                      ) : (
                        <span className="font-medium text-gray-900 dark:text-white">{display}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {TEAM_ROLES.find((r) => r.value === m.role_in_team)?.label ?? m.role_in_team}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{m.jersey_number ?? "—"}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        m.is_active
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {m.is_active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <div className="inline-flex flex-wrap justify-end gap-2">
                        <button type="button" className="text-brand-600 hover:underline" onClick={() => handleToggleCaptain(m)}>
                          {m.is_captain ? "Retirer C" : "Capitaine"}
                        </button>
                        <button type="button" className="text-gray-600 hover:underline" onClick={() => handleToggleActive(m)}>
                          {m.is_active ? "Désactiver" : "Activer"}
                        </button>
                        <button type="button" className="text-error-600 hover:underline" onClick={() => handleRemove(m.id)}>
                          Retirer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {members.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                    Aucun membre dans cette équipe.
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
