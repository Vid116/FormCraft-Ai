import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FormResponsesView } from "@/components/dashboard/form-responses-view";
import { PublishToggle } from "@/components/dashboard/publish-toggle";
import { QRCodeDisplay } from "@/components/dashboard/qr-code";
import { DuplicateFormButton } from "@/components/dashboard/duplicate-form-button";
import { TrackedLinkGenerator } from "@/components/dashboard/tracked-link-generator";
import { DeleteFormButton } from "@/components/dashboard/delete-form-button";
import { getUserPlan } from "@/lib/subscription";
import { hasFeatureAccess, getRequiredPlan } from "@/lib/features";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import type { Form, FormResponse } from "@/lib/types/form";
import type { PlanId } from "@/lib/stripe";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: form } = await supabase
    .from("forms")
    .select("title")
    .eq("id", id)
    .single();
  return {
    title: form ? `${form.title} - FormPoki Fat` : "Form - FormPoki Fat",
  };
}

export default async function FormDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const plan: PlanId = user ? await getUserPlan(supabase, user.id) : "free";

  const { data: form } = await supabase
    .from("forms")
    .select("*")
    .eq("id", id)
    .single();

  if (!form) {
    notFound();
  }

  const typedForm = form as Form;

  const { data: responses } = await supabase
    .from("responses")
    .select("*")
    .eq("form_id", id)
    .order("submitted_at", { ascending: false });

  const typedResponses = (responses ?? []) as FormResponse[];

  const requestHeaders = await headers();
  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const forwardedHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const inferredOrigin =
    forwardedHost
      ? `${forwardedProto ?? "https"}://${forwardedHost}`
      : "http://localhost:3000";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || inferredOrigin;
  const publicUrl = `${baseUrl}/f/${typedForm.id}`;

  const canDuplicate = hasFeatureAccess(plan, "form_duplication");
  const canQR = hasFeatureAccess(plan, "qr_code");
  const canTrackedLinks = hasFeatureAccess(plan, "tracked_links");
  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-2 inline-block"
          >
            &larr; Back to forms
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {typedForm.title}
          </h1>
          {typedForm.description && (
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              {typedForm.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <PublishToggle formId={typedForm.id} isPublished={typedForm.is_published} />
          {canDuplicate ? (
            <DuplicateFormButton form={typedForm} />
          ) : (
            <span title="Upgrade to Pro to duplicate forms" className="px-4 py-2 text-sm font-medium border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-400 cursor-not-allowed flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Duplicate
            </span>
          )}
          <Link
            href={`/dashboard/forms/${typedForm.id}/edit`}
            className="px-4 py-2 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
          >
            Edit
          </Link>
          <DeleteFormButton formId={typedForm.id} formTitle={typedForm.title} />
        </div>
      </div>

      {typedForm.is_published && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Share this link:
            </span>
            <code className="text-sm bg-white dark:bg-zinc-900 px-2 py-1 rounded border text-blue-600">
              {publicUrl}
            </code>
          </div>
          {canQR ? (
            <QRCodeDisplay url={publicUrl} />
          ) : (
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              QR Code (Pro)
            </span>
          )}
        </div>
      )}

      {/* Tracked link generator — only for published tracked forms with Business plan */}
      {typedForm.is_published &&
        typedForm.settings.survey_mode === "tracked" &&
        typedForm.settings.tracking_fields &&
        typedForm.settings.tracking_fields.length > 0 && (
          <div className="mb-6">
            {canTrackedLinks ? (
              <TrackedLinkGenerator
                formId={typedForm.id}
                baseUrl={publicUrl}
                trackingFields={typedForm.settings.tracking_fields}
              />
            ) : (
              <UpgradePrompt feature="Tracked Survey Links" requiredPlan={getRequiredPlan("tracked_links")} />
            )}
          </div>
        )}

      <FormResponsesView
        form={typedForm}
        responses={typedResponses}
        plan={plan}
      />
    </div>
  );
}

