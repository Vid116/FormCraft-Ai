import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
    });
  }
  return _stripe;
}

export const PLANS = {
  free: {
    name: "Free",
    maxForms: 1,
    maxAiSummaries: 1,
    maxAiGenerations: 4,
    features: [
      "1 active form",
      "Unlimited responses",
      "1 AI summary of responses/mo",
      "4 AI-generated forms/mo",
      "Form duplication",
      "Forms are branded",
    ],
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
    maxForms: Infinity,
    maxAiSummaries: 20,
    maxAiGenerations: Infinity,
    features: [
      "Unlimited forms",
      "Unlimited responses",
      "20 AI summaries of responses/mo",
      "Unlimited AI-generated forms",
      "Customize form colors to match your brand",
      "Conditional logic (show/hide questions)",
      "QR code sharing",
      "Email notifications",
      "Password-protected forms",
      "Email support",
    ],
  },
  business: {
    name: "Business",
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID ?? "",
    maxForms: Infinity,
    maxAiSummaries: Infinity,
    maxAiGenerations: Infinity,
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
} as const;

export type PlanId = keyof typeof PLANS;

export function getPlanByPriceId(priceId: string): PlanId {
  if (priceId === PLANS.pro.priceId) return "pro";
  if (priceId === PLANS.business.priceId) return "business";
  return "free";
}
