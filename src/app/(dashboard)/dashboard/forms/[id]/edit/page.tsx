import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { EditFormClient } from "./edit-form-client";
import type { Form } from "@/lib/types/form";

export default async function EditFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: form } = await supabase
    .from("forms")
    .select("*")
    .eq("id", id)
    .single();

  if (!form) {
    notFound();
  }

  return <EditFormClient form={form as Form} />;
}
