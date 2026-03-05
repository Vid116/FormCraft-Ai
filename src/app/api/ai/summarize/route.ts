import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { summarizeResponses } from "@/lib/ai/provider";
import { checkAiQuota, recordAiUsage } from "@/lib/subscription";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check AI summary quota
  const quota = await checkAiQuota(supabase, user.id, "summary");
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: "Monthly AI summary limit reached",
        quota: { current: quota.current, limit: quota.limit, plan: quota.plan },
      },
      { status: 429 }
    );
  }

  const { form_title, fields, responses } = await request.json();

  if (!form_title || !fields || !responses) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const summary = await summarizeResponses(form_title, fields, responses);

    // Record usage after successful generation
    await recordAiUsage(supabase, user.id, "summary");

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("AI summarization error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary. Please try again." },
      { status: 500 }
    );
  }
}
