import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateShortCode } from "@/lib/short-code";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: formId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: form } = await supabase
    .from("forms")
    .select("id, user_id, settings")
    .eq("id", formId)
    .single();

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }
  if (form.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const trackingParams: Record<string, string> = body.params;

  if (!trackingParams || typeof trackingParams !== "object" || Object.keys(trackingParams).length === 0) {
    return NextResponse.json(
      { error: "params object is required with at least one key-value pair" },
      { status: 400 }
    );
  }

  // Validate param keys match the form's tracking_fields
  const allowedFields: string[] = form.settings?.tracking_fields ?? [];
  if (allowedFields.length > 0) {
    const invalidKeys = Object.keys(trackingParams).filter((k) => !allowedFields.includes(k));
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: `Invalid tracking fields: ${invalidKeys.join(", ")}. Allowed: ${allowedFields.join(", ")}` },
        { status: 400 }
      );
    }
  }

  // Generate unique short code with retry for collisions
  const MAX_RETRIES = 5;
  let shortCode = "";
  let inserted = false;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    shortCode = generateShortCode();
    const { error: insertError } = await supabase
      .from("tracked_links")
      .insert({
        short_code: shortCode,
        form_id: formId,
        params: trackingParams,
        created_by: user.id,
      });

    if (!insertError) {
      inserted = true;
      break;
    }

    // Unique violation — retry with a new code
    if (insertError.code === "23505") continue;

    console.error("Error inserting tracked link:", insertError);
    return NextResponse.json({ error: "Failed to create tracked link" }, { status: 500 });
  }

  if (!inserted) {
    return NextResponse.json({ error: "Failed to generate unique short code" }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const url = `${siteUrl}/f/${formId}?t=${shortCode}`;

  return NextResponse.json({ short_code: shortCode, url, params: trackingParams });
}
