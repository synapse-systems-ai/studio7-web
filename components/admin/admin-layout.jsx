"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Tag, Users, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin/promotions" className="text-sm font-bold tracking-tight">
              Studio 7 Admin
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              {nav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    pathname?.startsWith(href)
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-100",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <Home className="mr-1.5 h-4 w-4" />
                Site
              </Link>
            </Button>
            {session?.user?.email && (
              <span className="hidden text-xs text-zinc-500 sm:inline">{session.user.email}</span>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-1.5 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
