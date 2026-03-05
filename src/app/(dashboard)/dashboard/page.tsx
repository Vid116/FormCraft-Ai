import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FormSearch } from "@/components/dashboard/form-search";
import type { Metadata } from "next";
import type { Form } from "@/lib/types/form";

export const metadata: Metadata = {
  title: "My Forms - FormPoki Fat",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: forms } = await supabase
    .from("forms")
    .select("*")
    .order("updated_at", { ascending: false });

  const typedForms = (forms ?? []) as Form[];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            My Forms
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Create, manage, and analyze your forms
          </p>
        </div>
        <Link
          href="/dashboard/forms/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Form
        </Link>
      </div>

      {typedForms.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
          <div className="text-4xl mb-4">📝</div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            No forms yet
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto">
            Describe what you need and AI will generate a complete form for you in seconds.
          </p>
          <Link
            href="/dashboard/forms/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Create your first form
          </Link>
        </div>
      ) : (
        <FormSearch forms={typedForms} />
      )}
    </div>
  );
}

