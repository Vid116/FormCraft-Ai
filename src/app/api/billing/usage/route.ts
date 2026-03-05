import { createClient } from "@/lib/supabase/server";
import { checkFormLimit, getUserPlan, checkAiQuota } from "@/lib/subscription";
import { PLANS } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plan = await getUserPlan(supabase, user.id);
    const formCheck = await checkFormLimit(supabase, user.id);
    const summaryQuota = await checkAiQuota(supabase, user.id, "summary");
    const generationQuota = await checkAiQuota(supabase, user.id, "generation");

    return NextResponse.json({
      plan,
      limits: PLANS[plan],
      forms: {
        current: formCheck.current,
        limit: formCheck.limit,
        allowed: formCheck.allowed,
      },
      aiSummaries: {
        current: summaryQuota.current,
        limit: summaryQuota.limit,
        allowed: summaryQuota.allowed,
      },
      aiGenerations: {
        current: generationQuota.current,
        limit: generationQuota.limit,
        allowed: generationQuota.allowed,
      },
    });
  } catch (err) {
    console.error("[Usage Error]", err);
    return NextResponse.json({ error: "Failed to check usage" }, { status: 500 });
  }
}
