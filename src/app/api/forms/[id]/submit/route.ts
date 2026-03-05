import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: formId } = await params;

  // Rate limit by IP — 10 submissions per minute per form
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { success } = rateLimit(`submit:${ip}:${formId}`, {
    maxRequests: 10,
    windowMs: 60_000,
  });
  if (!success) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { answers, metadata, _hp_field, _t } = body;

    // Honeypot check — bots fill hidden fields
    if (_hp_field) {
      // Silently accept but don't store — bot thinks it succeeded
      return NextResponse.json({ success: true });
    }

    // Timing check — reject if submitted in under 2 seconds (likely bot)
    if (_t && Date.now() - _t < 2000) {
      return NextResponse.json({ success: true });
    }

    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify form exists and is published
    const { data: form } = await supabase
      .from("forms")
      .select("id, is_published, settings")
      .eq("id", formId)
      .eq("is_published", true)
      .single();

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const responseId = uuidv4();
    const insertPayload: Record<string, unknown> = {
      id: responseId,
      form_id: formId,
      answers,
      submitted_at: new Date().toISOString(),
    };

    if (metadata && Object.keys(metadata).length > 0) {
      insertPayload.metadata = metadata;
    }

    const { error: insertError } = await supabase
      .from("responses")
      .insert(insertPayload);

    if (insertError) throw insertError;

    await supabase.rpc("increment_response_count", { form_id_input: formId });

    // Fire notification (non-blocking)
    if (form.settings?.notifications_email) {
      const baseUrl = req.nextUrl.origin;
      fetch(`${baseUrl}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form_id: formId, response_id: responseId }),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, id: responseId });
  } catch (err) {
    console.error("[Submit Error]", err);
    return NextResponse.json(
      { error: "Failed to submit response" },
      { status: 500 }
    );
  }
}
