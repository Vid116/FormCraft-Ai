"use client";

import { useState } from "react";

export function TrackedLinkGenerator({
  formId,
  baseUrl,
  trackingFields,
}: {
  formId: string;
  baseUrl: string;
  trackingFields: string[];
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const hasParams = trackingFields.some((k) => values[k]?.trim());

  // Preview URL shown before generation
  const previewUrl = (() => {
    const params = new URLSearchParams();
    for (const key of trackingFields) {
      if (values[key]?.trim()) {
        params.set(key, values[key].trim());
      }
    }
    const qs = params.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  })();

  async function generateLink() {
    setLoading(true);
    setError("");
    setGeneratedUrl(null);

    const params: Record<string, string> = {};
    for (const key of trackingFields) {
      if (values[key]?.trim()) {
        params[key] = values[key].trim();
      }
    }

    try {
      const res = await fetch(`/api/forms/${formId}/generate-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate link");
      }

      const data = await res.json();
      setGeneratedUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate link");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-violet-900 dark:text-violet-100 mb-1 flex items-center gap-2">
        <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Generate Tracked Link
      </h3>
      <p className="text-xs text-violet-600 dark:text-violet-400 mb-4">
        Fill in the tracking parameters to create a unique link for this interaction.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {trackingFields.map((field) => (
          <div key={field}>
            <label className="block text-xs font-medium text-violet-700 dark:text-violet-300 mb-1">
              {field.replace(/_/g, " ")}
            </label>
            <input
              value={values[field] ?? ""}
              onChange={(e) => {
                setValues((prev) => ({ ...prev, [field]: e.target.value }));
                if (generatedUrl) setGeneratedUrl(null);
              }}
              className="w-full px-3 py-1.5 text-sm border border-violet-200 dark:border-violet-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder={`Enter ${field.replace(/_/g, " ")}`}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 truncate">
          {generatedUrl ?? previewUrl}
        </code>
        {generatedUrl ? (
          <button
            onClick={copyLink}
            className="shrink-0 px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        ) : (
          <button
            onClick={generateLink}
            disabled={!hasParams || loading}
            className="shrink-0 px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-lg transition-colors"
          >
            {loading ? "Generating..." : "Generate Link"}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

      {!hasParams && !generatedUrl && (
        <p className="text-xs text-violet-400 mt-2">
          Fill in at least one parameter to generate a tracked link.
        </p>
      )}

      {generatedUrl && (
        <button
          onClick={() => { setGeneratedUrl(null); setValues({}); setCopied(false); }}
          className="text-xs text-violet-500 hover:text-violet-700 dark:hover:text-violet-300 mt-2 underline"
        >
          Generate another link
        </button>
      )}
    </div>
  );
}
