export default function AccountLoading() {
  return (
    <div className="max-w-xl mx-auto animate-pulse space-y-6">
      <div>
        <div className="h-7 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="h-4 w-48 bg-zinc-100 dark:bg-zinc-800/50 rounded mt-2" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3"
        >
          <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-9 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
