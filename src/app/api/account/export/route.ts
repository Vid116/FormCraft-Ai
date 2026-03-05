import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all user data
  const [formsResult, subscriptionResult, aiUsageResult] = await Promise.all([
    supabase.from("forms").select("*").eq("user_id", user.id),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("ai_usage").select("*").eq("user_id", user.id),
  ]);

  // Fetch responses for all user's forms
  const formIds = (formsResult.data ?? []).map((f) => f.id);
  const responses: Record<string, unknown[]> = {};

  if (formIds.length > 0) {
    const { data: allResponses } = await supabase
      .from("responses")
      .select("*")
      .in("form_id", formIds);

    // Group responses by form
    for (const resp of allResponses ?? []) {
      const fid = resp.form_id as string;
      if (!responses[fid]) responses[fid] = [];
      responses[fid].push(resp);
    }
  }

  // Fetch tracked links for user's forms
  let trackedLinks: unknown[] = [];
  if (formIds.length > 0) {
    const { data } = await supabase
      .from("tracked_links")
      .select("*")
      .in("form_id", formIds);
    trackedLinks = data ?? [];
  }

  const exportData = {
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at,
    },
    subscription: subscriptionResult.data,
    forms: (formsResult.data ?? []).map((form) => ({
      ...form,
      responses: responses[form.id] ?? [],
    })),
    tracked_links: trackedLinks,
    ai_usage: aiUsageResult.data ?? [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="formcraft-data-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
