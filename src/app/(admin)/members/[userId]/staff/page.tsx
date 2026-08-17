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
import {
  COUNTRIES,
  LANGUAGES,
  GENDERS,
  COACHING_LICENSE_LEVELS,
  labelOf,
  selectClassName,
} from "@/lib/reference/locale";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";

function FieldView({ label, value }: { label: string; value?: string | number | boolean | null }) {
  let display: string = "—";
  if (value === true) display = "Oui";
  else if (value === false) display = "Non";
  else if (value != null && value !== "") display = String(value);
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm text-gray-900 dark:text-white">{display}</p>
    </div>
  );
}

export default function StaffProfileAdminPage() {
  const params = useParams();
  const userId = String(params?.userId ?? "");
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [profile, setProfile] = useState<StaffProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [jobTitle, setJobTitle] = useState("");
  const [nationality, setNationality] = useState("");
  const [lang, setLang] = useState("");
  const [lang2, setLang2] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<GenderEnum | "">("");
  const [yearsExp, setYearsExp] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [licenseLevel, setLicenseLevel] = useState<CoachingLicenseLevelEnum | "">("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseFed, setLicenseFed] = useState("");
  const [licenseExp, setLicenseExp] = useState("");
  const [bgDeclared, setBgDeclared] = useState(false);
  const [bgDate, setBgDate] = useState("");
  const [bgExpires, setBgExpires] = useState("");
  const [bgRef, setBgRef] = useState("");
  const [safeCompleted, setSafeCompleted] = useState(false);
  const [safeDate, setSafeDate] = useState("");
  const [safeExpires, setSafeExpires] = useState("");
  const [safeRef, setSafeRef] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [bio, setBio] = useState("");
  const [notes, setNotes] = useState("");

  const fill = (p: StaffProfileResponse | null) => {
    setJobTitle(p?.job_title ?? "");
    setNationality(p?.nationality_code ?? "");
    setLang(p?.preferred_language_code ?? "");
    setLang2(p?.secondary_language_code ?? "");
    setDob(p?.date_of_birth ? p.date_of_birth.slice(0, 10) : "");
    setGender(p?.gender ?? "");
    setYearsExp(p?.years_of_experience != null ? String(p.years_of_experience) : "");
    setQualifications(p?.qualifications ?? "");
    setLicenseLevel(p?.coaching_license_level ?? "");
    setLicenseNumber(p?.coaching_license_number ?? "");
    setLicenseFed(p?.coaching_license_federation ?? "");
    setLicenseExp(p?.coaching_license_expires_at ? String(p.coaching_license_expires_at).slice(0, 10) : "");
    setBgDeclared(p?.background_check_declared ?? false);
    setBgDate(p?.background_check_date ? String(p.background_check_date).slice(0, 10) : "");
    setBgExpires(p?.background_check_expires ? String(p.background_check_expires).slice(0, 10) : "");
    setBgRef(p?.background_check_reference ?? "");
    setSafeCompleted(p?.safeguarding_training_completed ?? false);
    setSafeDate(p?.safeguarding_training_date ? String(p.safeguarding_training_date).slice(0, 10) : "");
    setSafeExpires(p?.safeguarding_training_expires ? String(p.safeguarding_training_expires).slice(0, 10) : "");
    setSafeRef(p?.safeguarding_certificate_ref ?? "");
    setPhotoUrl(p?.photo_url ?? "");
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

  const startEdit = () => {
    if (profile) fill(profile);
    setEditing(true);
    setSuccess(null);
    setError(null);
  };

  const cancelEdit = () => {
    if (profile) fill(profile);
    setEditing(false);
    setError(null);
  };

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
      background_check_declared: bgDeclared,
      background_check_date: emptyToNull(bgDate),
      background_check_expires: emptyToNull(bgExpires),
      background_check_reference: emptyToNull(bgRef),
      safeguarding_training_completed: safeCompleted,
      safeguarding_training_date: emptyToNull(safeDate),
      safeguarding_training_expires: emptyToNull(safeExpires),
      safeguarding_certificate_ref: emptyToNull(safeRef),
      photo_url: emptyToNull(photoUrl),
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
    setEditing(false);
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/members" className="text-sm text-gray-500 hover:text-brand-600">
            ← Membres
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            Profil coach / staff
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            User ID <span className="font-mono text-xs">{userId}</span>
            {profile?.job_title ? ` · ${profile.job_title}` : ""}
            {profile?.is_safeguarding_compliant ? " · Safeguarding OK" : ""}
          </p>
        </div>
        {!editing && profile && (
          <Button type="button" size="sm" onClick={startEdit}>
            Éditer
          </Button>
        )}
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

      {!editing && profile && (
        <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 lg:p-6">
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Fonction</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldView label="Poste / titre" value={profile.job_title} />
              <FieldView label="Années d'expérience" value={profile.years_of_experience} />
              <FieldView label="Qualifications" value={profile.qualifications} />
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Identité</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldView label="Date de naissance" value={profile.date_of_birth?.slice(0, 10)} />
              <FieldView label="Genre" value={labelOf(GENDERS, profile.gender)} />
              <FieldView label="Nationalité" value={labelOf(COUNTRIES, profile.nationality_code)} />
              <FieldView label="Langue préférée" value={labelOf(LANGUAGES, profile.preferred_language_code)} />
              <FieldView label="Langue secondaire" value={labelOf(LANGUAGES, profile.secondary_language_code)} />
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Licence coaching</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldView label="Niveau" value={labelOf(COACHING_LICENSE_LEVELS, profile.coaching_license_level)} />
              <FieldView label="N° licence" value={profile.coaching_license_number} />
              <FieldView label="Fédération" value={profile.coaching_license_federation} />
              <FieldView label="Expiration" value={profile.coaching_license_expires_at?.slice(0, 10)} />
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Background check</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldView label="Déclaré" value={profile.background_check_declared} />
              <FieldView label="Date" value={profile.background_check_date?.slice(0, 10)} />
              <FieldView label="Expiration" value={profile.background_check_expires?.slice(0, 10)} />
              <FieldView label="Référence" value={profile.background_check_reference} />
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Safeguarding</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldView label="Formation suivie" value={profile.safeguarding_training_completed} />
              <FieldView label="Date formation" value={profile.safeguarding_training_date?.slice(0, 10)} />
              <FieldView label="Expiration" value={profile.safeguarding_training_expires?.slice(0, 10)} />
              <FieldView label="Réf. certificat" value={profile.safeguarding_certificate_ref} />
              <FieldView label="Conforme" value={profile.is_safeguarding_compliant} />
            </div>
          </section>
          <section className="space-y-4">
            <FieldView label="Photo URL" value={profile.photo_url} />
            <FieldView label="Bio" value={profile.bio} />
            <FieldView label="Notes" value={profile.notes} />
          </section>
          {profile.updated_at && (
            <p className="text-xs text-gray-500">
              Dernière mise à jour : {new Date(profile.updated_at).toLocaleString("fr-FR")}
            </p>
          )}
        </div>
      )}

      {editing && (
        <form
          onSubmit={handleSave}
          className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 lg:p-6"
        >
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Fonction</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2">
                <Label>Poste / titre</Label>
                <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Coach principal U15" disabled={saving} />
              </div>
              <div>
                <Label>Années d'expérience</Label>
                <Input type="number" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} disabled={saving} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <Label>Qualifications</Label>
                <Input value={qualifications} onChange={(e) => setQualifications(e.target.value)} disabled={saving} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Identité</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Date de naissance</Label>
                <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} disabled={saving} />
              </div>
              <div>
                <Label>Genre</Label>
                <select className={selectClassName} value={gender} onChange={(e) => setGender((e.target.value as GenderEnum) || "")} disabled={saving}>
                  <option value="">—</option>
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Nationalité (ISO 3166-1)</Label>
                <select className={selectClassName} value={nationality} onChange={(e) => setNationality(e.target.value)} disabled={saving}>
                  <option value="">—</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label} ({c.value})</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Langue préférée (ISO 639-1)</Label>
                <select className={selectClassName} value={lang} onChange={(e) => setLang(e.target.value)} disabled={saving}>
                  <option value="">—</option>
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label} ({l.value})</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Langue secondaire</Label>
                <select className={selectClassName} value={lang2} onChange={(e) => setLang2(e.target.value)} disabled={saving}>
                  <option value="">—</option>
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label} ({l.value})</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Licence coaching</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Niveau</Label>
                <select className={selectClassName} value={licenseLevel} onChange={(e) => setLicenseLevel((e.target.value as CoachingLicenseLevelEnum) || "")} disabled={saving}>
                  <option value="">—</option>
                  {COACHING_LICENSE_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>N° licence</Label>
                <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} disabled={saving} />
              </div>
              <div>
                <Label>Fédération</Label>
                <Input value={licenseFed} onChange={(e) => setLicenseFed(e.target.value)} placeholder="FFF / UEFA" disabled={saving} />
              </div>
              <div>
                <Label>Expiration</Label>
                <Input type="date" value={licenseExp} onChange={(e) => setLicenseExp(e.target.value)} disabled={saving} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Background check</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="bgDeclared" checked={bgDeclared} onChange={(e) => setBgDeclared(e.target.checked)} disabled={saving} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="bgDeclared">Check déclaré</Label>
              </div>
              <div>
                <Label>Date check</Label>
                <Input type="date" value={bgDate} onChange={(e) => setBgDate(e.target.value)} disabled={saving} />
              </div>
              <div>
                <Label>Expiration check</Label>
                <Input type="date" value={bgExpires} onChange={(e) => setBgExpires(e.target.value)} disabled={saving} />
              </div>
              <div className="sm:col-span-2">
                <Label>Référence</Label>
                <Input value={bgRef} onChange={(e) => setBgRef(e.target.value)} disabled={saving} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Safeguarding</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="safeCompleted" checked={safeCompleted} onChange={(e) => setSafeCompleted(e.target.checked)} disabled={saving} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="safeCompleted">Formation suivie</Label>
              </div>
              <div>
                <Label>Date formation</Label>
                <Input type="date" value={safeDate} onChange={(e) => setSafeDate(e.target.value)} disabled={saving} />
              </div>
              <div>
                <Label>Expiration</Label>
                <Input type="date" value={safeExpires} onChange={(e) => setSafeExpires(e.target.value)} disabled={saving} />
              </div>
              <div className="sm:col-span-2">
                <Label>Réf. certificat</Label>
                <Input value={safeRef} onChange={(e) => setSafeRef(e.target.value)} disabled={saving} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <Label>Photo URL</Label>
              <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} disabled={saving} />
            </div>
            <div>
              <Label>Bio</Label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} disabled={saving} className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
            <div>
              <Label>Notes internes</Label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} disabled={saving} className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
            <button type="button" onClick={cancelEdit} disabled={saving} className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-brand-600 disabled:opacity-50">
              Annuler
            </button>
          </div>
        </form>
      )}

      {!profile && !error && (
        <p className="text-sm text-gray-500">Aucun profil à afficher.</p>
      )}
    </div>
  );
}
