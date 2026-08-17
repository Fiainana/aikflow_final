"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  profilesAdminGetHealthPro,
  profilesAdminUpdateHealthPro,
} from "@/api-client";
import type {
  HealthProProfileResponse,
  HealthProProfileUpdate,
  HealthSpecialtyEnum,
} from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { configureApiClient } from "@/lib/api";
import { apiErrorMessage, emptyToNull, emptyToNumber } from "@/lib/errors";
import {
  COUNTRIES,
  LANGUAGES,
  HEALTH_SPECIALTIES,
  labelOf,
  selectClassName,
} from "@/lib/reference/locale";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";

function FieldView({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean | null;
}) {
  let display = "—";
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

export default function HealthProProfileAdminPage() {
  const params = useParams();
  const userId = String(params?.userId ?? "");
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [profile, setProfile] = useState<HealthProProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [nationality, setNationality] = useState("");
  const [lang, setLang] = useState("");
  const [lang2, setLang2] = useState("");
  const [specialty, setSpecialty] = useState<HealthSpecialtyEnum | "">("");
  const [subSpecialty, setSubSpecialty] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseCountry, setLicenseCountry] = useState("");
  const [licenseExp, setLicenseExp] = useState("");
  const [professionalBody, setProfessionalBody] = useState("");
  const [orgName, setOrgName] = useState("");
  const [practiceCountry, setPracticeCountry] = useState("");
  const [practiceCity, setPracticeCity] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [insProvider, setInsProvider] = useState("");
  const [insNumber, setInsNumber] = useState("");
  const [insExp, setInsExp] = useState("");
  const [bgDeclared, setBgDeclared] = useState(false);
  const [bgDate, setBgDate] = useState("");
  const [bgExpires, setBgExpires] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");

  const fill = (p: HealthProProfileResponse | null) => {
    setNationality(p?.nationality_code ?? "");
    setLang(p?.preferred_language_code ?? "");
    setLang2(p?.secondary_language_code ?? "");
    setSpecialty(p?.specialty ?? "");
    setSubSpecialty(p?.sub_specialty ?? "");
    setLicenseNumber(p?.license_number ?? "");
    setLicenseCountry(p?.license_country_code ?? "");
    setLicenseExp(p?.license_expires_at ? String(p.license_expires_at).slice(0, 10) : "");
    setProfessionalBody(p?.professional_body ?? "");
    setOrgName(p?.organization_name ?? "");
    setPracticeCountry(p?.practice_country_code ?? "");
    setPracticeCity(p?.practice_city ?? "");
    setYearsExp(p?.years_of_experience != null ? String(p.years_of_experience) : "");
    setInsProvider(p?.liability_insurance_provider ?? "");
    setInsNumber(p?.liability_insurance_number ?? "");
    setInsExp(p?.liability_insurance_expires_at ? String(p.liability_insurance_expires_at).slice(0, 10) : "");
    setBgDeclared(p?.background_check_declared ?? false);
    setBgDate(p?.background_check_date ? String(p.background_check_date).slice(0, 10) : "");
    setBgExpires(p?.background_check_expires ? String(p.background_check_expires).slice(0, 10) : "");
    setPhotoUrl(p?.photo_url ?? "");
    setBio(p?.bio ?? "");
    setWebsite(p?.website_url ?? "");
  };

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    configureApiClient();
    const { data, error: err } = await profilesAdminGetHealthPro({
      path: { user_id: userId },
    });
    if (err || !data) {
      setError(apiErrorMessage(err, "Profil pro santé introuvable"));
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
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    configureApiClient();
    const body: HealthProProfileUpdate = {
      nationality_code: emptyToNull(nationality),
      preferred_language_code: emptyToNull(lang),
      secondary_language_code: emptyToNull(lang2),
      specialty: specialty || null,
      sub_specialty: emptyToNull(subSpecialty),
      license_number: emptyToNull(licenseNumber),
      license_country_code: emptyToNull(licenseCountry),
      license_expires_at: emptyToNull(licenseExp),
      professional_body: emptyToNull(professionalBody),
      organization_name: emptyToNull(orgName),
      practice_country_code: emptyToNull(practiceCountry),
      practice_city: emptyToNull(practiceCity),
      years_of_experience: emptyToNumber(yearsExp),
      liability_insurance_provider: emptyToNull(insProvider),
      liability_insurance_number: emptyToNull(insNumber),
      liability_insurance_expires_at: emptyToNull(insExp),
      background_check_declared: bgDeclared,
      background_check_date: emptyToNull(bgDate),
      background_check_expires: emptyToNull(bgExpires),
      photo_url: emptyToNull(photoUrl),
      bio: emptyToNull(bio),
      website_url: emptyToNull(website),
    };
    const { data, error: err } = await profilesAdminUpdateHealthPro({
      path: { user_id: userId },
      body,
    });
    setSaving(false);
    if (err || !data) {
      setError(apiErrorMessage(err, "Échec de la mise à jour"));
      return;
    }
    setProfile(data);
    fill(data);
    setEditing(false);
    setSuccess("Profil pro santé enregistré.");
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
          <Link href="/members" className="text-sm text-gray-500 hover:text-brand-600">← Membres</Link>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">Profil pro santé</h1>
          <p className="mt-1 text-sm text-gray-500">
            User ID <span className="font-mono text-xs">{userId}</span>
            {profile?.specialty ? ` · ${labelOf(HEALTH_SPECIALTIES, profile.specialty)}` : ""}
          </p>
        </div>
        {!editing && profile && (
          <Button type="button" size="sm" onClick={startEdit}>Éditer</Button>
        )}
      </div>

      {error && <div role="alert" className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">{error}</div>}
      {success && <div role="status" className="rounded-lg border border-brand-200 bg-brand-25 px-4 py-3 text-sm text-brand-800">{success}</div>}

      {!editing && profile && (
        <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 lg:p-6">
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Identité & langues</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldView label="Nationalité" value={labelOf(COUNTRIES, profile.nationality_code)} />
              <FieldView label="Langue préférée" value={labelOf(LANGUAGES, profile.preferred_language_code)} />
              <FieldView label="Langue secondaire" value={labelOf(LANGUAGES, profile.secondary_language_code)} />
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Spécialité & licence</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldView label="Spécialité" value={labelOf(HEALTH_SPECIALTIES, profile.specialty)} />
              <FieldView label="Sous-spécialité" value={profile.sub_specialty} />
              <FieldView label="N° licence" value={profile.license_number} />
              <FieldView label="Pays licence" value={labelOf(COUNTRIES, profile.license_country_code)} />
              <FieldView label="Expiration licence" value={profile.license_expires_at?.slice(0, 10)} />
              <FieldView label="Ordre / corps pro" value={profile.professional_body} />
              <FieldView label="Organisation" value={profile.organization_name} />
              <FieldView label="Pays d'exercice" value={labelOf(COUNTRIES, profile.practice_country_code)} />
              <FieldView label="Ville d'exercice" value={profile.practice_city} />
              <FieldView label="Années d'expérience" value={profile.years_of_experience} />
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Assurance & background</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldView label="Assureur RC" value={profile.liability_insurance_provider} />
              <FieldView label="N° assurance" value={profile.liability_insurance_number} />
              <FieldView label="Expiration assurance" value={profile.liability_insurance_expires_at?.slice(0, 10)} />
              <FieldView label="Background check déclaré" value={profile.background_check_declared} />
              <FieldView label="Date check" value={profile.background_check_date?.slice(0, 10)} />
              <FieldView label="Expiration check" value={profile.background_check_expires?.slice(0, 10)} />
            </div>
          </section>
          <section className="space-y-4">
            <FieldView label="Photo URL" value={profile.photo_url} />
            <FieldView label="Site web" value={profile.website_url} />
            <FieldView label="Bio" value={profile.bio} />
          </section>
        </div>
      )}

      {editing && (
        <form onSubmit={handleSave} className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 lg:p-6">
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Identité & langues</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Nationalité</Label>
                <select className={selectClassName} value={nationality} onChange={(e) => setNationality(e.target.value)} disabled={saving}>
                  <option value="">—</option>
                  {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label} ({c.value})</option>)}
                </select>
              </div>
              <div>
                <Label>Langue préférée</Label>
                <select className={selectClassName} value={lang} onChange={(e) => setLang(e.target.value)} disabled={saving}>
                  <option value="">—</option>
                  {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label} ({l.value})</option>)}
                </select>
              </div>
              <div>
                <Label>Langue secondaire</Label>
                <select className={selectClassName} value={lang2} onChange={(e) => setLang2(e.target.value)} disabled={saving}>
                  <option value="">—</option>
                  {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label} ({l.value})</option>)}
                </select>
              </div>
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Spécialité & licence</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Spécialité</Label>
                <select className={selectClassName} value={specialty} onChange={(e) => setSpecialty((e.target.value as HealthSpecialtyEnum) || "")} disabled={saving}>
                  <option value="">—</option>
                  {HEALTH_SPECIALTIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div><Label>Sous-spécialité</Label><Input value={subSpecialty} onChange={(e) => setSubSpecialty(e.target.value)} disabled={saving} /></div>
              <div><Label>N° licence</Label><Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} disabled={saving} /></div>
              <div>
                <Label>Pays licence</Label>
                <select className={selectClassName} value={licenseCountry} onChange={(e) => setLicenseCountry(e.target.value)} disabled={saving}>
                  <option value="">—</option>
                  {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label} ({c.value})</option>)}
                </select>
              </div>
              <div><Label>Expiration licence</Label><Input type="date" value={licenseExp} onChange={(e) => setLicenseExp(e.target.value)} disabled={saving} /></div>
              <div><Label>Ordre / corps pro</Label><Input value={professionalBody} onChange={(e) => setProfessionalBody(e.target.value)} disabled={saving} /></div>
              <div><Label>Organisation</Label><Input value={orgName} onChange={(e) => setOrgName(e.target.value)} disabled={saving} /></div>
              <div>
                <Label>Pays d'exercice</Label>
                <select className={selectClassName} value={practiceCountry} onChange={(e) => setPracticeCountry(e.target.value)} disabled={saving}>
                  <option value="">—</option>
                  {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label} ({c.value})</option>)}
                </select>
              </div>
              <div><Label>Ville d'exercice</Label><Input value={practiceCity} onChange={(e) => setPracticeCity(e.target.value)} disabled={saving} /></div>
              <div><Label>Années d'expérience</Label><Input type="number" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} disabled={saving} /></div>
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Assurance & background</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><Label>Assureur RC</Label><Input value={insProvider} onChange={(e) => setInsProvider(e.target.value)} disabled={saving} /></div>
              <div><Label>N° assurance</Label><Input value={insNumber} onChange={(e) => setInsNumber(e.target.value)} disabled={saving} /></div>
              <div><Label>Expiration assurance</Label><Input type="date" value={insExp} onChange={(e) => setInsExp(e.target.value)} disabled={saving} /></div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="bgH" checked={bgDeclared} onChange={(e) => setBgDeclared(e.target.checked)} disabled={saving} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="bgH">Background check déclaré</Label>
              </div>
              <div><Label>Date check</Label><Input type="date" value={bgDate} onChange={(e) => setBgDate(e.target.value)} disabled={saving} /></div>
              <div><Label>Expiration check</Label><Input type="date" value={bgExpires} onChange={(e) => setBgExpires(e.target.value)} disabled={saving} /></div>
            </div>
          </section>
          <section className="space-y-4">
            <div><Label>Photo URL</Label><Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} disabled={saving} /></div>
            <div><Label>Site web</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} disabled={saving} /></div>
            <div>
              <Label>Bio</Label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} disabled={saving} className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
          </section>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="sm" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
            <button type="button" onClick={cancelEdit} disabled={saving} className="text-sm font-medium text-gray-600 hover:text-brand-600">Annuler</button>
          </div>
        </form>
      )}
    </div>
  );
}
