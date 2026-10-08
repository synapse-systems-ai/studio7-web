"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Tag, Users } from "lucide-react";
import { AdminUserMenu } from "@/components/admin/admin-user-menu";
import { Studio7Logo } from "@/components/brand/studio7-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-jwt-auth";

const nav = [
  { href: "/admin/promotions", label: "Promotions", icon: Tag },
  { href: "/admin/users", label: "Users", icon: Users },
];

export function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/auth/signin");
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header
        className={cn(
          "sticky top-0 z-40 border-b shadow-sm",
          "border-border bg-card text-card-foreground",
          "dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:shadow-lg",
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-3">
              <Studio7Logo size={40} href="/admin/promotions" className="ring-white/10 dark:ring-white/10" />
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-semibold tracking-tight">Studio 7</p>
                <p className="truncate text-[11px] text-muted-foreground dark:text-zinc-400">Admin</p>
              </div>
            </div>
            <nav className="flex items-center gap-1 overflow-x-auto">
              {nav.map(({ href, label, icon: Icon }) => {
                const active = pathname?.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground dark:bg-white dark:text-zinc-950"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <ThemeToggle
              variant="ghost"
              className="text-muted-foreground hover:text-foreground dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
            />
            <AdminUserMenu user={session?.user} onSignOut={signOut} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">{children}</main>
    </div>
  );
}
