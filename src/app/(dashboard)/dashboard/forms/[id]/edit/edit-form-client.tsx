"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormEditor } from "@/components/forms/form-editor";
import type { Form, FormField } from "@/lib/types/form";

export function EditFormClient({ form }: { form: Form }) {
  const [title, setTitle] = useState(form.title);
  const [description, setDescription] = useState(form.description ?? "");
  const [welcomeTitle, setWelcomeTitle] = useState(form.settings.welcome_title ?? "");
  const [welcomeDescription, setWelcomeDescription] = useState(form.settings.welcome_description ?? "");
  const [submitMessage, setSubmitMessage] = useState(form.settings.submit_message ?? "");
  const [fields, setFields] = useState<FormField[]>(form.fields);
  const [surveyMode, setSurveyMode] = useState<"anonymous" | "tracked">(form.settings.survey_mode ?? "anonymous");
  const [trackingFields, setTrackingFields] = useState<string[]>(form.settings.tracking_fields ?? []);
  const [newTrackingField, setNewTrackingField] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("forms")
        .update({
          title,
          description,
          fields,
          settings: {
            ...form.settings,
            welcome_title: welcomeTitle,
            welcome_description: welcomeDescription,
            submit_message: submitMessage,
            survey_mode: surveyMode,
            tracking_fields: surveyMode === "tracked" ? trackingFields : [],
          },
        })
        .eq("id", form.id);

      if (updateError) throw updateError;

      router.push(`/dashboard/forms/${form.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push(`/dashboard/forms/${form.id}`)}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-2 inline-block"
          >
            &larr; Back to form
          </button>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 bg-transparent border-none outline-none w-full"
            placeholder="Form title"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/dashboard/forms/${form.id}`)}
            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-300 dark:border-zinc-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {/* Description */}
      <div className="mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Description</h3>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Form description (optional)"
        />
      </div>

      {/* Welcome screen settings */}
      <div className="mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          Welcome Screen
        </h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">
          This is the first thing respondents see before the questions begin.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Headline
            </label>
            <input
              value={welcomeTitle}
              onChange={(e) => setWelcomeTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., We'd love your feedback!"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Message
            </label>
            <textarea
              value={welcomeDescription}
              onChange={(e) => setWelcomeDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="e.g., Your opinion matters to us. This takes less than 2 minutes."
            />
          </div>
        </div>
      </div>

      {/* Form fields editor */}
      <FormEditor fields={fields} onChange={setFields} />

      {/* Survey Mode */}
      <div className="mt-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Survey Mode
        </h3>
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => setSurveyMode("anonymous")}
            className={`flex-1 p-3 rounded-lg border-2 text-left transition-all ${
              surveyMode === "anonymous"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
            }`}
          >
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Anonymous</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">One link for everyone. No tracking.</p>
          </button>
          <button
            type="button"
            onClick={() => setSurveyMode("tracked")}
            className={`flex-1 p-3 rounded-lg border-2 text-left transition-all ${
              surveyMode === "tracked"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
            }`}
          >
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Tracked</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Unique links per case/agent. Trace every response.</p>
          </button>
        </div>

        {surveyMode === "tracked" && (
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Tracking parameters
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {trackingFields.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-lg text-xs font-medium"
                >
                  {f}
                  <button
                    type="button"
                    onClick={() => setTrackingFields(trackingFields.filter((t) => t !== f))}
                    className="hover:text-red-500 ml-0.5"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newTrackingField}
                onChange={(e) => setNewTrackingField(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const name = newTrackingField.trim().toLowerCase();
                    if (name && !trackingFields.includes(name)) {
                      setTrackingFields([...trackingFields, name]);
                      setNewTrackingField("");
                    }
                  }
                }}
                className="flex-1 px-3 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. case_id, agent_name"
              />
              <button
                type="button"
                onClick={() => {
                  const name = newTrackingField.trim().toLowerCase();
                  if (name && !trackingFields.includes(name)) {
                    setTrackingFields([...trackingFields, name]);
                    setNewTrackingField("");
                  }
                }}
                className="px-3 py-1.5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submit message settings */}
      <div className="mt-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Completion Screen
        </h3>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Thank-you message
          </label>
          <input
            value={submitMessage}
            onChange={(e) => setSubmitMessage(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Thank you! Your feedback means the world to us."
          />
        </div>
      </div>
    </div>
  );
}
