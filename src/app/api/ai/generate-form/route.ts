import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFormFromDescription } from "@/lib/ai/provider";
import { checkAiQuota, recordAiUsage } from "@/lib/subscription";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check AI generation quota
  const quota = await checkAiQuota(supabase, user.id, "generation");
  if (!quota.allowed) {
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
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }

  try {
    const generated = await generateFormFromDescription(description);

    // Record usage after successful generation
    await recordAiUsage(supabase, user.id, "generation");

    return NextResponse.json(generated);
  } catch (error) {
    console.error("AI form generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate form. Please try again." },
      { status: 500 }
    );
  }
}
