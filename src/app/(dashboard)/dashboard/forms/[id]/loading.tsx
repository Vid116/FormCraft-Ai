export default function FormDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-64 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-4 w-40 bg-zinc-100 dark:bg-zinc-800/50 rounded mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-9 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
        ))}
      </div>
    </div>
  );
}
