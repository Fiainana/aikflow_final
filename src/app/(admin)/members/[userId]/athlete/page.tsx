"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  profilesAdminGetAthlete,
  profilesAdminUpdateAthlete,
} from "@/api-client";
import type {
  AthleteProfileResponse,
  AthleteProfileUpdate,
  GenderEnum,
  DominantSideEnum,
  BloodTypeEnum,
} from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { configureApiClient } from "@/lib/api";
import { apiErrorMessage, emptyToNull, emptyToNumber } from "@/lib/errors";
import {
  COUNTRIES,
  LANGUAGES,
  GENDERS,
  DOMINANT_SIDES,
  BLOOD_TYPES,
  labelOf,
  selectClassName,
} from "@/lib/reference/locale";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";

function FieldView({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm text-gray-900 dark:text-white">{value != null && value !== "" ? String(value) : "—"}</p>
    </div>
  );
}

export default function AthleteProfileAdminPage() {
  const params = useParams();
  const userId = String(params?.userId ?? "");
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [profile, setProfile] = useState<AthleteProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<GenderEnum | "">("");
  const [nationality, setNationality] = useState("");
  const [nationality2, setNationality2] = useState("");
  const [placeBirth, setPlaceBirth] = useState("");
  const [countryBirth, setCountryBirth] = useState("");
  const [lang, setLang] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [side, setSide] = useState<DominantSideEnum | "">("");
  const [blood, setBlood] = useState<BloodTypeEnum | "">("");
  const [jersey, setJersey] = useState("");
  const [position, setPosition] = useState("");
  const [positionGroup, setPositionGroup] = useState("");
  const [position2, setPosition2] = useState("");
  const [fedLicense, setFedLicense] = useState("");
  const [fedName, setFedName] = useState("");
  const [licenseExp, setLicenseExp] = useState("");
  const [emName, setEmName] = useState("");
  const [emPhone, setEmPhone] = useState("");
  const [emRel, setEmRel] = useState("");
  const [school, setSchool] = useState("");
  const [schoolLevel, setSchoolLevel] = useState("");
  const [academic, setAcademic] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [bio, setBio] = useState("");
  const [notes, setNotes] = useState("");

  const fill = (p: AthleteProfileResponse | null) => {
    setDob(p?.date_of_birth ? p.date_of_birth.slice(0, 10) : "");
    setGender(p?.gender ?? "");
    setNationality(p?.nationality_code ?? "");
    setNationality2(p?.second_nationality_code ?? "");
    setPlaceBirth(p?.place_of_birth ?? "");
    setCountryBirth(p?.country_of_birth_code ?? "");
    setLang(p?.preferred_language_code ?? "");
    setHeight(p?.height_cm != null ? String(p.height_cm) : "");
    setWeight(p?.weight_kg != null ? String(p.weight_kg) : "");
    setSide(p?.dominant_side ?? "");
    setBlood(p?.blood_type ?? "");
    setJersey(p?.jersey_number != null ? String(p.jersey_number) : "");
    setPosition(p?.position ?? "");
    setPositionGroup(p?.position_group ?? "");
    setPosition2(p?.secondary_position ?? "");
    setFedLicense(p?.federation_license_number ?? "");
    setFedName(p?.federation_name ?? "");
    setLicenseExp(p?.license_expires_at ? p.license_expires_at.slice(0, 10) : "");
    setEmName(p?.emergency_contact_name ?? "");
    setEmPhone(p?.emergency_contact_phone ?? "");
    setEmRel(p?.emergency_contact_relationship ?? "");
    setSchool(p?.school_name ?? "");
    setSchoolLevel(p?.school_level ?? "");
    setAcademic(p?.academic_workload_note ?? "");
    setPhotoUrl(p?.photo_url ?? "");
    setBio(p?.bio ?? "");
    setNotes(p?.notes ?? "");
  };

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    configureApiClient();
    const { data, error: err } = await profilesAdminGetAthlete({
      path: { user_id: userId },
    });
    if (err || !data) {
      setError(
        apiErrorMessage(
          err,
          "Profil athlète introuvable (créez d'abord le membre avec le rôle ATHLETE)"
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

    const body: AthleteProfileUpdate = {
      date_of_birth: emptyToNull(dob),
      gender: gender || null,
      nationality_code: emptyToNull(nationality),
      second_nationality_code: emptyToNull(nationality2),
      place_of_birth: emptyToNull(placeBirth),
      country_of_birth_code: emptyToNull(countryBirth),
      preferred_language_code: emptyToNull(lang),
      height_cm: emptyToNumber(height),
      weight_kg: emptyToNumber(weight),
      dominant_side: side || null,
      blood_type: blood || null,
      jersey_number: emptyToNumber(jersey),
      position: emptyToNull(position),
      position_group: emptyToNull(positionGroup),
      secondary_position: emptyToNull(position2),
      federation_license_number: emptyToNull(fedLicense),
      federation_name: emptyToNull(fedName),
      license_expires_at: emptyToNull(licenseExp),
      emergency_contact_name: emptyToNull(emName),
      emergency_contact_phone: emptyToNull(emPhone),
      emergency_contact_relationship: emptyToNull(emRel),
      school_name: emptyToNull(school),
      school_level: emptyToNull(schoolLevel),
      academic_workload_note: emptyToNull(academic),
      photo_url: emptyToNull(photoUrl),
      bio: emptyToNull(bio),
      notes: emptyToNull(notes),
    };

    const { data, error: err } = await profilesAdminUpdateAthlete({
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
    setSuccess("Profil athlète enregistré.");
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
            Profil athlète
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            User ID <span className="font-mono text-xs">{userId}</span>
            {profile?.age != null ? ` · ${profile.age} ans` : ""}
            {profile?.is_minor ? " · Mineur" : ""}
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
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Identité sportive</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldView label="Date de naissance" value={profile.date_of_birth?.slice(0, 10)} />
              <FieldView label="Genre" value={labelOf(GENDERS, profile.gender)} />
              <FieldView label="Nationalité" value={labelOf(COUNTRIES, profile.nationality_code)} />
              <FieldView label="2e nationalité" value={labelOf(COUNTRIES, profile.second_nationality_code)} />
              <FieldView label="Lieu de naissance" value={profile.place_of_birth} />
              <FieldView label="Pays de naissance" value={labelOf(COUNTRIES, profile.country_of_birth_code)} />
              <FieldView label="Langue" value={labelOf(LANGUAGES, profile.preferred_language_code)} />
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Physique & poste</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldView label="Taille (cm)" value={profile.height_cm} />
              <FieldView label="Poids (kg)" value={profile.weight_kg} />
              <FieldView label="Côté dominant" value={labelOf(DOMINANT_SIDES, profile.dominant_side)} />
              <FieldView label="N° maillot" value={profile.jersey_number} />
              <FieldView label="Poste" value={profile.position} />
              <FieldView label="Groupe de poste" value={profile.position_group} />
              <FieldView label="Poste secondaire" value={profile.secondary_position} />
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Licence fédération</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldView label="N° licence" value={profile.federation_license_number} />
              <FieldView label="Fédération" value={profile.federation_name} />
              <FieldView label="Expiration" value={profile.license_expires_at?.slice(0, 10)} />
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Contact d'urgence</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <FieldView label="Nom" value={profile.emergency_contact_name} />
              <FieldView label="Téléphone" value={profile.emergency_contact_phone} />
              <FieldView label="Lien" value={profile.emergency_contact_relationship} />
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Scolarité</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldView label="Établissement" value={profile.school_name} />
              <FieldView label="Niveau" value={profile.school_level} />
              <FieldView label="Charge scolaire" value={profile.academic_workload_note} />
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Santé</h2>
            <FieldView label="Groupe sanguin" value={labelOf(BLOOD_TYPES, profile.blood_type)} />
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
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Identité sportive</h2>
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
                <Label>2e nationalité</Label>
                <select className={selectClassName} value={nationality2} onChange={(e) => setNationality2(e.target.value)} disabled={saving}>
                  <option value="">—</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label} ({c.value})</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Lieu de naissance</Label>
                <Input value={placeBirth} onChange={(e) => setPlaceBirth(e.target.value)} disabled={saving} />
              </div>
              <div>
                <Label>Pays de naissance</Label>
                <select className={selectClassName} value={countryBirth} onChange={(e) => setCountryBirth(e.target.value)} disabled={saving}>
                  <option value="">—</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label} ({c.value})</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Langue (ISO 639-1)</Label>
                <select className={selectClassName} value={lang} onChange={(e) => setLang(e.target.value)} disabled={saving}>
                  <option value="">—</option>
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label} ({l.value})</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Physique & poste</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Taille (cm)</Label>
                <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} disabled={saving} />
              </div>
              <div>
                <Label>Poids (kg)</Label>
                <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} disabled={saving} />
              </div>
              <div>
                <Label>Côté dominant</Label>
                <select className={selectClassName} value={side} onChange={(e) => setSide((e.target.value as DominantSideEnum) || "")} disabled={saving}>
                  <option value="">—</option>
                  {DOMINANT_SIDES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>N° maillot</Label>
                <Input type="number" value={jersey} onChange={(e) => setJersey(e.target.value)} disabled={saving} />
              </div>
              <div>
                <Label>Poste</Label>
                <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Milieu" disabled={saving} />
              </div>
              <div>
                <Label>Groupe de poste</Label>
                <Input value={positionGroup} onChange={(e) => setPositionGroup(e.target.value)} disabled={saving} />
              </div>
              <div>
                <Label>Poste secondaire</Label>
                <Input value={position2} onChange={(e) => setPosition2(e.target.value)} disabled={saving} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Licence fédération</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>N° licence</Label>
                <Input value={fedLicense} onChange={(e) => setFedLicense(e.target.value)} disabled={saving} />
              </div>
              <div>
                <Label>Fédération</Label>
                <Input value={fedName} onChange={(e) => setFedName(e.target.value)} disabled={saving} />
              </div>
              <div>
                <Label>Expiration licence</Label>
                <Input type="date" value={licenseExp} onChange={(e) => setLicenseExp(e.target.value)} disabled={saving} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Contact d'urgence</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Nom</Label>
                <Input value={emName} onChange={(e) => setEmName(e.target.value)} disabled={saving} />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input value={emPhone} onChange={(e) => setEmPhone(e.target.value)} disabled={saving} />
              </div>
              <div>
                <Label>Lien</Label>
                <Input value={emRel} onChange={(e) => setEmRel(e.target.value)} placeholder="Parent" disabled={saving} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Scolarité</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Établissement</Label>
                <Input value={school} onChange={(e) => setSchool(e.target.value)} disabled={saving} />
              </div>
              <div>
                <Label>Niveau</Label>
                <Input value={schoolLevel} onChange={(e) => setSchoolLevel(e.target.value)} disabled={saving} />
              </div>
              <div className="sm:col-span-2">
                <Label>Charge scolaire (note)</Label>
                <Input value={academic} onChange={(e) => setAcademic(e.target.value)} disabled={saving} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Santé (données sensibles)</h2>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Groupe sanguin : accès restreint selon permissions club / privacy-by-design.
            </p>
            <div className="max-w-xs">
              <Label>Groupe sanguin</Label>
              <select className={selectClassName} value={blood} onChange={(e) => setBlood((e.target.value as BloodTypeEnum) || "")} disabled={saving}>
                <option value="">—</option>
                {BLOOD_TYPES.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <Label>Photo URL</Label>
              <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} disabled={saving} />
            </div>
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
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-brand-600 disabled:opacity-50"
            >
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
