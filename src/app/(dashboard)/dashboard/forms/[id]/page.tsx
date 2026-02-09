import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FormResponsesView } from "@/components/dashboard/form-responses-view";
import { PublishToggle } from "@/components/dashboard/publish-toggle";
import { QRCodeDisplay } from "@/components/dashboard/qr-code";
import { DuplicateFormButton } from "@/components/dashboard/duplicate-form-button";
import type { Form, FormResponse } from "@/lib/types/form";

export default async function FormDetailPage({
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

  const typedForm = form as Form;

  const { data: responses } = await supabase
    .from("responses")
    .select("*")
    .eq("form_id", id)
    .order("submitted_at", { ascending: false });

  const typedResponses = (responses ?? []) as FormResponse[];

  const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/f/${typedForm.id}`;

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
          <DuplicateFormButton form={typedForm} />
          <Link
            href={`/dashboard/forms/${typedForm.id}/edit`}
            className="px-4 py-2 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
          >
            Edit
          </Link>
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
          <QRCodeDisplay url={publicUrl} />
        </div>
      )}

      <FormResponsesView
        form={typedForm}
        responses={typedResponses}
      />
    </div>
  );
}
