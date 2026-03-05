"use client";

import { useState } from "react";
import type { Form } from "@/lib/types/form";
import { FormCard } from "@/components/dashboard/form-card";

export function FormSearch({ forms }: { forms: Form[] }) {
  const [query, setQuery] = useState("");

  const filtered = query
    ? forms.filter(
        (f) =>
          f.title.toLowerCase().includes(query.toLowerCase()) ||
          f.description?.toLowerCase().includes(query.toLowerCase())
      )
    : forms;

  return (
    <>
      <div className="relative mb-6">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search forms..."
          className="w-full pl-10 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search forms"
        />
        {query && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {filtered.length === 0 && query ? (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          <p className="text-sm">No forms matching &ldquo;{query}&rdquo;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((form) => (
            <FormCard key={form.id} form={form} />
          ))}
        </div>
      )}
    </>
  );
}
