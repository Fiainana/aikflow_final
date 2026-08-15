"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  authGetMe,
  membersMyPermissions,
  profilesMeStaffProfile,
  profilesMeUpdateStaff,
} from "@/api-client";
import type {
  UserBaseResponse,
  PermissionsExplanationResponse,
  StaffProfileResponse,
  StaffProfileUpdate,
  ErrorDetail,
  CoachingLicenseLevelEnum,
  GenderEnum,
} from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { configureApiClient } from "@/lib/api";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";

const GENDER_OPTIONS: { value: GenderEnum; label: string }[] = [
  { value: "MALE", label: "Homme" },
  { value: "FEMALE", label: "Femme" },
  { value: "OTHER", label: "Autre" },
  { value: "UNDISCLOSED", label: "Non communiqué" },
];

const LICENSE_OPTIONS: { value: CoachingLicenseLevelEnum; label: string }[] = [
  { value: "GRASSROOTS", label: "Grassroots" },
  { value: "C", label: "Licence C" },
  { value: "B", label: "Licence B" },
  { value: "A", label: "Licence A" },
  { value: "PRO", label: "Pro" },
  { value: "NATIONAL", label: "National" },
  { value: "OTHER", label: "Autre" },
];

const STAFF_ROLES = new Set([
  "CLUB_ADMIN",
  "COACH",
  "ASSISTANT_COACH",
  "STAFF",
]);

function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as ErrorDetail;
  if (typeof e?.detail === "string") return e.detail;
  return fallback;
}

function emptyToNull(v: string): string | null {
  const t = v.trim();
  return t ? t : null;
}

export default function ClubProfilePage() {
  const {
    user: ctxUser,
    isLoading: authLoading,
    isAuthenticated,
    isSuperAdmin,
    refreshMe,
  } = useAuth();

  const [me, setMe] = useState<UserBaseResponse | null>(null);
  const [permissions, setPermissions] =
    useState<PermissionsExplanationResponse | null>(null);
  const [staff, setStaff] = useState<StaffProfileResponse | null>(null);
  const [hasStaffProfile, setHasStaffProfile] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Formulaire staff
  const [jobTitle, setJobTitle] = useState("");
  const [nationality, setNationality] = useState("");
  const [lang, setLang] = useState("");
  const [lang2, setLang2] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<GenderEnum | "">("");
  const [yearsExp, setYearsExp] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [licenseLevel, setLicenseLevel] = useState<
    CoachingLicenseLevelEnum | ""
  >("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseFed, setLicenseFed] = useState("");
  const [bio, setBio] = useState("");
  const [notes, setNotes] = useState("");

  const clubRoles = useMemo(() => {
    const roles =
      me?.memberships
        ?.filter((m) => m.role !== "SUPER_ADMIN")
        .map((m) => m.role) ?? [];
    return [...new Set(roles)];
  }, [me]);

  const canEditStaff = useMemo(
    () => clubRoles.some((r) => STAFF_ROLES.has(r)),
    [clubRoles]
  );

  const fillStaffForm = (p: StaffProfileResponse | null) => {
    setJobTitle(p?.job_title ?? "");
    setNationality(p?.nationality_code ?? "");
    setLang(p?.preferred_language_code ?? "");
    setLang2(p?.secondary_language_code ?? "");
    setDob(p?.date_of_birth ? p.date_of_birth.slice(0, 10) : "");
    setGender(p?.gender ?? "");
    setYearsExp(
      p?.years_of_experience != null ? String(p.years_of_experience) : ""
    );
    setQualifications(p?.qualifications ?? "");
    setLicenseLevel(p?.coaching_license_level ?? "");
    setLicenseNumber(p?.coaching_license_number ?? "");
    setLicenseFed(p?.coaching_license_federation ?? "");
    setBio(p?.bio ?? "");
    setNotes(p?.notes ?? "");
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    configureApiClient();

    const meRes = await authGetMe();
    if (meRes.error || !meRes.data) {
      setError(apiErrorMessage(meRes.error, "Impossible de charger le profil"));
      setLoading(false);
      return;
    }
    setMe(meRes.data);

    const roles =
      meRes.data.memberships
        ?.filter((m) => m.role !== "SUPER_ADMIN")
        .map((m) => m.role) ?? [];
    const staffCapable = roles.some((r) => STAFF_ROLES.has(r));

    // Permissions (org active)
    const permRes = await membersMyPermissions();
    if (permRes.data) {
      setPermissions(permRes.data);
    } else {
      setPermissions(null);
    }

    if (staffCapable) {
      const staffRes = await profilesMeStaffProfile();
      if (staffRes.data) {
        setStaff(staffRes.data);
        setHasStaffProfile(true);
        fillStaffForm(staffRes.data);
      } else {
        // 404 = profil pas encore créé → formulaire vide pour première saisie
        setStaff(null);
        setHasStaffProfile(false);
        fillStaffForm(null);
      }
    } else {
      setStaff(null);
      setHasStaffProfile(false);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      load();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, load]);

  const handleSaveStaff = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    configureApiClient();

    const body: StaffProfileUpdate = {
      job_title: emptyToNull(jobTitle),
      nationality_code: emptyToNull(nationality),
      preferred_language_code: emptyToNull(lang),
      secondary_language_code: emptyToNull(lang2),
      date_of_birth: emptyToNull(dob),
      gender: gender || null,
      years_of_experience: yearsExp.trim()
        ? Number(yearsExp)
        : null,
      qualifications: emptyToNull(qualifications),
      coaching_license_level: licenseLevel || null,
      coaching_license_number: emptyToNull(licenseNumber),
      coaching_license_federation: emptyToNull(licenseFed),
      bio: emptyToNull(bio),
      notes: emptyToNull(notes),
    };

    const { data, error: err } = await profilesMeUpdateStaff({ body });
    setSaving(false);

    if (err || !data) {
      setError(apiErrorMessage(err, "Échec de la mise à jour du profil staff"));
      return;
    }

    setStaff(data);
    setHasStaffProfile(true);
    fillStaffForm(data);
    setSuccess("Profil professionnel enregistré.");
    await refreshMe();
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-error-700">
        Connectez-vous pour voir votre profil.
      </div>
    );
  }

  const display = me ?? ctxUser;
  const fullName =
    [display?.first_name, display?.last_name].filter(Boolean).join(" ") ||
    display?.email ||
    "Utilisateur";
  const initials = (
    display?.first_name?.[0] ||
    display?.email?.[0] ||
    "?"
  ).toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Mon profil
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Identité, rôles club et profil professionnel
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400"
        >
          {error}
          <button
            type="button"
            onClick={load}
            className="ml-3 underline font-medium"
          >
            Réessayer
          </button>
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

      {/* Carte identité */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 lg:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xl font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {fullName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {display?.email}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {isSuperAdmin && (
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                  Super Admin
                </span>
              )}
              {clubRoles.map((r) => (
                <span
                  key={r}
                  className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  {r.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">
              Prénom
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {display?.first_name || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">Nom</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {display?.last_name || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">
              Email
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {display?.email}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">
              ID utilisateur
            </dt>
            <dd className="mt-1 break-all font-mono text-xs text-gray-600 dark:text-gray-400">
              {display?.id}
            </dd>
          </div>
        </dl>
      </div>

      {/* Memberships */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 lg:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Organisations & rôles
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500">
                <th className="pb-2 pr-4">Club</th>
                <th className="pb-2 pr-4">Sport</th>
                <th className="pb-2">Rôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(display?.memberships ?? []).length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-6 text-sm text-gray-500"
                  >
                    Aucun membership.
                  </td>
                </tr>
              ) : (
                display?.memberships?.map((m, i) => (
                  <tr key={`${m.organization?.id}-${m.role}-${i}`}>
                    <td className="py-3 pr-4 text-sm font-medium text-gray-900 dark:text-white">
                      {m.organization?.name ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-600 dark:text-gray-400">
                      {m.organization?.sport ?? "—"}
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                      {m.role.replace(/_/g, " ")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions */}
      {permissions && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 lg:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Permissions (org active)
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Résolution : {permissions.resolution ?? "union des rôles"} · org{" "}
            <span className="font-mono">{permissions.organization_id}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {permissions.roles?.map((r) => (
              <span
                key={r}
                className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
              >
                {r.replace(/_/g, " ")}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {(permissions.permissions ?? []).length === 0 ? (
              <span className="text-sm text-gray-500">Aucune permission listée.</span>
            ) : (
              permissions.permissions.map((p) => (
                <span
                  key={p}
                  className="rounded bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  {p}
                </span>
              ))
            )}
          </div>
        </div>
      )}

      {/* Profil staff / coach */}
      {canEditStaff && (
        <form
          onSubmit={handleSaveStaff}
          className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 lg:p-6"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Profil professionnel (staff / coach)
              </h3>
              <p className="text-sm text-gray-500">
                {hasStaffProfile
                  ? "Modifiez vos informations pro."
                  : "Complétez votre fiche (première saisie)."}
              </p>
            </div>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Poste / fonction</Label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Coach principal"
                disabled={saving}
              />
            </div>
            <div>
              <Label>Années d'expérience</Label>
              <Input
                type="number"
                value={yearsExp}
                onChange={(e) => setYearsExp(e.target.value)}
                disabled={saving}
              />
            </div>
            <div>
              <Label>Nationalité (code ISO)</Label>
              <Input
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="FR"
                disabled={saving}
              />
            </div>
            <div>
              <Label>Date de naissance</Label>
              <Input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                disabled={saving}
              />
            </div>
            <div>
              <Label>Genre</Label>
              <select
                value={gender}
                onChange={(e) =>
                  setGender((e.target.value as GenderEnum) || "")
                }
                disabled={saving}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">—</option>
                {GENDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Langue préférée</Label>
              <Input
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                placeholder="fr"
                disabled={saving}
              />
            </div>
            <div>
              <Label>Langue secondaire</Label>
              <Input
                value={lang2}
                onChange={(e) => setLang2(e.target.value)}
                placeholder="en"
                disabled={saving}
              />
            </div>
            <div>
              <Label>Niveau de licence coach</Label>
              <select
                value={licenseLevel}
                onChange={(e) =>
                  setLicenseLevel(
                    (e.target.value as CoachingLicenseLevelEnum) || ""
                  )
                }
                disabled={saving}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">—</option>
                {LICENSE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>N° licence</Label>
              <Input
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                disabled={saving}
              />
            </div>
            <div>
              <Label>Fédération licence</Label>
              <Input
                value={licenseFed}
                onChange={(e) => setLicenseFed(e.target.value)}
                placeholder="FFF"
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <Label>Qualifications</Label>
            <Input
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
              disabled={saving}
            />
          </div>
          <div>
            <Label>Bio</Label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div>
            <Label>Notes (privées)</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>

          {staff?.updated_at && (
            <p className="text-xs text-gray-500">
              Dernière mise à jour :{" "}
              {new Date(staff.updated_at).toLocaleString("fr-FR")}
            </p>
          )}
        </form>
      )}

      {!canEditStaff && !isSuperAdmin && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          Votre rôle ne dispose pas d'un profil staff éditable. Les profils
          athlète / parent pourront être branchés de la même façon si besoin.
        </div>
      )}
    </div>
  );
}
