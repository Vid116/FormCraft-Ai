import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { EditFormClient } from "./edit-form-client";
import { getUserPlan } from "@/lib/subscription";
import type { Form } from "@/lib/types/form";

export const metadata: Metadata = {
  title: "Edit Form - FormPoki Fat",
};

export default async function EditFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const plan = user ? await getUserPlan(supabase, user.id) : "free";

  const { data: form } = await supabase
    .from("forms")
    .select("*")
    .eq("id", id)
    .single();

  if (!form) {
    notFound();
  }

  return <EditFormClient form={form as Form} plan={plan} />;
}

