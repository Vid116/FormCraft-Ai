import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AccountClient } from "./account-client";

export const metadata: Metadata = {
  title: "Account - FormPoki Fat",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AccountClient
      email={user?.email ?? ""}
      createdAt={user?.created_at ?? ""}
    />
  );
}

