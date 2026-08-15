"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  profilesAdminGetStaff,
  profilesAdminUpdateStaff,
} from "@/api-client";
import type {
  StaffProfileResponse,
  StaffProfileUpdate,
  GenderEnum,
  CoachingLicenseLevelEnum,
} from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { configureApiClient } from "@/lib/api";
import { apiErrorMessage, emptyToNull, emptyToNumber } from "@/lib/errors";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";

const GENDER: { value: GenderEnum; label: string }[] = [
  { value: "MALE", label: "Homme" },
  { value: "FEMALE", label: "Femme" },
  { value: "OTHER", label: "Autre" },
  { value: "UNDISCLOSED", label: "Non communiqué" },
];

const LICENSE: { value: CoachingLicenseLevelEnum; label: string }[] = [
  { value: "GRASSROOTS", label: "Grassroots" },
  { value: "C", label: "Licence C" },
  { value: "B", label: "Licence B" },
  { value: "A", label: "Licence A" },
  { value: "PRO", label: "Pro" },
  { value: "NATIONAL", label: "National" },
  { value: "OTHER", label: "Autre" },
];

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function StaffProfileAdminPage() {
  const params = useParams();
  const userId = String(params?.userId ?? "");
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [profile, setProfile] = useState<StaffProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
  const [licenseExp, setLicenseExp] = useState("");
  const [bio, setBio] = useState("");
  const [notes, setNotes] = useState("");

  const fill = (p: StaffProfileResponse | null) => {
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
    setLicenseExp(
      p?.coaching_license_expires_at
        ? String(p.coaching_license_expires_at).slice(0, 10)
        : ""
    );
    setBio(p?.bio ?? "");
    setNotes(p?.notes ?? "");
  };

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    configureApiClient();
    const { data, error: err } = await profilesAdminGetStaff({
      path: { user_id: userId },
    });
    if (err || !data) {
      setError(
        apiErrorMessage(
          err,
          "Profil staff/coach introuvable (membre avec rôle COACH / STAFF requis)"
        )
      );
      setProfile(null);
      fill(null);
    } else {
      setProfile(data);
      fill(data);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && userId) load();
    else if (!authLoading) setLoading(false);
  }, [authLoading, isAuthenticated, userId, load]);

  const handleSave = async (e: FormEvent) => {
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
      years_of_experience: emptyToNumber(yearsExp),
      qualifications: emptyToNull(qualifications),
      coaching_license_level: licenseLevel || null,
      coaching_license_number: emptyToNull(licenseNumber),
      coaching_license_federation: emptyToNull(licenseFed),
      coaching_license_expires_at: emptyToNull(licenseExp),
      bio: emptyToNull(bio),
      notes: emptyToNull(notes),
    };

    const { data, error: err } = await profilesAdminUpdateStaff({
      path: { user_id: userId },
      body,
    });
    setSaving(false);
    if (err || !data) {
      setError(apiErrorMessage(err, "Échec de la mise à jour du profil coach"));
      return;
    }
    setProfile(data);
    fill(data);
    setSuccess("Profil coach / staff enregistré.");
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
        <Link
          href="/members"
          className="text-sm text-gray-500 hover:text-brand-600"
        >
          ← Membres
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
          Profil coach / staff
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          User ID <span className="font-mono text-xs">{userId}</span>
          {profile?.job_title ? ` · ${profile.job_title}` : ""}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700"
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

      <form
        onSubmit={handleSave}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 lg:p-6"
      >
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Fonction
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2">
              <Label>Poste / titre</Label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Coach principal U15"
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
            <div className="sm:col-span-2 lg:col-span-3">
              <Label>Qualifications</Label>
              <Input
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Identité
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                className={selectClass}
                value={gender}
                onChange={(e) =>
                  setGender((e.target.value as GenderEnum) || "")
                }
                disabled={saving}
              >
                <option value="">—</option>
                {GENDER.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Nationalité (ISO)</Label>
              <Input
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="FR"
                disabled={saving}
              />
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
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Licence coaching
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Niveau</Label>
              <select
                className={selectClass}
                value={licenseLevel}
                onChange={(e) =>
                  setLicenseLevel(
                    (e.target.value as CoachingLicenseLevelEnum) || ""
                  )
                }
                disabled={saving}
              >
                <option value="">—</option>
                {LICENSE.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
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
              <Label>Fédération</Label>
              <Input
                value={licenseFed}
                onChange={(e) => setLicenseFed(e.target.value)}
                placeholder="FFF / UEFA"
                disabled={saving}
              />
            </div>
            <div>
              <Label>Expiration</Label>
              <Input
                type="date"
                value={licenseExp}
                onChange={(e) => setLicenseExp(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <Label>Bio</Label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div>
            <Label>Notes internes</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
          <Link
            href="/members"
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-brand-600"
          >
            Retour
          </Link>
        </div>

        {profile?.updated_at && (
          <p className="text-xs text-gray-500">
            Dernière mise à jour :{" "}
            {new Date(profile.updated_at).toLocaleString("fr-FR")}
          </p>
        )}
      </form>
    </div>
  );
}
