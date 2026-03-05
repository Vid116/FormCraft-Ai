"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormEditor } from "@/components/forms/form-editor";
import { sha256 } from "@/lib/hash";
import type { Form, FormField } from "@/lib/types/form";
import type { PlanId } from "@/lib/stripe";
import { hasFeatureAccess, getRequiredPlan } from "@/lib/features";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";

export function EditFormClient({ form, plan = "free" }: { form: Form; plan?: PlanId }) {
  const canThemeColor = hasFeatureAccess(plan, "theme_color");
  const canHideBranding = hasFeatureAccess(plan, "hide_branding");
  const canNotifications = hasFeatureAccess(plan, "email_notifications");
  const canRedirectUrl = hasFeatureAccess(plan, "redirect_url");
  const canTrackedLinks = hasFeatureAccess(plan, "tracked_links");
  const canPasswordProtection = hasFeatureAccess(plan, "password_protection");
  const [title, setTitle] = useState(form.title);
  const [description, setDescription] = useState(form.description ?? "");
  const [welcomeTitle, setWelcomeTitle] = useState(form.settings.welcome_title ?? "");
  const [welcomeDescription, setWelcomeDescription] = useState(form.settings.welcome_description ?? "");
  const [submitMessage, setSubmitMessage] = useState(form.settings.submit_message ?? "");
  const [fields, setFields] = useState<FormField[]>(form.fields);
  const [surveyMode, setSurveyMode] = useState<"anonymous" | "tracked">(form.settings.survey_mode ?? "anonymous");
  const [trackingFields, setTrackingFields] = useState<string[]>(form.settings.tracking_fields ?? []);
  const [newTrackingField, setNewTrackingField] = useState("");
  const [redirectUrl, setRedirectUrl] = useState(form.settings.redirect_url ?? "");
  const [notificationsEmail, setNotificationsEmail] = useState(form.settings.notifications_email ?? "");
  const [themeColor, setThemeColor] = useState(form.settings.theme_color ?? "#2563eb");
  const [showBranding, setShowBranding] = useState(form.settings.show_branding ?? true);
  const [formPassword, setFormPassword] = useState("");
  const [hasExistingPassword, setHasExistingPassword] = useState(!!form.settings.password_hash);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      const supabase = createClient();

      // Hash password if changed
      let passwordHash = form.settings.password_hash;
      if (formPassword.trim()) {
        passwordHash = await sha256(formPassword.trim());
      } else if (!hasExistingPassword) {
        passwordHash = undefined;
      }

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
            redirect_url: redirectUrl.trim() || undefined,
            notifications_email: notificationsEmail.trim() || undefined,
            theme_color: themeColor,
            show_branding: showBranding,
            password_hash: passwordHash,
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

      {/* Appearance */}
      {canThemeColor ? (
        <div className="mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Appearance
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                Theme color
              </label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-none"
                  />
                </div>
                <input
                  type="text"
                  value={themeColor}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setThemeColor(v);
                  }}
                  className="w-28 px-3 py-2 text-sm font-mono border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#2563eb"
                />
                <div className="flex gap-1.5">
                  {["#2563eb", "#7c3aed", "#059669", "#dc2626", "#ea580c", "#0891b2", "#db2777", "#1d4ed8"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setThemeColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        themeColor === c ? "border-zinc-900 dark:border-white scale-110" : "border-transparent hover:scale-110"
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
            {canHideBranding && (
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Show &quot;Powered by FormCraft&quot; branding
                  </label>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    Displayed on the public form
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBranding(!showBranding)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    showBranding ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      showBranding ? "translate-x-4" : ""
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <UpgradePrompt feature="Custom Appearance & Colors" requiredPlan={getRequiredPlan("theme_color")} />
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
      <FormEditor fields={fields} onChange={setFields} plan={plan} />

      {/* Survey Mode */}
      {canTrackedLinks ? (
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
      ) : (
        <div className="mt-6">
          <UpgradePrompt feature="Tracked Survey Mode" requiredPlan={getRequiredPlan("tracked_links")} />
        </div>
      )}

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
        {canRedirectUrl && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Redirect URL <span className="text-zinc-400 dark:text-zinc-500">(optional)</span>
            </label>
            <input
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              type="url"
              className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., https://yoursite.com/thanks"
            />
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Redirect respondents to this URL after submission instead of showing the thank-you screen.
            </p>
          </div>
        )}
      </div>

      {/* Notifications */}
      {canNotifications ? (
        <div className="mt-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Notifications
          </h3>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Notification email <span className="text-zinc-400 dark:text-zinc-500">(optional)</span>
            </label>
            <input
              value={notificationsEmail}
              onChange={(e) => setNotificationsEmail(e.target.value)}
              type="email"
              className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., you@company.com"
            />
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Get an email notification each time someone submits a response.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <UpgradePrompt feature="Email Notifications" requiredPlan={getRequiredPlan("email_notifications")} />
        </div>
      )}

      {/* Password Protection */}
      {canPasswordProtection ? (
        <div className="mt-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Password Protection
          </h3>
          {hasExistingPassword && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xs text-green-700 dark:text-green-300">Password is set. Enter a new one below to change it.</span>
              <button
                type="button"
                onClick={() => { setHasExistingPassword(false); setFormPassword(""); }}
                className="ml-auto text-xs text-red-500 hover:text-red-600 font-medium"
              >
                Remove
              </button>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              {hasExistingPassword ? "New password" : "Set a password"} <span className="text-zinc-400 dark:text-zinc-500">(optional)</span>
            </label>
            <input
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              type="password"
              className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a password for this form"
            />
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Respondents must enter this password before they can access the form.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <UpgradePrompt feature="Password-Protected Forms" requiredPlan={getRequiredPlan("password_protection")} />
        </div>
      )}
    </div>
  );
}
