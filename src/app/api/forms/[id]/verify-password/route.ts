import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Form } from "@/lib/types/form";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { password } = await request.json();

  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: form } = await supabase
    .from("forms")
    .select("settings")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const typedForm = form as Pick<Form, "settings">;
  const storedHash = typedForm.settings.password_hash;

  if (!storedHash) {
    // No password set — allow access
    return NextResponse.json({ valid: true });
  }

  // Simple hash comparison using Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  if (hash === storedHash) {
    return NextResponse.json({ valid: true });
  }

  return NextResponse.json({ valid: false, error: "Incorrect password" }, { status: 403 });
}
