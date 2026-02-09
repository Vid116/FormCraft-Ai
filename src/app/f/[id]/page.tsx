import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PublicFormRenderer } from "@/components/forms/public-form-renderer";
import type { Form } from "@/lib/types/form";

export default async function PublicFormPage({
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
    .eq("is_published", true)
    .single();

  if (!form) {
    notFound();
  }

  return <PublicFormRenderer form={form as Form} />;
}
