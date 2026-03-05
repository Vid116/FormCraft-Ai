"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { getVisibleFields } from "@/lib/conditions";
import type { Form, FormField } from "@/lib/types/form";

/* ═══════════════════════════════════════════════════
   STEP-BY-STEP ANIMATED FORM — "TYPEFORM KILLER"
   Warm gradient background shifts as user progresses.
   One question at a time. Keyboard-driven. Rewarding.
   ═══════════════════════════════════════════════════ */

// ─── Gradient stops that morph as user progresses ───
const GRADIENT_STAGES = [
  { from: "#0f172a", via: "#1e293b", to: "#0f172a" },   // welcome — deep slate
  { from: "#1a1034", via: "#2d1b69", to: "#0f172a" },   // early — indigo
  { from: "#1b2e4b", via: "#1a4d6e", to: "#0c2233" },   // mid — ocean
  { from: "#1a3c34", via: "#0d5c45", to: "#0a2e25" },   // later — emerald
  { from: "#2a1f3d", via: "#4c2885", to: "#1a1034" },   // final — violet
  { from: "#0c4a1e", via: "#15803d", to: "#052e16" },    // submitted — success green
];

function lerpColor(a: string, b: string, t: number) {
  const ah = parseInt(a.replace("#", ""), 16);
  const bh = parseInt(b.replace("#", ""), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg_ = (bh >> 8) & 0xff, bb = bh & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg_ - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return `#${((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1)}`;
}

function getGradient(progress: number, submitted: boolean) {
  if (submitted) {
    const s = GRADIENT_STAGES[5];
    return `linear-gradient(135deg, ${s.from}, ${s.via}, ${s.to})`;
  }
  const idx = Math.min(Math.floor(progress * (GRADIENT_STAGES.length - 2)), GRADIENT_STAGES.length - 3);
  const t = (progress * (GRADIENT_STAGES.length - 2)) - idx;
  const a = GRADIENT_STAGES[idx];
  const b = GRADIENT_STAGES[idx + 1];
  return `linear-gradient(135deg, ${lerpColor(a.from, b.from, t)}, ${lerpColor(a.via, b.via, t)}, ${lerpColor(a.to, b.to, t)})`;
}

const WEEKEND_LABEL_RE = /^(Friday|Saturday),\s+([A-Za-z]+)\s+(\d{1,2})$/;

type FieldOption = NonNullable<FormField["options"]>[number];

function parseWeekendLabel(label: string): { weekday: "Friday" | "Saturday"; month: string; day: number } | null {
  const match = label.match(WEEKEND_LABEL_RE);
  if (!match) return null;
  const weekday = match[1] as "Friday" | "Saturday";
  const month = match[2];
  const day = Number(match[3]);
  if (!Number.isFinite(day)) return null;
  return { weekday, month, day };
}

function formatWeekLabel(first: { month: string; day: number }, second: { month: string; day: number }, index: number) {
  if (first.month === second.month) {
    return `Week ${index + 1} - ${first.month} ${first.day}-${second.day}`;
  }
  return `Week ${index + 1} - ${first.month} ${first.day} - ${second.month} ${second.day}`;
}

function groupWeekendOptions(options: FieldOption[]) {
  if (options.length < 4 || options.length % 2 !== 0) return null;

  const parsed = options.map((opt) => ({ opt, parsed: parseWeekendLabel(opt.label) }));
  if (parsed.some((entry) => !entry.parsed)) return null;

  const groups: Array<{ label: string; options: FieldOption[] }> = [];
  for (let i = 0; i < parsed.length; i += 2) {
    const first = parsed[i].parsed!;
    const second = parsed[i + 1].parsed!;
    if (first.weekday !== "Friday" || second.weekday !== "Saturday") return null;

    groups.push({
      label: formatWeekLabel(
        { month: first.month, day: first.day },
        { month: second.month, day: second.day },
        groups.length
      ),
      options: [parsed[i].opt, parsed[i + 1].opt],
    });
  }

  return groups;
}
// Helper: check if a field answer is empty
function isFieldEmpty(field: FormField, val: unknown): boolean {
  if (field.type === "rating") {
    return !(val && typeof val === "object" && (val as { score: number }).score != null);
  }
  if (field.type === "file_upload") {
    return !(val && typeof val === "object" && (val as { url: string }).url);
  }
  return !val;
}

// ─── localStorage helpers ───
const STORAGE_PREFIX = "formcraft_progress_";

function loadProgress(formId: string): { answers: Record<string, unknown>; step: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + formId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.answers === "object" && typeof parsed.step === "number") {
      return parsed;
    }
  } catch { /* ignore corrupt data */ }
  return null;
}

function saveProgress(formId: string, answers: Record<string, unknown>, step: number) {
  try {
    localStorage.setItem(STORAGE_PREFIX + formId, JSON.stringify({ answers, step }));
  } catch { /* storage full — ignore */ }
}

function clearProgress(formId: string) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + formId);
  } catch { /* ignore */ }
}

// ─── Swipe gesture hook ───
// ─── Main component ───
export function PublicFormRenderer({
  form,
  trackingParams,
  isPasswordProtected: _isPasswordProtected = false,
}: {
  form: Form;
  trackingParams?: Record<string, string>;
  isPasswordProtected?: boolean;
}) {
  void _isPasswordProtected;
  // -1 = welcome screen, 0+ = index into visibleFields
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [shakeField, setShakeField] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const restoredRef = useRef(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Restore saved progress on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const saved = loadProgress(form.id);
    if (saved && Object.keys(saved.answers).length > 0) {
      setAnswers(saved.answers);
      setStep(saved.step);
    }
  }, [form.id]);

  // Visible fields recalculate dynamically as answers change (conditional logic)
  const visibleFields = useMemo(
    () => getVisibleFields(form.fields, answers),
    [form.fields, answers]
  );
  const totalSteps = visibleFields.length;

  const progress = submitted ? 1 : totalSteps > 0 ? Math.max(0, step) / totalSteps : 0;
  const currentField = step >= 0 && step < totalSteps ? visibleFields[step] : null;

  // Save progress to localStorage whenever answers or step change
  useEffect(() => {
    if (!submitted && step >= 0) {
      saveProgress(form.id, answers, step);
    }
  }, [answers, step, submitted, form.id]);

  function updateAnswer(fieldId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  }

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError("");

    // Only validate visible fields (hidden conditional fields are skipped)
    for (const field of visibleFields) {
      if (field.required && isFieldEmpty(field, answers[field.id])) {
        setError(`"${field.label}" is required`);
        setSubmitting(false);
        return;
      }
    }

    try {
      const supabase = createClient();
      const insertPayload: Record<string, unknown> = {
        id: uuidv4(),
        form_id: form.id,
        answers,
        submitted_at: new Date().toISOString(),
      };
      // Include tracking metadata if form is tracked and params exist
      if (trackingParams && Object.keys(trackingParams).length > 0) {
        insertPayload.metadata = trackingParams;
      }
      const { error: insertError } = await supabase.from("responses").insert(insertPayload);
      if (insertError) throw insertError;
      await supabase.rpc("increment_response_count", { form_id_input: form.id });
      clearProgress(form.id);
      setStep(totalSteps);
      setSubmitted(true);
    } catch {
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [answers, form.id, totalSteps, trackingParams, visibleFields]);

  const goNext = useCallback(() => {
    if (step >= 0 && step < totalSteps) {
      const field = visibleFields[step];
      if (field.required && isFieldEmpty(field, answers[field.id])) {
        setShakeField(true);
        setTimeout(() => setShakeField(false), 600);
        return;
      }
    }
    setError("");
    setDirection("forward");
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
    } else if (step === totalSteps - 1) {
      handleSubmit();
    }
  }, [step, totalSteps, answers, visibleFields, handleSubmit]);

  const goBack = useCallback(() => {
    if (step > -1 && !submitting) {
      setDirection("back");
      setStep((s) => s - 1);
      setError("");
    }
  }, [step, submitting]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (tagName === "TEXTAREA" || target?.isContentEditable) return;

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!submitted && !submitting) goNext();
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        if (!submitted) goBack();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goBack, submitted, submitting]);

  return (
    <div
      ref={containerRef}
      className="relative min-h-[100svh] overflow-x-hidden transition-all duration-1000 ease-out"
      style={{ background: getGradient(progress, submitted) }}
    >
      {/* Animated CSS */}
      <style>{formAnimationStyles}</style>

      {/* Ambient floating particles */}
      <div className="fc-particles" aria-hidden="true">
        {mounted && Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="fc-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${10 + Math.random() * 15}s`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              opacity: 0.15 + Math.random() * 0.2,
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      {step >= 0 && !submitted && (
        <div className="sticky top-0 left-0 right-0 z-50">
          <div className="h-1 bg-white/10">
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{
              width: `${progress * 100}%`,
              background: "linear-gradient(90deg, #60a5fa, #a78bfa, #34d399)",
            }}
          />
          </div>
        </div>
      )}

      {/* Step counter + back button */}
      {step >= 0 && !submitted && (
        <div className="sticky top-1 left-0 right-0 z-40 flex items-center justify-between px-4 sm:px-6 pt-[max(env(safe-area-inset-top),0.75rem)] pb-2 bg-black/10 backdrop-blur-sm">
          <button
            onClick={goBack}
            className={`fc-back-btn flex items-center gap-1.5 text-sm text-white/60 hover:text-white/90 transition-all duration-300 min-w-[48px] min-h-[48px] justify-center ${step <= -1 ? "opacity-0 pointer-events-none" : ""}`}
          >
            <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span className="text-sm text-white/40 font-mono tracking-wider">
            {step + 1} / {totalSteps}
          </span>
        </div>
      )}

      {/* Content area — padded for thumb reach on mobile */}
      <div
        className={`flex justify-center min-h-[100svh] px-4 sm:px-6 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:pb-10 ${
          step === -1 || submitted
            ? "items-center pt-6 sm:pt-8"
            : "items-start pt-6 sm:pt-10"
        }`}
      >
        <div
          className={`w-full ${step === -1 ? "max-w-2xl" : "max-w-xl"} lg:scale-[1.5] lg:origin-center`}
        >

          {/* ── Welcome screen ── */}
          {step === -1 && (
            <div className="fc-slide-in-forward text-center">
              <div className="fc-welcome-icon mb-8">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                  <svg className="w-8 h-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight tracking-tight">
                {form.settings.welcome_title || form.title}
              </h1>
              {(form.settings.welcome_description || form.description) && (
                <p className="text-xl sm:text-2xl text-white/60 mb-10 leading-relaxed max-w-2xl mx-auto">
                  {form.settings.welcome_description || form.description}
                </p>
              )}
              <button
                onClick={goNext}
                className="fc-start-btn group inline-flex items-center gap-3 px-10 py-5 sm:px-12 sm:py-5 bg-white text-zinc-900 font-semibold text-lg sm:text-xl rounded-2xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-2xl shadow-white/10 min-h-[48px]"
              >
                Start
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              {/* Tracking context badge */}
              {trackingParams && Object.keys(trackingParams).length > 0 && (
                <div className="mt-8 inline-flex flex-wrap items-center gap-2 justify-center">
                  {Object.entries(trackingParams).map(([key, val]) => (
                    <span key={key} className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-xs text-white/50">
                      {key.replace(/_/g, " ")}: <span className="text-white/70 font-medium">{val}</span>
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-4 text-xs text-white/25">
                {totalSteps} questions &middot; Takes ~{Math.max(1, Math.ceil(totalSteps * 0.5))} min
              </p>
            </div>
          )}

          {/* ── Question slides ── */}
          {currentField && !submitted && (
            <div
              key={currentField.id}
              className={`fc-slide-in-${direction} ${shakeField ? "fc-shake" : ""}`}
            >
              {/* Question number badge */}
              <div className="fc-badge mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                <span className="text-xs font-mono text-white/50">Q{step + 1}</span>
                {currentField.required && (
                  <span className="text-xs text-amber-400/80">Required</span>
                )}
              </div>

              {/* Question label */}
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-snug tracking-tight">
                {currentField.label}
              </h2>
              {currentField.description && (
                <p className="text-base text-white/50 mb-8 leading-relaxed">
                  {currentField.description}
                </p>
              )}

              {/* Field input */}
              <div className="mb-8">
                <StepFieldRenderer
                  field={currentField}
                  value={answers[currentField.id]}
                  onChange={(val) => updateAnswer(currentField.id, val)}
                  onSubmit={goNext}
                  formId={form.id}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="fc-fade-in mb-6 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-sm">
                  {error}
                </div>
              )}

              {/* Navigation — fixed at bottom on mobile for thumb reach */}
              <div className="mt-8 flex items-center gap-4">
                <button
                  onClick={goNext}
                  disabled={submitting}
                  className="fc-next-btn group inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-6 py-4 sm:py-3 bg-white text-zinc-900 font-semibold text-lg sm:text-base rounded-2xl sm:rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-white/5 min-h-[48px]"
                >
                  {step === totalSteps - 1
                    ? submitting
                      ? "Sending..."
                      : "Submit"
                    : "OK"}
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <span className="hidden sm:inline text-xs text-white/30">
                  press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-white/50">Enter</kbd>
                </span>
              </div>
            </div>
          )}

          {/* ── Success screen ── */}
          {submitted && (
            <div className="fc-slide-in-forward text-center">
              {/* Confetti burst */}
              <div className="fc-confetti" aria-hidden="true">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="fc-confetti-piece"
                    style={{
                      left: `${50 + (Math.random() - 0.5) * 60}%`,
                      backgroundColor: ["#60a5fa", "#a78bfa", "#34d399", "#fbbf24", "#f472b6", "#fb923c"][i % 6],
                      animationDelay: `${Math.random() * 0.5}s`,
                      ["--x" as string]: `${(Math.random() - 0.5) * 500}px`,
                      ["--y" as string]: `${-200 - Math.random() * 400}px`,
                      ["--r" as string]: `${Math.random() * 720 - 360}deg`,
                    }}
                  />
                ))}
              </div>

              {/* Success check */}
              <div className="fc-success-check mb-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <svg className="w-10 h-10 text-emerald-400 fc-draw-check" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" className="fc-check-path" />
                  </svg>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
                {form.settings.submit_message || "Thank you!"}
              </h1>
              <p className="text-lg text-white/50 leading-relaxed">
                Your response has been recorded.
              </p>

              {form.settings.show_branding && (
                <p className="mt-12 text-xs text-white/20">
                  Powered by <span className="font-semibold text-white/30">FormPoki Fat</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Branding on question screens — above the fixed nav on mobile */}
      {form.settings.show_branding && !submitted && step >= 0 && (
        <div className="pb-6 text-center">
          <span className="text-xs text-white/15">
            Powered by <span className="font-semibold">FormPoki Fat</span>
          </span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   Per-field renderer for step view
   ═══════════════════════════════════════ */
function StepFieldRenderer({
  field,
  value,
  onChange,
  onSubmit,
  formId,
}: {
  field: FormField;
  value: unknown;
  onChange: (val: unknown) => void;
  onSubmit: () => void;
  formId: string;
}) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-focus text inputs on mount
    setTimeout(() => inputRef.current?.focus(), 350);
  }, [field.id]);

  // text-[16px] minimum prevents iOS auto-zoom on focus
  const baseInput =
    "w-full bg-transparent border-b-2 border-white/20 focus:border-white/60 text-white text-xl py-4 sm:py-3 outline-none placeholder-white/25 transition-colors duration-300 caret-white";

  // Text inputs
  if (["short_text", "email", "phone", "url", "number"].includes(field.type)) {
    const typeMap: Record<string, string> = { short_text: "text", email: "email", phone: "tel", url: "url", number: "number" };
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={typeMap[field.type] ?? "text"}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder ?? "Type your answer here..."}
        className={baseInput}
      />
    );
  }

  if (field.type === "long_text") {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder ?? "Type your answer here..."}
        rows={3}
        className={`${baseInput} resize-none border-2 rounded-xl px-4 border-white/15 focus:border-white/40`}
      />
    );
  }

  if (field.type === "date") {
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="date"
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`${baseInput} [color-scheme:dark]`}
      />
    );
  }

  // Rating — beautiful interactive slider
  if (field.type === "rating") {
    const min = field.validation?.min ?? 1;
    const max = field.validation?.max ?? 10;
    const ratingVal = value as { score: number; comment?: string } | null;
    const current = ratingVal?.score ?? null;
    const comment = ratingVal?.comment ?? "";
    const pct = current !== null ? ((current - min) / (max - min)) * 100 : 0;

    function updateRating(updates: Partial<{ score: number; comment: string }>) {
      onChange({ score: current, comment, ...updates });
    }

    return (
      <div className="space-y-4 pt-2">
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            step={1}
            value={current ?? Math.ceil((min + max) / 2)}
            onChange={(e) => updateRating({ score: Number(e.target.value) })}
            className="fc-rating-slider w-full"
            style={{ ["--pct" as string]: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-white/30">{min}</span>
          <div className={`fc-rating-value text-4xl font-bold transition-all duration-300 ${current !== null ? "text-white scale-100 opacity-100" : "text-white/20 scale-75 opacity-50"}`}>
            {current ?? "?"}
          </div>
          <span className="text-sm text-white/30">{max}</span>
        </div>

        {/* Optional comment */}
        {current !== null && (
          <div className="fc-fade-in pt-2">
            <textarea
              value={comment}
              onChange={(e) => updateRating({ comment: e.target.value })}
              placeholder="Want to tell us why? (optional)"
              rows={2}
              className="w-full bg-transparent border-2 border-white/10 focus:border-white/30 rounded-xl px-4 py-3 text-base text-white placeholder-white/20 outline-none resize-none transition-colors duration-300"
            />
          </div>
        )}
      </div>
    );
  }

  // Multiple choice — card selection
  if (field.type === "multiple_choice") {
    return (
      <div className="space-y-3 sm:space-y-2.5">
        {(field.options ?? []).map((opt, i) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setTimeout(onSubmit, 400);
              }}
              className={`fc-option-card w-full text-left flex items-center gap-4 px-5 py-5 sm:py-4 rounded-xl border transition-all duration-300 min-h-[48px] ${
                selected
                  ? "bg-white/15 border-white/40 scale-[1.02]"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className={`flex-shrink-0 w-10 h-10 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                selected ? "bg-white text-zinc-900" : "bg-white/10 text-white/50"
              }`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className={`text-base transition-colors duration-300 ${selected ? "text-white font-medium" : "text-white/70"}`}>
                {opt.label}
              </span>
              {selected && (
                <svg className="w-5 h-5 ml-auto text-emerald-400 fc-pop-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Checkbox — multi-select cards
  if (field.type === "checkbox") {
    const selected = ((value as string[]) ?? []);
    const options = field.options ?? [];
    const weekendGroups = groupWeekendOptions(options);

    function renderOptionButton(opt: FieldOption, i: number) {
      const isChecked = selected.includes(opt.value);
      return (
        <button
          key={opt.id}
          type="button"
          onClick={() => {
            onChange(isChecked ? selected.filter((v) => v !== opt.value) : [...selected, opt.value]);
          }}
          className={`fc-option-card w-full text-left flex items-center gap-4 px-5 py-5 sm:py-4 rounded-xl border transition-all duration-300 min-h-[56px] ${
            isChecked
              ? "bg-white/15 border-white/40 scale-[1.02]"
              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
          }`}
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <span className={`flex-shrink-0 w-10 h-10 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
            isChecked ? "bg-white text-zinc-900" : "bg-white/10 text-white/50"
          }`}>
            {isChecked ? (
              <svg className="w-4 h-4 fc-pop-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className="text-sm font-bold">{String.fromCharCode(65 + i)}</span>
            )}
          </span>
          <span className={`text-base transition-colors duration-300 ${isChecked ? "text-white font-medium" : "text-white/70"}`}>
            {opt.label}
          </span>
        </button>
      );
    }

    if (weekendGroups) {
      return (
        <div className="space-y-4">
          {weekendGroups.map((group, groupIndex) => (
            <div key={group.label} className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-white/35 pl-1">{group.label}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {group.options.map((opt, optionIndex) => renderOptionButton(opt, groupIndex * 2 + optionIndex))}
              </div>
            </div>
          ))}
          <p className="text-xs text-white/25 mt-2 pl-1">Tap all dates that work for you</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 sm:space-y-2.5">
        {options.map((opt, i) => renderOptionButton(opt, i))}
        <p className="text-xs text-white/25 mt-2 pl-1">Select all that apply</p>
      </div>
    );
  }

  // Dropdown — styled as card list
  if (field.type === "dropdown") {
    return (
      <div className="space-y-3 sm:space-y-2">
        {(field.options ?? []).map((opt, i) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setTimeout(onSubmit, 400);
              }}
              className={`fc-option-card w-full text-left px-5 py-4 sm:py-3.5 rounded-xl border transition-all duration-300 min-h-[48px] ${
                selected
                  ? "bg-white/15 border-white/40"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className={`text-base ${selected ? "text-white font-medium" : "text-white/70"}`}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // File upload — uploads to Supabase Storage
  if (field.type === "file_upload") {
    return <FileUploadField field={field} value={value} onChange={onChange} formId={formId} />;
  }

  return null;
}

function FileUploadField({
  field,
  value,
  onChange,
  formId,
}: {
  field: FormField;
  value: unknown;
  onChange: (val: unknown) => void;
  formId: string;
}) {
  const fileVal = value as { name: string; url: string } | null;
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File must be under 10MB");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${formId}/${field.id}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("form-uploads")
        .upload(path, file);

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("form-uploads")
        .getPublicUrl(path);

      onChange({ name: file.name, url: urlData.publicUrl });
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block cursor-pointer">
        <div className={`flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed transition-all duration-300 ${
          fileVal ? "border-emerald-400/50 bg-emerald-500/10" : uploading ? "border-blue-400/50 bg-blue-500/10" : "border-white/15 bg-white/5 hover:bg-white/8 hover:border-white/25"
        }`}>
          {uploading ? (
            <>
              <svg className="w-8 h-8 text-blue-400 mb-2 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-white/50 text-sm">Uploading...</span>
            </>
          ) : fileVal ? (
            <>
              <svg className="w-8 h-8 text-emerald-400 mb-2 fc-pop-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-white/70 text-sm">{fileVal.name}</span>
              <button
                type="button"
                onClick={(ev) => { ev.preventDefault(); onChange(null); }}
                className="mt-2 text-xs text-white/30 hover:text-red-400 transition-colors"
              >
                Remove file
              </button>
            </>
          ) : (
            <>
              <svg className="w-8 h-8 text-white/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-white/40 text-sm">Click to upload a file</span>
              <span className="text-white/20 text-xs mt-1">Max 10MB</span>
            </>
          )}
        </div>
        {!fileVal && !uploading && <input type="file" className="hidden" onChange={handleFileSelect} />}
      </label>
      {uploadError && (
        <p className="mt-2 text-xs text-red-400">{uploadError}</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   CSS Animations (injected as <style>)
   ═══════════════════════════════════════ */
const formAnimationStyles = `
  /* ── Slide transitions ── */
  @keyframes fc-slide-forward {
    from { opacity: 0; transform: translateY(40px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes fc-slide-back {
    from { opacity: 0; transform: translateY(-40px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .fc-slide-in-forward { animation: fc-slide-forward 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .fc-slide-in-back    { animation: fc-slide-back 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }

  /* ── Shake for required ── */
  @keyframes fc-shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
    20%, 40%, 60%, 80% { transform: translateX(6px); }
  }
  .fc-shake { animation: fc-shake 0.5s ease-in-out; }

  /* ── Fade in ── */
  @keyframes fc-fade {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fc-fade-in { animation: fc-fade 0.3s ease-out both; }

  /* ── Option card stagger ── */
  @keyframes fc-option-enter {
    from { opacity: 0; transform: translateX(-16px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .fc-option-card { animation: fc-option-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }

  /* ── Pop in (checkmarks) ── */
  @keyframes fc-pop {
    0%   { transform: scale(0); opacity: 0; }
    60%  { transform: scale(1.2); }
    100% { transform: scale(1); opacity: 1; }
  }
  .fc-pop-in { animation: fc-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

  /* ── Floating particles ── */
  .fc-particles { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
  @keyframes fc-float {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    25%  { transform: translate(30px, -40px) rotate(90deg); }
    50%  { transform: translate(-20px, -80px) rotate(180deg); }
    75%  { transform: translate(40px, -30px) rotate(270deg); }
  }
  .fc-particle {
    position: absolute;
    border-radius: 50%;
    background: white;
    animation: fc-float linear infinite;
  }

  /* ── Confetti ── */
  .fc-confetti { position: fixed; inset: 0; pointer-events: none; z-index: 60; overflow: hidden; }
  @keyframes fc-confetti-fall {
    0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(var(--y, -400px)) translateX(var(--x, 100px)) rotate(var(--r, 360deg)); opacity: 0; }
  }
  .fc-confetti-piece {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    top: 50%;
    animation: fc-confetti-fall 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  }

  /* ── Success check draw ── */
  @keyframes fc-check-draw {
    from { stroke-dashoffset: 24; }
    to   { stroke-dashoffset: 0; }
  }
  .fc-check-path {
    stroke-dasharray: 24;
    stroke-dashoffset: 24;
    animation: fc-check-draw 0.6s cubic-bezier(0.65, 0, 0.35, 1) 0.3s both;
  }
  .fc-success-check {
    animation: fc-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  /* ── Welcome icon pulse ── */
  @keyframes fc-pulse-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.1); }
    50%  { box-shadow: 0 0 0 16px rgba(255,255,255,0); }
  }
  .fc-welcome-icon > div { animation: fc-pulse-glow 3s ease-in-out infinite; }

  /* ── Rating slider custom ── */
  .fc-rating-slider {
    -webkit-appearance: none;
    appearance: none;
    height: 8px;
    border-radius: 99px;
    background: linear-gradient(90deg, rgba(255,255,255,0.4) var(--pct, 0%), rgba(255,255,255,0.1) var(--pct, 0%));
    outline: none;
    transition: background 0.3s;
  }
  .fc-rating-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    box-shadow: 0 2px 12px rgba(0,0,0,0.3);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .fc-rating-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 2px 20px rgba(0,0,0,0.4);
  }
  .fc-rating-slider::-webkit-slider-thumb:active {
    transform: scale(1.05);
  }
  .fc-rating-slider::-moz-range-thumb {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 12px rgba(0,0,0,0.3);
  }

  /* ── Badge entrance ── */
  @keyframes fc-badge-in {
    from { opacity: 0; transform: translateY(-8px) scale(0.9); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .fc-badge { animation: fc-badge-in 0.4s 0.1s cubic-bezier(0.16, 1, 0.3, 1) both; }

  /* ── Next button idle pulse ── */
  @keyframes fc-btn-pulse {
    0%, 100% { box-shadow: 0 4px 24px rgba(255,255,255,0.08); }
    50%  { box-shadow: 0 4px 32px rgba(255,255,255,0.15); }
  }
  .fc-next-btn { animation: fc-btn-pulse 3s ease-in-out infinite; }
  .fc-start-btn { animation: fc-btn-pulse 2.5s ease-in-out infinite; }

  /* ── Mobile: larger slider thumb ── */
  @media (max-width: 640px) {
    .fc-rating-slider::-webkit-slider-thumb {
      width: 36px;
      height: 36px;
    }
    .fc-rating-slider::-moz-range-thumb {
      width: 36px;
      height: 36px;
    }
    .fc-rating-slider {
      height: 10px;
    }
  }
`;



