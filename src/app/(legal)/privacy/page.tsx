import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - FormPoki Fat",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <header className="border-b border-zinc-100 dark:border-zinc-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <Link href="/" className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
            FormPoki<span className="text-blue-600">Fat</span>
          </Link>
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
          Last updated: February 10, 2026
        </p>

        <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">1. Introduction</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              FormPoki Fat (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our form builder service at formpokifat.ai (the &quot;Service&quot;). By using the Service, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">2. Information We Collect</h2>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-4 mb-2">Account Information</h3>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              When you create an account, we collect your email address and an encrypted password. If you upgrade to a paid plan, our payment processor (Stripe) collects billing information on our behalf.
            </p>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-4 mb-2">Form Data</h3>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              We store the forms you create and the responses submitted to those forms. Form creators own and control this data.
            </p>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-4 mb-2">Usage Data</h3>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              We collect information about how you interact with the Service, including AI feature usage counts for quota enforcement. We do not track browsing behavior across third-party websites.
            </p>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-4 mb-2">Cookies</h3>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              We use strictly necessary cookies to maintain your authentication session. We do not use advertising or third-party tracking cookies. See our <Link href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</Link> for details.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600 dark:text-zinc-400">
              <li>To provide and maintain the Service</li>
              <li>To authenticate your identity and manage your account</li>
              <li>To process payments and manage subscriptions</li>
              <li>To generate AI-powered form suggestions and response summaries</li>
              <li>To enforce usage quotas based on your subscription plan</li>
              <li>To send transactional emails (verification, password reset, form notifications)</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">4. AI Data Processing</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              When you use AI features (form generation, response summarization), your prompts and form response data are sent to our AI provider (Anthropic) for processing. This data is not used by Anthropic to train their models. AI-generated content is returned to and stored within your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">5. Data Sharing</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              We do not sell your personal data. We share data only with the following service providers who process it on our behalf:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600 dark:text-zinc-400 mt-2">
              <li><strong>Supabase</strong> &mdash; Database hosting and authentication</li>
              <li><strong>Stripe</strong> &mdash; Payment processing</li>
              <li><strong>Anthropic</strong> &mdash; AI processing for form generation and summarization</li>
              <li><strong>Vercel</strong> &mdash; Application hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">6. Your Rights (GDPR / CCPA)</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Depending on your location, you may have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600 dark:text-zinc-400 mt-2">
              <li><strong>Right to Access</strong> &mdash; Request a copy of all data we hold about you</li>
              <li><strong>Right to Portability</strong> &mdash; Export your data in a machine-readable format (JSON) from your Account Settings</li>
              <li><strong>Right to Rectification</strong> &mdash; Update your personal information in Account Settings</li>
              <li><strong>Right to Erasure</strong> &mdash; Delete your account and all associated data from Account Settings</li>
              <li><strong>Right to Restrict Processing</strong> &mdash; Contact us to restrict how we process your data</li>
              <li><strong>Right to Object</strong> &mdash; Object to processing of your data for certain purposes</li>
              <li><strong>Right to Withdraw Consent</strong> &mdash; Withdraw consent at any time where processing is consent-based</li>
            </ul>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mt-3">
              To exercise these rights, visit your <Link href="/dashboard/account" className="text-blue-600 hover:underline">Account Settings</Link> or contact us at privacy@formpokifat.ai.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">7. Data Retention</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              We retain your data for as long as your account is active. When you delete your account, all your personal data, forms, and form responses are permanently deleted within 30 days. Anonymized, aggregated data may be retained for analytics purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">8. Data Security</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              We implement appropriate security measures including encryption in transit (TLS), encryption at rest, row-level security policies on our database, and secure authentication via Supabase Auth. However, no method of electronic transmission or storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">9. Children&apos;s Privacy</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              The Service is not intended for users under the age of 16. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us at privacy@formpokifat.ai.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">10. Changes to This Policy</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              We may update this policy from time to time. We will notify you of significant changes by email or by a notice on the Service. Your continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">11. Contact Us</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              For privacy-related inquiries, contact us at: <br />
              <strong>Email:</strong> privacy@formpokifat.ai
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}


