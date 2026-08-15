"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  teamsGetTeamEndpoint,
  teamsUpdateTeamEndpoint,
  teamsAddMemberEndpoint,
  teamsRemoveMemberEndpoint,
  teamsUpdateMemberEndpoint,
  membersListMembersByUser,
} from "@/api-client";
import type {
  TeamDetailResponse,
  TeamMemberResponse,
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
  { value: "ASSISTANT_COACH", label: "Adjoint" },
  { value: "STAFF", label: "Staff" },
];

const STAFF_TEAM_ROLES = new Set<TeamMemberRoleEnum>([
  "COACH",
  "ASSISTANT_COACH",
  "STAFF",
]);

const selectClass =
  "h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

function memberLabel(m: TeamMemberResponse): string {
  if (m.user) {
    const n = `${m.user.first_name ?? ""} ${m.user.last_name ?? ""}`.trim();
    return n || m.user.email || m.user_id;
  }
  return m.user_id;
}

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = String(params?.id ?? "");
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [team, setTeam] = useState<TeamDetailResponse | null>(null);
  const [clubUsers, setClubUsers] = useState<UserWithRolesResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [name, setName] = useState("");
  const [ageCategory, setAgeCategory] = useState<AgeCategoryEnum>("U15");
  const [gender, setGender] = useState<TeamGenderEnum>("MALE");
  const [season, setSeason] = useState("");
  const [description, setDescription] = useState("");
  const [maxRoster, setMaxRoster] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Ajout
  const [candidateSearch, setCandidateSearch] = useState("");
  const [addRole, setAddRole] = useState<TeamMemberRoleEnum>("ATHLETE");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  // Filtres effectif
  const [rosterFilter, setRosterFilter] = useState<"ALL" | "ATHLETE" | "STAFF">("ALL");
  const [rosterSearch, setRosterSearch] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const rosterUserIds = useMemo(
    () => new Set((team?.members ?? []).map((m) => m.user_id)),
    [team]
  );

  const candidates = useMemo(() => {
    const q = candidateSearch.trim().toLowerCase();
    return clubUsers
      .filter((u) => !rosterUserIds.has(u.user.id))
      .filter((u) => {
        if (!q) return true;
        const hay = `${u.user.first_name} ${u.user.last_name} ${u.user.email} ${u.roles.join(" ")}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) =>
        `${a.user.last_name}${a.user.first_name}`.localeCompare(
          `${b.user.last_name}${b.user.first_name}`,
          "fr"
        )
      );
  }, [clubUsers, rosterUserIds, candidateSearch]);

  const members = team?.members ?? [];

  const filteredMembers = useMemo(() => {
    const q = rosterSearch.trim().toLowerCase();
    return members
      .filter((m) => {
        if (rosterFilter === "ATHLETE") return m.role_in_team === "ATHLETE";
        if (rosterFilter === "STAFF") return STAFF_TEAM_ROLES.has(m.role_in_team);
        return true;
      })
      .filter((m) => {
        if (!q) return true;
        return memberLabel(m).toLowerCase().includes(q) ||
          (m.user?.email ?? "").toLowerCase().includes(q);
      })
      .sort((a, b) => {
        // Capitaines d'abord, puis maillot, puis nom
        if (a.is_captain !== b.is_captain) return a.is_captain ? -1 : 1;
        const ja = a.jersey_number ?? 999;
        const jb = b.jersey_number ?? 999;
        if (ja !== jb) return ja - jb;
        return memberLabel(a).localeCompare(memberLabel(b), "fr");
      });
  }, [members, rosterFilter, rosterSearch]);

  const counts = useMemo(() => {
    const athletes = members.filter((m) => m.role_in_team === "ATHLETE").length;
    const staff = members.filter((m) => STAFF_TEAM_ROLES.has(m.role_in_team)).length;
    return { all: members.length, athletes, staff };
  }, [members]);

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

    if (membersRes.data) setClubUsers(membersRes.data.items ?? []);
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
    const { error: err } = await teamsUpdateTeamEndpoint({
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
    if (err) {
      setError(apiErrorMessage(err, "Échec de la mise à jour"));
      return;
    }
    setSuccess("Paramètres de l'équipe enregistrés.");
    await load();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds(new Set(candidates.map((c) => c.user.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkAdd = async () => {
    if (!team || selectedIds.size === 0) return;
    setAdding(true);
    setError(null);
    setSuccess(null);
    configureApiClient();

    let ok = 0;
    let fail = 0;
    for (const userId of selectedIds) {
      const { error: err } = await teamsAddMemberEndpoint({
        path: { team_id: team.id },
        body: {
          user_id: userId,
          role_in_team: addRole,
          is_captain: false,
        },
      });
      if (err) fail += 1;
      else ok += 1;
    }

    setAdding(false);
    setSelectedIds(new Set());
    if (fail && !ok) {
      setError(`Aucun membre ajouté (${fail} erreur(s)).`);
    } else if (fail) {
      setSuccess(`${ok} ajouté(s), ${fail} échec(s).`);
    } else {
      setSuccess(`${ok} membre(s) ajouté(s) à l'effectif.`);
    }
    await load();
  };

  const handleUpdateMember = async (
    memberId: string,
    patch: {
      role_in_team?: TeamMemberRoleEnum;
      jersey_number?: number | null;
      is_captain?: boolean;
    }
  ) => {
    if (!team) return;
    setUpdatingId(memberId);
    setError(null);
    configureApiClient();
    const { error: err } = await teamsUpdateMemberEndpoint({
      path: { team_id: team.id, member_id: memberId },
      body: patch,
    });
    setUpdatingId(null);
    if (err) {
      setError(apiErrorMessage(err, "Impossible de modifier le membre"));
      await load();
      return;
    }
    // Optimistic local update
    setTeam((prev) => {
      if (!prev?.members) return prev;
      return {
        ...prev,
        members: prev.members.map((m) =>
          m.id === memberId
            ? {
                ...m,
                role_in_team: patch.role_in_team ?? m.role_in_team,
                jersey_number:
                  patch.jersey_number !== undefined
                    ? patch.jersey_number
                    : m.jersey_number,
                is_captain:
                  patch.is_captain !== undefined ? patch.is_captain : m.is_captain,
              }
            : m
        ),
      };
    });
  };

  const handleRemove = async (memberId: string, label: string) => {
    if (!team) return;
    if (!window.confirm(`Retirer « ${label} » de l'équipe ?`)) return;
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
    setSuccess(`${label} retiré(e) de l'effectif.`);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/teams" className="text-sm text-gray-500 hover:text-brand-600">
            ← Équipes
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {team.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {team.age_category} · {team.gender}
            {team.season ? ` · ${team.season}` : ""}
            {team.max_roster_size
              ? ` · ${counts.all}/${team.max_roster_size}`
              : ` · ${counts.all} membre(s)`}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() => setSettingsOpen((v) => !v)}
        >
          {settingsOpen ? "Masquer paramètres" : "Paramètres équipe"}
        </Button>
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

      {/* Settings collapsible */}
      {settingsOpen && (
        <form
          onSubmit={handleSaveTeam}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
        >
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Paramètres
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
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={saving}
                className="h-4 w-4 rounded border-gray-300 text-brand-500"
              />
              Équipe active
            </label>
          </div>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "…" : "Enregistrer"}
          </Button>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Colonne : ajouter */}
        <div className="lg:col-span-2 space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Ajouter à l'effectif
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Cochez un ou plusieurs membres du club, puis validez.
            </p>
          </div>

          <div>
            <Label>Rôle à l'ajout</Label>
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
            <Label>Rechercher</Label>
            <Input
              value={candidateSearch}
              onChange={(e) => setCandidateSearch(e.target.value)}
              placeholder="Nom, email, rôle…"
              disabled={adding}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{candidates.length} disponible(s)</span>
            <div className="flex gap-2">
              <button type="button" onClick={selectAllVisible} className="font-medium text-brand-600 hover:underline" disabled={adding}>
                Tout cocher
              </button>
              <button type="button" onClick={clearSelection} className="font-medium text-gray-500 hover:underline" disabled={adding}>
                Vider
              </button>
            </div>
          </div>

          <ul className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-800">
            {candidates.length === 0 ? (
              <li className="px-3 py-8 text-center text-sm text-gray-500">
                {clubUsers.length === 0
                  ? "Aucun membre club. Créez-en dans Membres."
                  : "Tous les membres sont déjà dans l'équipe (ou aucun résultat)."}
              </li>
            ) : (
              candidates.map((u) => {
                const checked = selectedIds.has(u.user.id);
                return (
                  <li key={u.user.id}>
                    <label
                      className={`flex cursor-pointer items-start gap-3 px-3 py-2.5 text-sm transition hover:bg-gray-50 dark:hover:bg-white/[0.03] ${
                        checked ? "bg-brand-50/60 dark:bg-brand-500/10" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(u.user.id)}
                        disabled={adding}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-500"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-gray-900 dark:text-white">
                          {u.user.first_name} {u.user.last_name}
                        </span>
                        <span className="block truncate text-xs text-gray-500">
                          {u.user.email}
                        </span>
                        <span className="mt-1 flex flex-wrap gap-1">
                          {u.roles.slice(0, 3).map((r) => (
                            <span
                              key={r}
                              className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            >
                              {r.replace(/_/g, " ")}
                            </span>
                          ))}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })
            )}
          </ul>

          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={adding || selectedIds.size === 0}
            onClick={handleBulkAdd}
          >
            {adding
              ? "Ajout…"
              : `Ajouter ${selectedIds.size || ""} à l'équipe`.trim()}
          </Button>
        </div>

        {/* Colonne : effectif */}
        <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Effectif
            </h2>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { key: "ALL" as const, label: `Tous (${counts.all})` },
                  { key: "ATHLETE" as const, label: `Athlètes (${counts.athletes})` },
                  { key: "STAFF" as const, label: `Staff (${counts.staff})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setRosterFilter(tab.key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    rosterFilter === tab.key
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <Input
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
              placeholder="Filtrer l'effectif…"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-medium uppercase text-gray-500">
                    Membre
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium uppercase text-gray-500">
                    Rôle
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium uppercase text-gray-500">
                    N°
                  </th>
                  <th className="px-3 py-2.5 text-center text-xs font-medium uppercase text-gray-500">
                    Cap.
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium uppercase text-gray-500">
                    
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                      {members.length === 0
                        ? "Effectif vide — sélectionnez des membres à gauche."
                        : "Aucun résultat pour ce filtre."}
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => {
                    const label = memberLabel(m);
                    const busy = updatingId === m.id || removingId === m.id;
                    return (
                      <tr key={m.id} className={busy ? "opacity-60" : ""}>
                        <td className="px-3 py-2.5">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {label}
                          </div>
                          {m.user?.email && (
                            <div className="text-xs text-gray-500">{m.user.email}</div>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <select
                            className="h-9 max-w-[140px] rounded-md border border-gray-200 bg-transparent px-2 text-xs dark:border-gray-700"
                            value={m.role_in_team}
                            disabled={busy}
                            onChange={(e) =>
                              handleUpdateMember(m.id, {
                                role_in_team: e.target.value as TeamMemberRoleEnum,
                              })
                            }
                          >
                            {TEAM_ROLES.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            className="h-9 w-16 rounded-md border border-gray-200 bg-transparent px-2 text-center text-sm dark:border-gray-700"
                            defaultValue={m.jersey_number ?? ""}
                            key={`${m.id}-${m.jersey_number}`}
                            disabled={busy}
                            onBlur={(e) => {
                              const n = e.target.value.trim();
                              const next = n === "" ? null : Number(n);
                              const prev = m.jersey_number ?? null;
                              if (next === prev) return;
                              if (n !== "" && !Number.isFinite(next)) return;
                              handleUpdateMember(m.id, { jersey_number: next });
                            }}
                          />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={m.is_captain}
                            disabled={busy}
                            onChange={(e) =>
                              handleUpdateMember(m.id, {
                                is_captain: e.target.checked,
                              })
                            }
                            className="h-4 w-4 rounded border-gray-300 text-brand-500"
                            title="Capitaine"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            {m.role_in_team === "ATHLETE" && (
                              <Link
                                href={`/members/${m.user_id}/athlete`}
                                className="text-xs font-medium text-brand-600 hover:underline"
                              >
                                Athlète
                              </Link>
                            )}
                            {STAFF_TEAM_ROLES.has(m.role_in_team) && (
                              <Link
                                href={`/members/${m.user_id}/staff`}
                                className="text-xs font-medium text-brand-600 hover:underline"
                              >
                                Coach
                              </Link>
                            )}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleRemove(m.id, label)}
                              className="text-xs font-medium text-error-600 hover:underline disabled:opacity-50"
                            >
                              Retirer
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
    </div>
  );
}
