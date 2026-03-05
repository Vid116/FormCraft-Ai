"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { PlanId } from "@/lib/stripe";

const PLAN_DISPLAY = [
  {
    id: "free" as PlanId,
    name: "Free",
    price: "$0",
    features: [
      "1 active form",
      "Unlimited responses",
      "1 AI summary of responses/mo",
      "4 AI-generated forms/mo",
      "Forms are branded",
    ],
  },
  {
    id: "pro" as PlanId,
    name: "Pro",
    price: "$19",
    popular: true,
    features: [
      "Unlimited forms",
      "Unlimited responses",
      "20 AI summaries of responses/mo",
      "Unlimited AI-generated forms",
      "Customize form colors to match your brand",
      "Conditional logic (show/hide questions)",
      "QR code sharing",
      "Form duplication",
      "Email notifications",
      "Password-protected forms",
      "Email support",
    ],
  },
  {
    id: "business" as PlanId,
    name: "Business",
    price: "$49",
    features: [
      "Everything in Pro, plus:",
      "Unlimited AI summaries of responses",
      "Remove branding",
      "File upload fields",
      "Tracked survey links (per agent, case, or campaign)",
      "Custom redirect URL after submission",
      "Custom subdomain (forms.yourcompany.com)",
      "PDF export of AI summaries",
      "CSV export of raw response data",
      "Advanced analytics (trends, completion rates, drop-off)",
      "Webhook integrations (Slack, Zapier)",
      "API access",
      "Team seats (10 included, more on request)",
      "99.9% uptime SLA",
      "Data retention & security compliance",
      "Dedicated onboarding",
      "Priority support",
    ],
  },
];

export function BillingClient({
  currentPlan,
  hasSubscription,
  periodEnd,
  usage,
}: {
  currentPlan: PlanId;
  hasSubscription: boolean;
  periodEnd: string | null;
  usage: {
    forms: number;
    maxForms: number;
    aiSummaries: number;
    maxAiSummaries: number;
    aiGenerations: number;
    maxAiGenerations: number;
  };
}) {
  const [loading, setLoading] = useState<PlanId | "portal" | null>(null);
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  async function handleCheckout(plan: PlanId) {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.assign(data.url);
      }
    } catch {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.assign(data.url);
      }
    } catch {
      setLoading(null);
    }
  }

  const formPct = usage.maxForms === Infinity ? 0 : (usage.forms / usage.maxForms) * 100;
  const summaryPct = usage.maxAiSummaries === Infinity ? 0 : (usage.aiSummaries / usage.maxAiSummaries) * 100;
  const generationPct = usage.maxAiGenerations === Infinity ? 0 : (usage.aiGenerations / usage.maxAiGenerations) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
        Billing
      </h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-8">
        Manage your plan and usage
      </p>

      {success && (
        <div className="mb-6 px-4 py-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm rounded-lg">
          Your plan has been upgraded successfully!
        </div>
      )}
      {canceled && (
        <div className="mb-6 px-4 py-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm rounded-lg">
          Checkout was canceled. No changes were made.
        </div>
      )}

      {/* Usage overview */}
      <div className="mb-8 space-y-3">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Active forms
            </span>
            <span className="text-sm text-zinc-900 dark:text-zinc-100 font-mono">
              {usage.forms} / {usage.maxForms === Infinity ? "\u221e" : usage.maxForms}
            </span>
          </div>
          {usage.maxForms !== Infinity && (
            <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  formPct > 80 ? "bg-red-500" : formPct > 50 ? "bg-amber-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(formPct, 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              AI summaries this month
            </span>
            <span className="text-sm text-zinc-900 dark:text-zinc-100 font-mono">
              {usage.aiSummaries} / {usage.maxAiSummaries === Infinity ? "\u221e" : usage.maxAiSummaries}
            </span>
          </div>
          {usage.maxAiSummaries !== Infinity && (
            <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  summaryPct > 80 ? "bg-red-500" : summaryPct > 50 ? "bg-amber-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(summaryPct, 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              AI form generations this month
            </span>
            <span className="text-sm text-zinc-900 dark:text-zinc-100 font-mono">
              {usage.aiGenerations} / {usage.maxAiGenerations === Infinity ? "\u221e" : usage.maxAiGenerations}
            </span>
          </div>
          {usage.maxAiGenerations !== Infinity && (
            <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  generationPct > 80 ? "bg-red-500" : generationPct > 50 ? "bg-amber-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(generationPct, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLAN_DISPLAY.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <div
              key={plan.id}
              className={`relative p-6 rounded-xl border transition-all ${
                isCurrent
                  ? "border-blue-600 ring-1 ring-blue-600 bg-blue-50/50 dark:bg-blue-950/20"
                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-4 px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                  Current plan
                </span>
              )}
              {plan.popular && !isCurrent && (
                <span className="text-xs font-medium text-blue-600 mb-2 block">
                  Most popular
                </span>
              )}
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {plan.name}
              </h3>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  {plan.price}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 text-sm">
                  /month
                </span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) =>
                  f.endsWith(":") ? (
                    <li key={f} className="text-sm font-medium text-zinc-700 dark:text-zinc-300 pb-1">
                      {f}
                    </li>
                  ) : (
                    <li
                      key={f}
                      className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4 text-green-500 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {f}
                    </li>
                  )
                )}
              </ul>

              {isCurrent ? (
                hasSubscription ? (
                  <button
                    onClick={handlePortal}
                    disabled={loading === "portal"}
                    className="w-full py-2 text-sm font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    {loading === "portal" ? "Loading..." : "Manage subscription"}
                  </button>
                ) : (
                  <div className="w-full py-2 text-sm text-center text-zinc-400 dark:text-zinc-500">
                    Your current plan
                  </div>
                )
              ) : plan.id === "free" ? (
                hasSubscription ? (
                  <button
                    onClick={handlePortal}
                    disabled={loading === "portal"}
                    className="w-full py-2 text-sm font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    {loading === "portal" ? "Loading..." : "Downgrade"}
                  </button>
                ) : null
              ) : (
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading === plan.id}
                  className={`w-full py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                    plan.popular
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  {loading === plan.id ? "Loading..." : "Upgrade"}
                </button>
              )}

              {isCurrent && periodEnd && (
                <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500 text-center">
                  Renews{" "}
                  {new Date(periodEnd).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
