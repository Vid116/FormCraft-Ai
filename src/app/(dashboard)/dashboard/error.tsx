"use client";

import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-5xl font-bold text-red-200 dark:text-red-900">Oops</p>
      <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-md text-center">
        There was a problem loading this page. Please try again or go back to the dashboard.
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
          Error ID: {error.digest}
        </p>
      )}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
