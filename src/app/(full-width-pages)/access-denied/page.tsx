"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getRoles } from "@/lib/auth";
import Button from "@/components/ui/button/Button";

export default function AccessDeniedPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const roles = getRoles(user);

  const handleLogout = async () => {
    await logout();
    router.replace("/signin");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18A2 2 0 003.54 21H20.46A2 2 0 0022.18 18L13.71 3.86A2 2 0 0010.29 3.86Z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Accès non autorisé
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Ce portail web est réservé aux <strong>admins club</strong>,{" "}
          <strong>coachs</strong> et <strong>staff</strong>.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Les comptes <strong>athlète</strong> et <strong>parent</strong>{" "}
          utilisent l'application mobile Aikflow.
        </p>

        {roles.length > 0 && (
          <p className="mt-4 text-xs text-gray-500">
            Rôle(s) détecté(s) :{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {roles.map((r) => r.replace(/_/g, " ")).join(", ")}
            </span>
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
            Autre compte
          </Link>
        </div>
      </div>
    </div>
  );
}
