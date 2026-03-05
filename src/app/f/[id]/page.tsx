import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PublicFormRenderer } from "@/components/forms/public-form-renderer";
import type { Form } from "@/lib/types/form";

export default async function PublicFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
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

  const typedForm = form as Form;

  // Extract tracking params — support both ?t=shortcode and legacy raw query params
  const trackingParams: Record<string, string> = {};
  if (typedForm.settings.survey_mode === "tracked" && typedForm.settings.tracking_fields?.length) {
    const shortCode = typeof sp.t === "string" ? sp.t : undefined;

    if (shortCode) {
      // Resolve short code from tracked_links table
      const { data: trackedLink } = await supabase
        .from("tracked_links")
        .select("params")
        .eq("short_code", shortCode)
        .eq("form_id", id)
        .single();

      if (trackedLink?.params && typeof trackedLink.params === "object") {
        for (const key of typedForm.settings.tracking_fields) {
          const val = (trackedLink.params as Record<string, unknown>)[key];
          if (typeof val === "string" && val) {
            trackingParams[key] = val;
          }
        }
      }
    } else {
      // Legacy: read params directly from URL query string
      for (const key of typedForm.settings.tracking_fields) {
        const val = sp[key];
        if (typeof val === "string" && val) {
          trackingParams[key] = val;
        }
      }
    }
  }

  return (
    <PublicFormRenderer
      form={typedForm}
      trackingParams={trackingParams}
      isPasswordProtected={!!typedForm.settings.password_hash}
    />
  );
}
