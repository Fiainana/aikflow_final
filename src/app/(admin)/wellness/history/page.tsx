"use client";

import Link from "next/link";

export default function WellnessHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Historique wellness
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Consultez le radar du jour ou le détail d'un athlète. L'historique
          personnel athlète reste sur l'application mobile.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/wellness/radar"
          className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-brand-300 dark:border-gray-800 dark:bg-gray-900"
        >
          <p className="font-semibold text-gray-900 dark:text-white">Radar du jour</p>
          <p className="mt-1 text-sm text-gray-500">
            Scores collectifs, alertes baisse, non-réponses
          </p>
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-brand-300 dark:border-gray-800 dark:bg-gray-900"
        >
          <p className="font-semibold text-gray-900 dark:text-white">Brief du jour</p>
          <p className="mt-1 text-sm text-gray-500">
            Vue coach priorisée par criticité
          </p>
        </Link>
      </div>
    </div>
  );
}
