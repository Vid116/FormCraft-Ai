export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mt-2" />
        </div>
        <div className="h-10 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3"
          >
            <div className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-1/2 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
            <div className="h-4 w-1/3 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
