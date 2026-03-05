import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Top nav */}
      <header className="relative border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-8">
              <MobileNav email={user.email ?? ""} />
              <Link href="/dashboard" className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                FormPoki<span className="text-blue-600">Fat</span>
              </Link>
              <nav className="hidden sm:flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  My Forms
                </Link>
                <Link
                  href="/dashboard/billing"
                  className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Billing
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/account"
                className="text-sm text-zinc-500 dark:text-zinc-400 hidden sm:block hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                title="Account settings"
              >
                {user.email}
              </Link>
              <ThemeToggle />
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}


