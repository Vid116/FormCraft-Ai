import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { summarizeResponses } from "@/lib/ai/provider";
import { checkAiQuota, recordAiUsage } from "@/lib/subscription";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID().slice(0, 8);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.warn(`[AI_ROUTE][summarize][${requestId}] unauthorized`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check AI summary quota
  const quota = await checkAiQuota(supabase, user.id, "summary");
  if (!quota.allowed) {
    console.warn(
      `[AI_ROUTE][summarize][${requestId}] quota_block user=${user.id} current=${quota.current} limit=${quota.limit}`
    );
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
    console.warn(`[AI_ROUTE][summarize][${requestId}] invalid_payload user=${user.id}`);
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    console.info(
      `[AI_ROUTE][summarize][${requestId}] start user=${user.id} form_title="${form_title}" responses=${responses.length}`
    );
    const summary = await summarizeResponses(form_title, fields, responses);

    // Record usage after successful generation
    await recordAiUsage(supabase, user.id, "summary");
    const durationMs = Date.now() - startedAt;
    console.info(
      `[AI_ROUTE][summarize][${requestId}] success user=${user.id} duration_ms=${durationMs} summary_chars=${summary.length}`
    );

    return NextResponse.json({ summary });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    console.error(`[AI_ROUTE][summarize][${requestId}] failed user=${user.id} duration_ms=${durationMs}`, error);
    return NextResponse.json(
      { error: "Failed to generate summary. Please try again." },
      { status: 500 }
    );
  }
}
