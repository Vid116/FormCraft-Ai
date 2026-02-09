import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { summarizeResponses } from "@/lib/ai/provider";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { form_title, fields, responses } = await request.json();

  if (!form_title || !fields || !responses) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const summary = await summarizeResponses(form_title, fields, responses);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("AI summarization error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary. Please try again." },
      { status: 500 }
    );
  }
}
