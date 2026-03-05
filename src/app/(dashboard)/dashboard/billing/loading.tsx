export default function BillingLoading() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse space-y-6">
      <div>
        <div className="h-7 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="h-4 w-56 bg-zinc-100 dark:bg-zinc-800/50 rounded mt-2" />
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
        <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-full" />
        <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-full" />
        <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-full" />
      </div>
      <div className="h-10 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
    </div>
  );
}
