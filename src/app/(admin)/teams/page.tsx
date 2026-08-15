"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  teamsListTeamsEndpoint,
  teamsCreateTeamEndpoint,
} from "@/api-client";
import type {
  TeamResponse,
  AgeCategoryEnum,
  TeamGenderEnum,
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

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function TeamsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [ageCategory, setAgeCategory] = useState<AgeCategoryEnum>("U15");
  const [gender, setGender] = useState<TeamGenderEnum>("MALE");
  const [season, setSeason] = useState("");
  const [description, setDescription] = useState("");
  const [maxRoster, setMaxRoster] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    configureApiClient();
    const { data, error: err } = await teamsListTeamsEndpoint({
      query: { active_only: false },
    });
    if (err) {
      setError(apiErrorMessage(err, "Impossible de charger les équipes"));
      setTeams([]);
    } else {
      setTeams(data?.items ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) load();
    else if (!authLoading) setLoading(false);
  }, [authLoading, isAuthenticated, load]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    configureApiClient();
    const { data, error: err } = await teamsCreateTeamEndpoint({
      body: {
        name: name.trim(),
        age_category: ageCategory,
        gender,
        season: emptyToNull(season),
        description: emptyToNull(description),
        max_roster_size: emptyToNumber(maxRoster),
      },
    });
    setSubmitting(false);
    if (err || !data) {
      setError(apiErrorMessage(err, "Échec de la création de l'équipe"));
      return;
    }
    setName("");
    setSeason("");
    setDescription("");
    setMaxRoster("");
    setShowForm(false);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Équipes
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Catégories, effectifs et composition
          </p>
        </div>
        <Button size="sm" type="button" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Fermer" : "Créer une équipe"}
        </Button>
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
          onSubmit={handleCreate}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
        >
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Nouvelle équipe
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>
                Nom <span className="text-error-500">*</span>
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="U15 A"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <Label>
                Catégorie d'âge <span className="text-error-500">*</span>
              </Label>
              <select
                className={selectClass}
                value={ageCategory}
                onChange={(e) =>
                  setAgeCategory(e.target.value as AgeCategoryEnum)
                }
                disabled={submitting}
              >
                {AGE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Genre</Label>
              <select
                className={selectClass}
                value={gender}
                onChange={(e) => setGender(e.target.value as TeamGenderEnum)}
                disabled={submitting}
              >
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Saison</Label>
              <Input
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="2025-2026"
                disabled={submitting}
              />
            </div>
            <div>
              <Label>Effectif max</Label>
              <Input
                type="number"
                value={maxRoster}
                onChange={(e) => setMaxRoster(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Création…" : "Créer l'équipe"}
          </Button>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((t) => (
          <Link
            key={t.id}
            href={`/teams/${t.id}`}
            className="block rounded-xl border border-gray-200 bg-white p-5 transition hover:border-brand-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-700"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {t.name}
              </h2>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  t.is_active
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {t.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {t.age_category} · {t.gender}
              {t.season ? ` · ${t.season}` : ""}
            </p>
            <p className="mt-2 text-xs text-brand-600 dark:text-brand-400">
              {t.members_count ?? 0} membre(s)
            </p>
          </Link>
        ))}
        {teams.length === 0 && !error && (
          <p className="col-span-full py-12 text-center text-sm text-gray-500">
            Aucune équipe. Créez la première catégorie du club.
          </p>
        )}
      </div>
    </div>
  );
}
