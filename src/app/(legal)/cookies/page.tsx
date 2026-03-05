import Link from "next/link";

export const metadata = {
  title: "Cookie Policy - FormCraft AI",
};

export default function CookiePolicyPage() {
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
          Cookie Policy
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
          Last updated: February 10, 2026
        </p>

        <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">What Are Cookies</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Cookies are small text files stored on your device when you visit a website. They are widely used to make websites work efficiently and provide information to website owners.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Cookies We Use</h2>

            <div className="mt-4 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-zinc-700 dark:text-zinc-300">Cookie</th>
                    <th className="text-left px-4 py-2 font-medium text-zinc-700 dark:text-zinc-300">Type</th>
                    <th className="text-left px-4 py-2 font-medium text-zinc-700 dark:text-zinc-300">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  <tr>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400 font-mono text-xs">sb-*-auth-token</td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">Strictly Necessary</td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">Maintains your authentication session with Supabase</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400 font-mono text-xs">cookie-consent</td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">Strictly Necessary</td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">Stores your cookie consent preference</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Third-Party Cookies</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              We do not use any third-party advertising or analytics cookies. Our payment provider Stripe may set cookies during the checkout process to prevent fraud. These are governed by <a href="https://stripe.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Stripe&apos;s Privacy Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Managing Cookies</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              You can control cookies through your browser settings. Note that disabling strictly necessary cookies will prevent you from signing in to the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Contact</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Questions? Contact us at privacy@formcraft.ai.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
