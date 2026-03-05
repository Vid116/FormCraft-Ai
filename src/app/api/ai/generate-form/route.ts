import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFormFromDescription } from "@/lib/ai/provider";
import { checkAiQuota, recordAiUsage } from "@/lib/subscription";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID().slice(0, 8);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.warn(`[AI_ROUTE][generate-form][${requestId}] unauthorized`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check AI generation quota
  const quota = await checkAiQuota(supabase, user.id, "generation");
  if (!quota.allowed) {
    console.warn(
      `[AI_ROUTE][generate-form][${requestId}] quota_block user=${user.id} current=${quota.current} limit=${quota.limit}`
    );
    return NextResponse.json(
      {
        error: "Monthly AI form generation limit reached",
        quota: { current: quota.current, limit: quota.limit, plan: quota.plan },
      },
      { status: 429 }
    );
  }

  const { description } = await request.json();

  if (!description || typeof description !== "string") {
    console.warn(`[AI_ROUTE][generate-form][${requestId}] invalid_description user=${user.id}`);
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }

  try {
    console.info(
      `[AI_ROUTE][generate-form][${requestId}] start user=${user.id} description_chars=${description.length}`
    );
    const generated = await generateFormFromDescription(description);

    // Record usage after successful generation
    await recordAiUsage(supabase, user.id, "generation");
    const durationMs = Date.now() - startedAt;
    console.info(
      `[AI_ROUTE][generate-form][${requestId}] success user=${user.id} duration_ms=${durationMs} fields=${generated.fields.length}`
    );

    return NextResponse.json(generated);
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    console.error(`[AI_ROUTE][generate-form][${requestId}] failed user=${user.id} duration_ms=${durationMs}`, error);
    return NextResponse.json(
      { error: "Failed to generate form. Please try again." },
      { status: 500 }
    );
  }
}
