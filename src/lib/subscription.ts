import { SupabaseClient } from "@supabase/supabase-js";
import { PLANS, PlanId } from "./stripe";

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: PlanId;
  status: "active" | "canceled" | "past_due" | "trialing";
  current_period_end: string | null;
  created_at: string;
}

export async function getUserSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<Subscription | null> {
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  return data as Subscription | null;
}

export async function getUserPlan(
  supabase: SupabaseClient,
  userId: string
): Promise<PlanId> {
  const sub = await getUserSubscription(supabase, userId);
  if (!sub || sub.status !== "active") return "free";
  return sub.plan;
}

export async function checkAiQuota(
  supabase: SupabaseClient,
  userId: string,
  type: "summary" | "generation"
): Promise<{ allowed: boolean; current: number; limit: number; plan: PlanId }> {
  const plan = await getUserPlan(supabase, userId);
  const limits = PLANS[plan];
  const maxUsage = type === "summary" ? limits.maxAiSummaries : limits.maxAiGenerations;

  if (maxUsage === Infinity) {
    return { allowed: true, current: 0, limit: maxUsage, plan };
  }

  // Count usage this calendar month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", type)
    .gte("created_at", monthStart);

  const current = count ?? 0;
  return {
    allowed: current < maxUsage,
    current,
    limit: maxUsage,
    plan,
  };
}

export async function recordAiUsage(
  supabase: SupabaseClient,
  userId: string,
  type: "summary" | "generation"
): Promise<void> {
  await supabase.from("ai_usage").insert({ user_id: userId, type });
}

export async function checkFormLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; current: number; limit: number; plan: PlanId }> {
  const plan = await getUserPlan(supabase, userId);
  const limits = PLANS[plan];

  const { count } = await supabase
    .from("forms")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const current = count ?? 0;
  return {
    allowed: current < limits.maxForms,
    current,
    limit: limits.maxForms,
    plan,
  };
}
