import type { PlanId } from "./stripe";

// Features and the minimum plan required to access them
export const FEATURE_GATES = {
  // Pro features
  theme_color: "pro",
  conditional_logic: "pro",
  qr_code: "pro",
  form_duplication: "pro",
  email_notifications: "pro",
  password_protection: "pro",
  hide_branding: "pro",

  // Business features
  file_upload: "business",
  tracked_links: "business",
  redirect_url: "business",
  csv_export: "business",
  ai_summary: "free", // available to all, but quota-limited
  ai_generation: "free", // available to all, but quota-limited
} as const;

export type Feature = keyof typeof FEATURE_GATES;

const PLAN_RANK: Record<PlanId, number> = {
  free: 0,
  pro: 1,
  business: 2,
};

export function hasFeatureAccess(userPlan: PlanId, feature: Feature): boolean {
  const requiredPlan = FEATURE_GATES[feature];
  return PLAN_RANK[userPlan] >= PLAN_RANK[requiredPlan];
}

export function getRequiredPlan(feature: Feature): PlanId {
  return FEATURE_GATES[feature];
}
