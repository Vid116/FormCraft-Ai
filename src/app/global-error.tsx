"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
          <div className="text-center">
            <p className="text-5xl font-bold text-red-200 dark:text-red-900">Error</p>
            <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Something went wrong
            </h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400 max-w-sm">
              An unexpected error occurred. Please try again.
            </p>
            {error.digest && (
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              className="mt-6 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
