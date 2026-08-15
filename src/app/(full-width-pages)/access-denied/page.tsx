"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getRoles, isBlockedPortalUser } from "@/lib/auth";
import Button from "@/components/ui/button/Button";

const ROLE_LABELS: Record<string, string> = {
  ATHLETE: "Athlète",
  PARENT: "Parent",
  CLUB_ADMIN: "Admin club",
  COACH: "Coach",
  ASSISTANT_COACH: "Assistant coach",
  STAFF: "Staff",
  SUPER_ADMIN: "Super Admin",
  HEALTH_PRO: "Professionnel de santé",
  MARKETPLACE_PRO: "Marketplace",
};

export default function AccessDeniedPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const roles = getRoles(user);
  const isAthleteOrParent = isBlockedPortalUser(user);

  const handleLogout = async () => {
    await logout();
    router.replace("/signin");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              fill="currentColor"
            />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Vous n'avez pas l'autorisation d'accéder à cette page
        </h1>

        {isAthleteOrParent ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Votre compte est un compte{" "}
              <strong className="text-gray-800 dark:text-gray-200">
                {roles
                  .map((r) => ROLE_LABELS[r] ?? r)
                  .join(" / ")}
              </strong>
              .
            </p>
            <div className="mt-4 rounded-xl border border-brand-200 bg-brand-25 px-4 py-4 dark:border-brand-800 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-brand-800 dark:text-brand-300">
                Utilisez l'application mobile Aikflow
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-brand-700 dark:text-brand-400">
                Le portail web est réservé aux coaches, admins club et staff.
                Les athlètes et les parents doivent se connecter via
                l'application mobile pour consulter le wellness, les
                séances et les informations de l'équipe.
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Ce portail web est réservé aux <strong>admins club</strong>,{" "}
              <strong>coachs</strong> et <strong>staff</strong>.
            </p>
            <div className="mt-4 rounded-xl border border-brand-200 bg-brand-25 px-4 py-4 dark:border-brand-800 dark:bg-brand-500/10">
              <p className="text-sm font-semibold text-brand-800 dark:text-brand-300">
                Utilisez l'application mobile Aikflow
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-brand-700 dark:text-brand-400">
                Si vous êtes athlète ou parent, connectez-vous avec
                l'application mobile pour accéder à vos fonctionnalités.
              </p>
            </div>
          </>
        )}

        {roles.length > 0 && !isAthleteOrParent && (
          <p className="mt-4 text-xs text-gray-500">
            Rôle(s) détecté(s) :{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {roles.map((r) => ROLE_LABELS[r] ?? r).join(", ")}
            </span>
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            size="sm"
            type="button"
            disabled={isLoading}
            onClick={handleLogout}
            className="w-full sm:w-auto"
          >
            Se déconnecter
          </Button>
          <Link
            href="/signin"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Se connecter avec un autre compte
          </Link>
        </div>
      </div>
    </div>
  );
}
