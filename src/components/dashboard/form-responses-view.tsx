"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Form, FormResponse } from "@/lib/types/form";

export function FormResponsesView({ form, responses: initialResponses }: { form: Form; responses: FormResponse[] }) {
  const [responses, setResponses] = useState<FormResponse[]>(initialResponses);
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [newResponseId, setNewResponseId] = useState<string | null>(null);

  // Supabase realtime subscription for new responses
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`responses:${form.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "responses",
          filter: `form_id=eq.${form.id}`,
        },
        (payload) => {
          const newResponse = payload.new as FormResponse;
          setResponses((prev) => [newResponse, ...prev]);
          setNewResponseId(newResponse.id);
          setTimeout(() => setNewResponseId(null), 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [form.id]);

  function exportCSV() {
    const escapeCsv = (val: string) => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const headers = ["#", ...form.fields.map((f) => f.label), "Date"];
    const rows = responses.map((response, index) => {
      const cells = form.fields.map((field) => {
        const val = response.answers[field.id];
        if (val && typeof val === "object" && "score" in (val as Record<string, unknown>)) {
          const r = val as { score: number; comment?: string };
          return r.comment ? `${r.score} - ${r.comment}` : String(r.score);
        }
        if (Array.isArray(val)) return val.join("; ");
        return String(val ?? "");
      });
      return [
        String(index + 1),
        ...cells,
        new Date(response.submitted_at).toLocaleDateString(),
      ];
    });

    const csv = [headers.map(escapeCsv).join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.title.replace(/[^a-zA-Z0-9]/g, "_")}_responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function generateSummary() {
    setLoadingSummary(true);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_title: form.title,
          fields: form.fields,
          responses,
        }),
      });
      const data = await res.json();
      setSummary(data.summary);
    } catch {
      setSummary("Failed to generate summary. Please try again.");
    } finally {
      setLoadingSummary(false);
    }
  }

  if (responses.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
        <div className="text-3xl mb-3">📭</div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          No responses yet
        </h3>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          Publish your form and share the link to start collecting responses.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            AI Summary
          </h3>
          <button
            onClick={generateSummary}
            disabled={loadingSummary}
            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
          >
            {loadingSummary ? "Analyzing..." : summary ? "Refresh" : "Generate"}
          </button>
        </div>
        {summary ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
            {summary}
          </div>
        ) : (
          <p className="text-sm text-zinc-400">
            Click &quot;Generate&quot; to get an AI-powered summary of your responses.
          </p>
        )}
      </div>

      {/* Response table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Responses ({responses.length})
          </h3>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
            <button
              onClick={exportCSV}
              className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase">
                  #
                </th>
                {form.fields.slice(0, 5).map((field) => (
                  <th
                    key={field.id}
                    className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase truncate max-w-[200px]"
                  >
                    {field.label}
                  </th>
                ))}
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {responses.map((response, index) => (
                <tr
                  key={response.id}
                  className={`border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 transition-colors duration-1000 ${
                    newResponseId === response.id
                      ? "bg-emerald-50 dark:bg-emerald-950/30"
                      : ""
                  }`}
                >
                  <td className="px-4 py-2.5 text-zinc-400">
                    {newResponseId === response.id && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                    )}
                    {index + 1}
                  </td>
                  {form.fields.slice(0, 5).map((field) => {
                    const val = response.answers[field.id];
                    let display: string;
                    if (val && typeof val === "object" && "score" in (val as Record<string, unknown>)) {
                      const r = val as { score: number; comment?: string };
                      display = r.comment ? `${r.score} — "${r.comment}"` : String(r.score);
                    } else {
                      display = String(val ?? "-");
                    }
                    return (
                      <td
                        key={field.id}
                        className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]"
                        title={display}
                      >
                        {display}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 text-zinc-400 text-xs">
                    {new Date(response.submitted_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
