"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Form, FormField, FormResponse } from "@/lib/types/form";

// ─── Bar chart color palette ───
const BAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-zinc-400",
];

// ─── Analytics types ───
type ChoiceAnalytics = {
  type: "choice";
  totalResponses: number;
  options: { label: string; value: string; count: number; pct: number }[];
};
type RatingAnalytics = {
  type: "rating";
  totalResponses: number;
  average: number;
  distribution: { score: number; count: number; pct: number }[];
  recentComments: { score: number; comment: string; date: string }[];
};
type TextAnalytics = {
  type: "text";
  totalResponses: number;
  recentAnswers: { value: string; date: string }[];
};
type FieldAnalytics = ChoiceAnalytics | RatingAnalytics | TextAnalytics;

function computeAnalytics(fields: FormField[], responses: FormResponse[]): Map<string, FieldAnalytics> {
  const result = new Map<string, FieldAnalytics>();

  for (const field of fields) {
    if (["multiple_choice", "dropdown", "checkbox"].includes(field.type)) {
      const counts = new Map<string, number>();
      let total = 0;
      for (const r of responses) {
        const val = r.answers[field.id];
        if (val == null) continue;
        if (field.type === "checkbox" && Array.isArray(val)) {
          total++;
          for (const v of val as string[]) counts.set(v, (counts.get(v) || 0) + 1);
        } else {
          total++;
          const s = String(val);
          counts.set(s, (counts.get(s) || 0) + 1);
        }
      }
      const options = (field.options ?? []).map((opt) => ({
        label: opt.label,
        value: opt.value,
        count: counts.get(opt.value) || 0,
        pct: total > 0 ? ((counts.get(opt.value) || 0) / total) * 100 : 0,
      }));
      options.sort((a, b) => b.count - a.count);
      result.set(field.id, { type: "choice", totalResponses: total, options });
    } else if (field.type === "rating") {
      const scores: number[] = [];
      const comments: { score: number; comment: string; date: string }[] = [];
      const dist = new Map<number, number>();
      for (const r of responses) {
        const val = r.answers[field.id];
        if (val && typeof val === "object" && "score" in (val as Record<string, unknown>)) {
          const rating = val as { score: number; comment?: string };
          scores.push(rating.score);
          dist.set(rating.score, (dist.get(rating.score) || 0) + 1);
          if (rating.comment) {
            comments.push({ score: rating.score, comment: rating.comment, date: r.submitted_at });
          }
        }
      }
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const min = field.validation?.min ?? 1;
      const max = field.validation?.max ?? 10;
      const distribution = [];
      for (let s = max; s >= min; s--) {
        const count = dist.get(s) || 0;
        distribution.push({ score: s, count, pct: scores.length > 0 ? (count / scores.length) * 100 : 0 });
      }
      result.set(field.id, {
        type: "rating",
        totalResponses: scores.length,
        average: avg,
        distribution,
        recentComments: comments.slice(0, 3),
      });
    } else {
      const recent: { value: string; date: string }[] = [];
      let total = 0;
      for (const r of responses) {
        const val = r.answers[field.id];
        if (val != null && String(val) !== "") {
          total++;
          if (recent.length < 5) recent.push({ value: String(val), date: r.submitted_at });
        }
      }
      result.set(field.id, { type: "text", totalResponses: total, recentAnswers: recent });
    }
  }
  return result;
}

// ─── Display helper for table cells ───
function formatAnswer(field: FormField, val: unknown): string {
  if (val == null) return "-";
  if (val && typeof val === "object" && "score" in (val as Record<string, unknown>)) {
    const r = val as { score: number; comment?: string };
    return r.comment ? `${r.score} — "${r.comment}"` : String(r.score);
  }
  if (val && typeof val === "object" && "url" in (val as Record<string, unknown>)) {
    return (val as { name: string }).name ?? "File";
  }
  if (Array.isArray(val)) return (val as string[]).join(", ");
  return String(val);
}

// ═══════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════
export function FormResponsesView({ form, responses: initialResponses }: { form: Form; responses: FormResponse[] }) {
  const [responses, setResponses] = useState<FormResponse[]>(initialResponses);
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [newResponseId, setNewResponseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"analytics" | "responses">("analytics");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    return () => { supabase.removeChannel(channel); };
  }, [form.id]);

  const analytics = useMemo(() => computeAnalytics(form.fields, responses), [form.fields, responses]);

  // Tracking field names (for tracked survey mode)
  const trackingFieldNames = useMemo(() => {
    if (form.settings.survey_mode === "tracked" && form.settings.tracking_fields?.length) {
      return form.settings.tracking_fields;
    }
    return [] as string[];
  }, [form.settings]);

  function exportCSV() {
    const escapeCsv = (val: string) => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };
    const headers = ["#", ...trackingFieldNames, ...form.fields.map((f) => f.label), "Date"];
    const rows = responses.map((response, index) => {
      const trackingCells = trackingFieldNames.map((tf) => response.metadata?.[tf] ?? "");
      const cells = form.fields.map((field) => {
        const val = response.answers[field.id];
        if (val && typeof val === "object" && "score" in (val as Record<string, unknown>)) {
          const r = val as { score: number; comment?: string };
          return r.comment ? `${r.score} - ${r.comment}` : String(r.score);
        }
        if (val && typeof val === "object" && "url" in (val as Record<string, unknown>)) {
          return (val as { url: string }).url;
        }
        if (Array.isArray(val)) return val.join("; ");
        return String(val ?? "");
      });
      return [String(index + 1), ...trackingCells, ...cells, new Date(response.submitted_at).toLocaleDateString()];
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
        body: JSON.stringify({ form_title: form.title, fields: form.fields, responses }),
      });
      const data = await res.json();
      setSummary(data.summary);
    } catch {
      setSummary("Failed to generate summary. Please try again.");
    } finally {
      setLoadingSummary(false);
    }
  }

  // ─── Empty state ───
  if (responses.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
        <div className="text-3xl mb-3">📭</div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">No responses yet</h3>
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
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">AI Summary</h3>
          <button
            onClick={generateSummary}
            disabled={loadingSummary}
            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
          >
            {loadingSummary ? "Analyzing..." : summary ? "Refresh" : "Generate"}
          </button>
        </div>
        {summary ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{summary}</div>
        ) : (
          <p className="text-sm text-zinc-400">
            Click &quot;Generate&quot; to get an AI-powered summary of your responses.
          </p>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-800">
        {(["analytics", "responses"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative pb-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "text-blue-600 dark:text-blue-400"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {tab === "analytics" ? "Analytics" : `Responses (${responses.length})`}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 pb-2.5">
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
            CSV
          </button>
        </div>
      </div>

      {/* ═══ Analytics Tab ═══ */}
      {activeTab === "analytics" && (
        <div className="space-y-4">
          {form.fields.map((field) => {
            const fa = analytics.get(field.id);
            if (!fa || fa.totalResponses === 0) return null;
            return (
              <div
                key={field.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{field.label}</h4>
                  <span className="text-xs text-zinc-400">{fa.totalResponses} responses</span>
                </div>
                <p className="text-xs text-zinc-400 mb-4 capitalize">{field.type.replace("_", " ")}</p>

                {/* Choice bar chart */}
                {fa.type === "choice" && (
                  <div className="space-y-3">
                    {fa.options.map((opt, idx) => (
                      <div key={opt.value}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-zinc-700 dark:text-zinc-300 truncate mr-3">{opt.label}</span>
                          <span className="text-zinc-500 shrink-0 tabular-nums">
                            {opt.count} ({opt.pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${BAR_COLORS[idx % BAR_COLORS.length]}`}
                            style={{ width: `${Math.max(opt.pct, opt.count > 0 ? 2 : 0)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rating analytics */}
                {fa.type === "rating" && (
                  <div>
                    <div className="flex items-end gap-2 mb-5">
                      <span className="text-5xl font-bold text-blue-600 dark:text-blue-400 leading-none tabular-nums">
                        {fa.average.toFixed(1)}
                      </span>
                      <span className="text-sm text-zinc-400 mb-1">
                        / {field.validation?.max ?? 10}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {fa.distribution.map(({ score, count, pct }) => (
                        <div key={score} className="flex items-center gap-3">
                          <span className="text-xs text-zinc-500 w-5 text-right tabular-nums">{score}</span>
                          <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${Math.max(pct, count > 0 ? 2 : 0)}%` }}
                            />
                          </div>
                          <span className="text-xs text-zinc-400 w-6 tabular-nums">{count}</span>
                        </div>
                      ))}
                    </div>
                    {fa.recentComments.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <h5 className="text-xs font-medium text-zinc-500 uppercase mb-3">Recent Comments</h5>
                        <div className="space-y-2.5">
                          {fa.recentComments.map((c, idx) => (
                            <div key={idx} className="border-l-2 border-blue-300 dark:border-blue-700 pl-3 py-0.5">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{c.score}</span>
                                <span className="text-xs text-zinc-400">{new Date(c.date).toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm text-zinc-600 dark:text-zinc-400">&ldquo;{c.comment}&rdquo;</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Text field samples */}
                {fa.type === "text" && (
                  <div className="space-y-2">
                    {fa.recentAnswers.map((ans, idx) => (
                      <div key={idx} className="p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">{ans.value}</p>
                        <span className="text-xs text-zinc-400 mt-1 block">
                          {new Date(ans.date).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {fa.totalResponses > 5 && (
                      <p className="text-xs text-zinc-400 pl-1">
                        + {fa.totalResponses - 5} more responses
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Responses Tab ═══ */}
      {activeTab === "responses" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase">#</th>
                  {trackingFieldNames.map((tf) => (
                    <th
                      key={tf}
                      className="px-4 py-2 text-left text-xs font-medium text-violet-500 uppercase truncate max-w-[150px]"
                    >
                      {tf.replace(/_/g, " ")}
                    </th>
                  ))}
                  {form.fields.slice(0, 5).map((field) => (
                    <th
                      key={field.id}
                      className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase truncate max-w-[200px]"
                    >
                      {field.label}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase">Date</th>
                  <th className="px-4 py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {responses.map((response, index) => (
                  <Fragment key={response.id}>
                    <tr
                      onClick={() => setExpandedId(expandedId === response.id ? null : response.id)}
                      className={`border-b border-zinc-100 dark:border-zinc-800 cursor-pointer transition-colors duration-200 ${
                        newResponseId === response.id
                          ? "bg-emerald-50 dark:bg-emerald-950/30"
                          : expandedId === response.id
                          ? "bg-blue-50/50 dark:bg-blue-950/20"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                      }`}
                    >
                      <td className="px-4 py-2.5 text-zinc-400">
                        {newResponseId === response.id && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                        )}
                        {index + 1}
                      </td>
                      {trackingFieldNames.map((tf) => (
                        <td
                          key={tf}
                          className="px-4 py-2.5 text-violet-600 dark:text-violet-400 text-xs font-medium truncate max-w-[150px]"
                          title={response.metadata?.[tf] ?? ""}
                        >
                          {response.metadata?.[tf] || <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                        </td>
                      ))}
                      {form.fields.slice(0, 5).map((field) => (
                        <td
                          key={field.id}
                          className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]"
                          title={formatAnswer(field, response.answers[field.id])}
                        >
                          {formatAnswer(field, response.answers[field.id])}
                        </td>
                      ))}
                      <td className="px-4 py-2.5 text-zinc-400 text-xs">
                        {new Date(response.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5">
                        <svg
                          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${expandedId === response.id ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </td>
                    </tr>

                    {/* Expanded detail */}
                    {expandedId === response.id && (
                      <tr>
                        <td colSpan={form.fields.slice(0, 5).length + trackingFieldNames.length + 3}>
                          <div className="px-6 py-5 bg-zinc-50 dark:bg-zinc-800/30 border-b border-zinc-200 dark:border-zinc-800">
                            {/* Tracking metadata badges */}
                            {trackingFieldNames.length > 0 && response.metadata && Object.keys(response.metadata).length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-700">
                                {Object.entries(response.metadata).map(([key, val]) => (
                                  <span
                                    key={key}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-lg text-xs font-medium"
                                  >
                                    <span className="text-violet-500 dark:text-violet-400">{key.replace(/_/g, " ")}:</span>
                                    {val}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                              {form.fields.map((field) => {
                                const answer = response.answers[field.id];
                                return (
                                  <div key={field.id}>
                                    <label className="text-xs font-medium text-zinc-500 uppercase block mb-1.5">
                                      {field.label}
                                    </label>
                                    <ResponseFieldDisplay field={field} answer={answer} />
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700 text-xs text-zinc-400">
                              Submitted {new Date(response.submitted_at).toLocaleString()}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
//  Per-field display in expanded response row
// ═══════════════════════════════════════════
function ResponseFieldDisplay({ field, answer }: { field: FormField; answer: unknown }) {
  if (answer == null || answer === "") {
    return <span className="text-sm text-zinc-400 italic">No answer</span>;
  }

  // Rating — visual dots + score + comment
  if (field.type === "rating" && typeof answer === "object" && "score" in (answer as Record<string, unknown>)) {
    const r = answer as { score: number; comment?: string };
    const max = field.validation?.max ?? 10;
    return (
      <div>
        <div className="flex items-center gap-1 mb-1">
          {Array.from({ length: max }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i < r.score ? "bg-blue-500" : "bg-zinc-200 dark:bg-zinc-700"
              }`}
            />
          ))}
          <span className="ml-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{r.score}</span>
        </div>
        {r.comment && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 italic mt-1">&ldquo;{r.comment}&rdquo;</p>
        )}
      </div>
    );
  }

  // File upload — download link
  if (field.type === "file_upload" && typeof answer === "object" && "url" in (answer as Record<string, unknown>)) {
    const f = answer as { name: string; url: string };
    return (
      <a
        href={f.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {f.name}
      </a>
    );
  }

  // Choice — options listed, selected highlighted
  if (["multiple_choice", "dropdown"].includes(field.type) && field.options) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {field.options.map((opt) => (
          <span
            key={opt.id}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              answer === opt.value
                ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
            }`}
          >
            {opt.label}
          </span>
        ))}
      </div>
    );
  }

  // Checkbox — blue pills for selected values
  if (field.type === "checkbox" && Array.isArray(answer)) {
    const selected = answer as string[];
    return (
      <div className="flex flex-wrap gap-1.5">
        {selected.map((val, idx) => (
          <span
            key={idx}
            className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium"
          >
            {field.options?.find((o) => o.value === val)?.label || val}
          </span>
        ))}
      </div>
    );
  }

  // Default — plain text
  return <p className="text-sm text-zinc-700 dark:text-zinc-300">{String(answer)}</p>;
}
