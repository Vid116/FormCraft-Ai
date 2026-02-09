"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import type { Form } from "@/lib/types/form";

export function DuplicateFormButton({ form }: { form: Form }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function duplicate() {
    setLoading(true);
    try {
      const supabase = createClient();
      const newId = uuidv4();
      const { error } = await supabase.from("forms").insert({
        id: newId,
        user_id: form.user_id,
        title: `${form.title} (Copy)`,
        description: form.description,
        fields: form.fields,
        settings: form.settings,
        is_published: false,
        response_count: 0,
      });
      if (error) throw error;
      router.push(`/dashboard/forms/${newId}`);
    } catch {
      alert("Failed to duplicate form. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={duplicate}
      disabled={loading}
      className="px-4 py-2 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300 disabled:opacity-50"
    >
      {loading ? "Duplicating..." : "Duplicate"}
    </button>
  );
}
