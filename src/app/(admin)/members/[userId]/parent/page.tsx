"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  profilesAdminGetParent,
  profilesAdminUpdateParent,
} from "@/api-client";
import type { ParentProfileResponse, ParentProfileUpdate } from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { configureApiClient } from "@/lib/api";
import { apiErrorMessage, emptyToNull } from "@/lib/errors";
import {
  COUNTRIES,
  LANGUAGES,
  CONTACT_METHODS,
  labelOf,
  selectClassName,
} from "@/lib/reference/locale";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";

function FieldView({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm text-gray-900 dark:text-white">{value ? value : "—"}</p>
    </div>
  );
}

export default function ParentProfileAdminPage() {
  const params = useParams();
  const userId = String(params?.userId ?? "");
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [profile, setProfile] = useState<ParentProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [nationality, setNationality] = useState("");
  const [lang, setLang] = useState("");
  const [dob, setDob] = useState("");
  const [addr1, setAddr1] = useState("");
  const [addr2, setAddr2] = useState("");
  const [city, setCity] = useState("");
  const [stateProv, setStateProv] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("");
  const [secPhone, setSecPhone] = useState("");
  const [emPhone, setEmPhone] = useState("");
  const [workPhone, setWorkPhone] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [occupation, setOccupation] = useState("");
  const [notes, setNotes] = useState("");

  const fill = (p: ParentProfileResponse | null) => {
    setNationality(p?.nationality_code ?? "");
    setLang(p?.preferred_language_code ?? "");
    setDob(p?.date_of_birth ? p.date_of_birth.slice(0, 10) : "");
    setAddr1(p?.address_line1 ?? "");
    setAddr2(p?.address_line2 ?? "");
    setCity(p?.city ?? "");
    setStateProv(p?.state_province ?? "");
    setPostal(p?.postal_code ?? "");
    setCountry(p?.country_code ?? "");
    setSecPhone(p?.secondary_phone ?? "");
    setEmPhone(p?.emergency_phone ?? "");
    setWorkPhone(p?.work_phone ?? "");
    setContactMethod(p?.preferred_contact_method ?? "");
    setOccupation(p?.occupation ?? "");
    setNotes(p?.notes ?? "");
  };

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    configureApiClient();
    const { data, error: err } = await profilesAdminGetParent({
      path: { user_id: userId },
    });
    if (err || !data) {
      setError(apiErrorMessage(err, "Profil parent introuvable"));
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
    const body: ParentProfileUpdate = {
      nationality_code: emptyToNull(nationality),
      preferred_language_code: emptyToNull(lang),
      date_of_birth: emptyToNull(dob),
      address_line1: emptyToNull(addr1),
      address_line2: emptyToNull(addr2),
      city: emptyToNull(city),
      state_province: emptyToNull(stateProv),
      postal_code: emptyToNull(postal),
      country_code: emptyToNull(country),
      secondary_phone: emptyToNull(secPhone),
      emergency_phone: emptyToNull(emPhone),
      work_phone: emptyToNull(workPhone),
      preferred_contact_method: emptyToNull(contactMethod),
      occupation: emptyToNull(occupation),
      notes: emptyToNull(notes),
    };
    const { data, error: err } = await profilesAdminUpdateParent({
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
    setSuccess("Profil parent enregistré.");
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
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">Profil parent</h1>
          <p className="mt-1 text-sm text-gray-500">User ID <span className="font-mono text-xs">{userId}</span></p>
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
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Identité</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldView label="Date de naissance" value={profile.date_of_birth?.slice(0, 10)} />
              <FieldView label="Nationalité" value={labelOf(COUNTRIES, profile.nationality_code)} />
              <FieldView label="Langue" value={labelOf(LANGUAGES, profile.preferred_language_code)} />
              <FieldView label="Profession" value={profile.occupation} />
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Adresse</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldView label="Ligne 1" value={profile.address_line1} />
              <FieldView label="Ligne 2" value={profile.address_line2} />
              <FieldView label="Ville" value={profile.city} />
              <FieldView label="Région / état" value={profile.state_province} />
              <FieldView label="Code postal" value={profile.postal_code} />
              <FieldView label="Pays" value={labelOf(COUNTRIES, profile.country_code)} />
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Contacts</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldView label="Téléphone secondaire" value={profile.secondary_phone} />
              <FieldView label="Téléphone urgence" value={profile.emergency_phone} />
              <FieldView label="Téléphone pro" value={profile.work_phone} />
              <FieldView label="Méthode préférée" value={labelOf(CONTACT_METHODS, profile.preferred_contact_method)} />
            </div>
          </section>
          <FieldView label="Notes" value={profile.notes} />
        </div>
      )}

      {editing && (
        <form onSubmit={handleSave} className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 lg:p-6">
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Identité</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Date de naissance</Label>
                <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} disabled={saving} />
              </div>
              <div>
                <Label>Nationalité</Label>
                <select className={selectClassName} value={nationality} onChange={(e) => setNationality(e.target.value)} disabled={saving}>
                  <option value="">—</option>
                  {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label} ({c.value})</option>)}
                </select>
              </div>
              <div>
                <Label>Langue</Label>
                <select className={selectClassName} value={lang} onChange={(e) => setLang(e.target.value)} disabled={saving}>
                  <option value="">—</option>
                  {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label} ({l.value})</option>)}
                </select>
              </div>
              <div>
                <Label>Profession</Label>
                <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} disabled={saving} />
              </div>
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Adresse</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2"><Label>Ligne 1</Label><Input value={addr1} onChange={(e) => setAddr1(e.target.value)} disabled={saving} /></div>
              <div><Label>Ligne 2</Label><Input value={addr2} onChange={(e) => setAddr2(e.target.value)} disabled={saving} /></div>
              <div><Label>Ville</Label><Input value={city} onChange={(e) => setCity(e.target.value)} disabled={saving} /></div>
              <div><Label>Région / état</Label><Input value={stateProv} onChange={(e) => setStateProv(e.target.value)} disabled={saving} /></div>
              <div><Label>Code postal</Label><Input value={postal} onChange={(e) => setPostal(e.target.value)} disabled={saving} /></div>
              <div>
                <Label>Pays</Label>
                <select className={selectClassName} value={country} onChange={(e) => setCountry(e.target.value)} disabled={saving}>
                  <option value="">—</option>
                  {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label} ({c.value})</option>)}
                </select>
              </div>
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Contacts</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><Label>Téléphone secondaire</Label><Input value={secPhone} onChange={(e) => setSecPhone(e.target.value)} disabled={saving} /></div>
              <div><Label>Téléphone urgence</Label><Input value={emPhone} onChange={(e) => setEmPhone(e.target.value)} disabled={saving} /></div>
              <div><Label>Téléphone pro</Label><Input value={workPhone} onChange={(e) => setWorkPhone(e.target.value)} disabled={saving} /></div>
              <div>
                <Label>Méthode préférée</Label>
                <select className={selectClassName} value={contactMethod} onChange={(e) => setContactMethod(e.target.value)} disabled={saving}>
                  <option value="">—</option>
                  {CONTACT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>
          </section>
          <div>
            <Label>Notes</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} disabled={saving} className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="sm" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
            <button type="button" onClick={cancelEdit} disabled={saving} className="text-sm font-medium text-gray-600 hover:text-brand-600">Annuler</button>
          </div>
        </form>
      )}
    </div>
  );
}
