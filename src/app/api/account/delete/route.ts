import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete all user data using service role (bypasses RLS)
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Delete in order: ai_usage -> responses (via forms) -> tracked_links -> forms -> subscriptions
  // Responses and tracked_links have ON DELETE CASCADE from forms, so deleting forms cascades.
  await serviceClient.from("ai_usage").delete().eq("user_id", user.id);
  await serviceClient.from("subscriptions").delete().eq("user_id", user.id);
  await serviceClient.from("forms").delete().eq("user_id", user.id);

  // Delete the auth user (this also cascades any remaining FK references)
  const { error } = await serviceClient.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete account. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
