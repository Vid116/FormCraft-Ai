"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { FormEditor } from "@/components/forms/form-editor";
import type { FormField } from "@/lib/types/form";

export default function NewFormPage() {
  const [step, setStep] = useState<"describe" | "edit">("describe");
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [welcomeTitle, setWelcomeTitle] = useState("");
  const [welcomeDescription, setWelcomeDescription] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/ai/generate-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate form");
      }

      const generated = await res.json();
      setFields(generated.fields);
      setTitle(generated.title);
      setWelcomeTitle(generated.welcome_title);
      setWelcomeDescription(generated.welcome_description);
      setSubmitMessage(generated.submit_message);
      setStep("edit");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { error: insertError } = await supabase.from("forms").insert({
        id: uuidv4(),
        user_id: user.id,
        title,
        description,
        fields,
        settings: {
          theme_color: "#2563eb",
          show_branding: true,
          welcome_title: welcomeTitle,
          welcome_description: welcomeDescription,
          submit_message: submitMessage,
        },
        is_published: false,
        response_count: 0,
      });

      if (insertError) throw insertError;

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save form");
    } finally {
      setSaving(false);
    }
  }

  if (step === "describe") {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Create a new form
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">
          Describe what you need and AI will generate the form fields for you.
        </p>

        <form onSubmit={handleGenerate} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Describe your form
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={5}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="e.g., A customer feedback form for a restaurant that asks about food quality, service, ambiance, and whether they'd recommend us to others"
            />
          </div>

          <button
            type="submit"
            disabled={generating || !description.trim()}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating form with AI...
              </>
            ) : (
              "Generate with AI"
            )}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 bg-transparent border-none outline-none w-full"
            placeholder="Form title"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep("describe")}
            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-300 dark:border-zinc-700 rounded-lg transition-colors"
          >
            Regenerate
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {saving ? "Saving..." : "Save Form"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

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
