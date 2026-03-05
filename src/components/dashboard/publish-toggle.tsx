"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export function PublishToggle({ formId, isPublished }: { formId: string; isPublished: boolean }) {
  const [loading, setLoading] = useState(false);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function toggle() {
    // If published, require confirmation first
    if (isPublished && !confirmUnpublish) {
      setConfirmUnpublish(true);
      return;
    }

    setLoading(true);
    setConfirmUnpublish(false);
    const supabase = createClient();
    const { error } = await supabase
      .from("forms")
      .update({ is_published: !isPublished })
      .eq("id", formId);

    if (error) {
      toast("Failed to update form status.", "error");
    } else {
      toast(isPublished ? "Form unpublished" : "Form published!", "success");
    }
    router.refresh();
    setLoading(false);
  }

  if (confirmUnpublish) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-amber-600 dark:text-amber-400">
          Unpublish? Link will stop working.
        </span>
        <button
          onClick={toggle}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          {loading ? "..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirmUnpublish(false)}
          className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
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
