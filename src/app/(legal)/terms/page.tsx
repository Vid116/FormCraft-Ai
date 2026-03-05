import Link from "next/link";

export const metadata = {
  title: "Terms of Service - FormCraft AI",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <header className="border-b border-zinc-100 dark:border-zinc-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <Link href="/" className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
            FormCraft<span className="text-blue-600">AI</span>
          </Link>
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
          Last updated: February 10, 2026
        </p>

        <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">1. Acceptance of Terms</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              By accessing or using FormCraft AI (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">2. Description of Service</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              FormCraft AI is an online form builder that uses artificial intelligence to help users create forms, collect responses, and generate insights from submissions. The Service is provided on a subscription basis with free and paid tiers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">3. Account Registration</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              You must create an account to use the Service. You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account. You must provide accurate and complete information and notify us immediately of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">4. Subscription Plans and Billing</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              The Service offers Free, Pro, and Business plans. Paid subscriptions are billed monthly via Stripe. You may upgrade, downgrade, or cancel at any time through your billing settings. Cancellations take effect at the end of the current billing period. We do not provide refunds for partial billing periods.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">5. Acceptable Use</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600 dark:text-zinc-400 mt-2">
              <li>Collect personal data without proper consent or legal basis</li>
              <li>Create forms that facilitate illegal activity, fraud, or harassment</li>
              <li>Distribute malware, spam, or phishing content</li>
              <li>Attempt to gain unauthorized access to other users&apos; accounts or data</li>
              <li>Circumvent usage quotas or rate limits</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">6. Your Content</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              You retain ownership of all forms, questions, and configurations you create (&quot;Your Content&quot;). By using the Service, you grant us a limited license to host, store, and process Your Content solely to operate and improve the Service. We do not claim ownership of form responses submitted by third parties; these belong to you as the form creator.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">7. AI-Generated Content</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              The Service uses AI to generate forms and summarize responses. AI-generated content is provided &quot;as-is&quot; without guarantees of accuracy, completeness, or suitability. You are responsible for reviewing and validating any AI-generated content before use. We are not liable for decisions made based on AI-generated summaries or insights.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">8. Data Processing Responsibilities</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              As a form creator, you act as the data controller for information collected through your forms. You are responsible for ensuring that your data collection practices comply with applicable privacy laws (including GDPR and CCPA), obtaining necessary consents from respondents, and providing appropriate privacy disclosures on your forms. FormCraft AI acts as a data processor on your behalf.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">9. Service Availability</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              We strive to maintain high availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable for maintenance, updates, or due to factors beyond our control. Business plan customers are covered by a 99.9% uptime SLA as detailed in their plan terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">10. Limitation of Liability</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              To the maximum extent permitted by law, FormCraft AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or goodwill arising out of or in connection with your use of the Service. Our total liability shall not exceed the amount you have paid us in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">11. Termination</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              We reserve the right to suspend or terminate your account if you violate these Terms. You may delete your account at any time from your Account Settings. Upon termination, your data will be permanently deleted in accordance with our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">12. Changes to Terms</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              We may update these Terms from time to time. We will notify you of material changes by email or by posting a notice on the Service. Continued use of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">13. Governing Law</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable law, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">14. Contact</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              For questions about these Terms, contact us at: <br />
              <strong>Email:</strong> legal@formcraft.ai
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
