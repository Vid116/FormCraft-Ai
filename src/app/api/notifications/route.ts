import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { form_id, response_id } = await req.json();
    if (!form_id) {
      return NextResponse.json({ error: "form_id required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch form to get notification settings
    const { data: form } = await supabase
      .from("forms")
      .select("title, settings")
      .eq("id", form_id)
      .single();

    if (!form?.settings?.notifications_email) {
      return NextResponse.json({ skipped: true });
    }

    const email = form.settings.notifications_email;

    // Fetch the response for details
    let responsePreview = "";
    if (response_id) {
      const { data: resp } = await supabase
        .from("responses")
        .select("answers")
        .eq("id", response_id)
        .single();

      if (resp?.answers) {
        const entries = Object.entries(resp.answers as Record<string, unknown>);
        responsePreview = entries
          .slice(0, 5)
          .map(([, val]) => {
            if (typeof val === "string") return val;
            if (val && typeof val === "object" && "score" in val)
              return `Rating: ${(val as { score: number }).score}`;
            return JSON.stringify(val);
          })
          .join(" | ");
      }
    }

    // Send via Supabase Edge Function, webhook, or email API
    // Configure NOTIFICATION_WEBHOOK_URL in .env for Slack/Discord/email service
    const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: `New response: ${form.title}`,
          text: `Your form "${form.title}" received a new response.\n\nPreview: ${responsePreview || "(no preview available)"}\n\nView all responses in your FormCraft dashboard.`,
        }),
      });
    }

    // Also log for debugging
    console.log(
      `[Notification] New response on "${form.title}" → ${email}${responsePreview ? ` | ${responsePreview}` : ""}`
    );

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[Notification Error]", err);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
