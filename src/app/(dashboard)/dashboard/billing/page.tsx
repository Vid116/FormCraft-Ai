import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUserSubscription, checkAiQuota } from "@/lib/subscription";
import { PLANS } from "@/lib/stripe";
import { BillingClient } from "./billing-client";

export const metadata: Metadata = {
  title: "Billing - FormPoki Fat",
};

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const subscription = user
    ? await getUserSubscription(supabase, user.id)
    : null;

  const currentPlan = subscription?.status === "active" ? subscription.plan : "free";

  // Get usage stats
  const { count: formCount } = await supabase
    .from("forms")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id);

  const limits = PLANS[currentPlan];

  const summaryQuota = await checkAiQuota(supabase, user!.id, "summary");
  const generationQuota = await checkAiQuota(supabase, user!.id, "generation");

  return (
    <BillingClient
      currentPlan={currentPlan}
      hasSubscription={!!subscription?.stripe_subscription_id}
      periodEnd={subscription?.current_period_end ?? null}
      usage={{
        forms: formCount ?? 0,
        maxForms: limits.maxForms,
        aiSummaries: summaryQuota.current,
        maxAiSummaries: limits.maxAiSummaries,
        aiGenerations: generationQuota.current,
        maxAiGenerations: limits.maxAiGenerations,
      }}
    />
  );
}

