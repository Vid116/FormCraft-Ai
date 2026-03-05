import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Nav */}
      <header className="border-b border-zinc-100 dark:border-zinc-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
            FormPoki<span className="text-blue-600">Fat</span>
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
        <div className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-950 text-blue-600 text-xs font-medium rounded-full mb-6">
          AI-Powered Form Builder
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight max-w-3xl mx-auto">
          Describe your form.
          <br />
          <span className="text-blue-600">AI builds it instantly.</span>
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 mt-6 max-w-xl mx-auto leading-relaxed">
          Stop dragging and dropping for hours. Tell FormPoki Fat what you need in plain English and get a professional form in seconds — with AI-powered response insights.
        </p>
        <div className="flex items-center justify-center gap-4 mt-10">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Start building for free
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-12">
          Three steps. That&apos;s it.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Describe",
              desc: "Tell AI what kind of form you need in plain English. Be as specific or vague as you want.",
            },
            {
              step: "2",
              title: "Customize",
              desc: "AI generates your form instantly. Tweak fields, reorder questions, add your branding.",
            },
            {
              step: "3",
              title: "Collect & Analyze",
              desc: "Share your form link. AI summarizes responses with insights, trends, and sentiment analysis.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="text-center p-6"
            >
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 text-blue-600 font-bold rounded-full flex items-center justify-center mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-4">
          Simple pricing
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-center mb-12">
          Start free. Upgrade when you&apos;re ready.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              name: "Free",
              price: "$0",
              features: [
                "1 active form",
                "Unlimited responses",
                "1 AI summary of responses/mo",
                "4 AI-generated forms/mo",
                "Forms are branded",
              ],
            },
            {
              name: "Pro",
              price: "$19",
              popular: true,
              features: [
                "Unlimited forms",
                "Unlimited responses",
                "20 AI summaries of responses/mo",
                "Unlimited AI-generated forms",
                "Customize form colors to match your brand",
                "Conditional logic (show/hide questions)",
                "QR code sharing",
                "Form duplication",
                "Email notifications",
                "Password-protected forms",
                "Email support",
              ],
            },
            {
              name: "Business",
              price: "$49",
              features: [
                "Everything in Pro, plus:",
                "Unlimited AI summaries of responses",
                "Remove branding",
                "File upload fields",
                "Tracked survey links (per agent, case, or campaign)",
                "Custom redirect URL after submission",
                "Custom subdomain (forms.yourcompany.com)",
                "PDF export of AI summaries",
                "CSV export of raw response data",
                "Advanced analytics (trends, completion rates, drop-off)",
                "Webhook integrations (Slack, Zapier)",
                "API access",
                "Team seats (10 included, more on request)",
                "99.9% uptime SLA",
                "Data retention & security compliance",
                "Dedicated onboarding",
                "Priority support",
              ],
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`p-6 rounded-xl border ${
                plan.popular
                  ? "border-blue-600 ring-1 ring-blue-600"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              {plan.popular && (
                <span className="text-xs font-medium text-blue-600 mb-2 block">Most popular</span>
              )}
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{plan.name}</h3>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{plan.price}</span>
                <span className="text-zinc-500 dark:text-zinc-400 text-sm">/month</span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((f) =>
                  f.endsWith(":") ? (
                    <li key={f} className="text-sm font-medium text-zinc-700 dark:text-zinc-300 pb-1">
                      {f}
                    </li>
                  ) : (
                    <li key={f} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  )
                )}
              </ul>
              <Link
                href={plan.name === "Free" ? "/signup" : "/signup?plan=" + plan.name.toLowerCase()}
                className={`block text-center mt-6 py-2 text-sm font-medium rounded-lg transition-colors ${
                  plan.popular
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                {plan.name === "Free" ? "Get started" : "Start free trial"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 dark:border-zinc-900 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-400">
            FormPoki Fat &mdash; Build smarter forms with AI
          </p>
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <Link href="/privacy" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}


