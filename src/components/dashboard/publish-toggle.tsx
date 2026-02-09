"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function PublishToggle({ formId, isPublished }: { formId: string; isPublished: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("forms")
      .update({ is_published: !isPublished })
      .eq("id", formId);
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        isPublished
          ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700"
          : "bg-green-600 hover:bg-green-700 text-white"
      }`}
    >
      {loading ? "..." : isPublished ? "Unpublish" : "Publish"}
    </button>
  );
}
