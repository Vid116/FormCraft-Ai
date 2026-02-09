import Link from "next/link";
import type { Form } from "@/lib/types/form";

export function FormCard({ form }: { form: Form }) {
  const fieldCount = form.fields?.length ?? 0;
  const createdDate = new Date(form.created_at).toLocaleDateString();

  return (
    <Link
      href={`/dashboard/forms/${form.id}`}
      className="block p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors truncate mr-2">
          {form.title}
        </h3>
        <span
          className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
            form.is_published
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          {form.is_published ? "Live" : "Draft"}
        </span>
      </div>

      {form.description && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-2">
          {form.description}
        </p>
      )}

      <div className="flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500">
        <span>{fieldCount} fields</span>
        <span>{form.response_count ?? 0} responses</span>
        <span>{createdDate}</span>
      </div>
    </Link>
  );
}
