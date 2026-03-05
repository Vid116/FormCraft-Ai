import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-7xl font-bold text-zinc-200 dark:text-zinc-800">404</p>
      <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        This dashboard page doesn&apos;t exist.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
