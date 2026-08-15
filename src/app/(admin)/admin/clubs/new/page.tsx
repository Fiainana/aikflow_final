"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminorgsCreateClubByAdmin } from "@/api-client";
import type { AdminCreateClubResponse, ErrorDetail } from "@/api-client";
import { useAuth } from "@/context/AuthContext";
import { configureApiClient } from "@/lib/api";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";

export default function NewClubPage() {
  const router = useRouter();
  const { isSuperAdmin, isLoading: authLoading } = useAuth();
  const [clubName, setClubName] = useState("");
  const [sport, setSport] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<AdminCreateClubResponse | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    configureApiClient();
    const { data, error: err } = await adminorgsCreateClubByAdmin({
      body: {
        club_name: clubName.trim(),
        sport: sport.trim() || undefined,
        admin_first_name: adminFirstName.trim(),
        admin_last_name: adminLastName.trim(),
        admin_email: adminEmail.trim(),
      },
    });
    setSubmitting(false);
    if (err || !data) {
      const e = err as ErrorDetail;
      setError(
        typeof e?.detail === "string"
          ? e.detail
          : "Échec de la création du club"
      );
      return;
    }
    setCreated(data);
  };

  if (authLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-error-700">
        Accès réservé au Super Administrateur.
      </div>
    );
  }

  if (created) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="rounded-xl border border-brand-200 bg-brand-25 p-6 dark:border-brand-800 dark:bg-brand-500/10">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Club créé
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <strong>{created.name}</strong> ({created.slug}) — sport :{" "}
            {created.sport}
          </p>
          <div className="mt-4 rounded-lg bg-white/80 p-4 dark:bg-gray-900/50">
            <p className="text-xs font-medium uppercase text-gray-500">
              Compte admin club
            </p>
            <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">
              {created.admin_email}
            </p>
            <p className="mt-2 text-xs font-medium uppercase text-gray-500">
              Mot de passe généré (à transmettre une seule fois)
            </p>
            <p className="mt-1 font-mono text-sm text-brand-700 dark:text-brand-400 break-all">
              {created.generated_password}
            </p>
          </div>
          <div className="mt-6 flex gap-3">
            <Button
              size="sm"
              type="button"
              onClick={() => router.push("/admin/clubs")}
            >
              Retour à la liste
            </Button>
            <Link
              href={`/admin/clubs/${created.id}`}
              className="inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Voir le détail
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href="/admin/clubs"
          className="text-sm text-gray-500 hover:text-brand-600"
        >
          ← Clubs
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
          Créer un club
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Crée l'organisation et le compte administrateur club.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
      >
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700"
          >
            {error}
          </div>
        )}
        <div>
          <Label>
            Nom du club <span className="text-error-500">*</span>
          </Label>
          <Input
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
            placeholder="FC Exemple"
            disabled={submitting}
          />
        </div>
        <div>
          <Label>Sport</Label>
          <Input
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            placeholder="Football"
            disabled={submitting}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>
              Prénom admin <span className="text-error-500">*</span>
            </Label>
            <Input
              value={adminFirstName}
              onChange={(e) => setAdminFirstName(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div>
            <Label>
              Nom admin <span className="text-error-500">*</span>
            </Label>
            <Input
              value={adminLastName}
              onChange={(e) => setAdminLastName(e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>
        <div>
          <Label>
            Email admin club <span className="text-error-500">*</span>
          </Label>
          <Input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="admin@club.fr"
            disabled={submitting}
          />
        </div>
        <Button type="submit" size="sm" className="w-full" disabled={submitting}>
          {submitting ? "Création…" : "Créer le club"}
        </Button>
      </form>
    </div>
  );
}
