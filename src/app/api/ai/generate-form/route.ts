import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFormFromDescription } from "@/lib/ai/provider";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { description } = await request.json();

  if (!description || typeof description !== "string") {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }

  try {
    const generated = await generateFormFromDescription(description);
    return NextResponse.json(generated);
  } catch (error) {
    console.error("AI form generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate form. Please try again." },
      { status: 500 }
    );
  }
}
