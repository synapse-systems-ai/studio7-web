"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Tag, Users, LogOut } from "lucide-react";
import { Studio7Logo } from "@/components/brand/studio7-logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <div className="min-h-dvh bg-zinc-100 text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950 text-white shadow-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-3">
              <Studio7Logo size={40} href="/admin/promotions" className="ring-white/10" />
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-semibold tracking-tight">Studio 7</p>
                <p className="truncate text-[11px] text-zinc-400">Admin</p>
              </div>
            </div>
            <nav className="flex items-center gap-1 overflow-x-auto">
              {nav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                    pathname?.startsWith(href)
                      ? "bg-white text-zinc-950"
                      : "text-zinc-300 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {session?.user?.email ? (
              <Badge
                variant="secondary"
                className="hidden max-w-[180px] truncate border-zinc-700 bg-zinc-900 text-zinc-200 lg:inline-flex"
              >
                {session.user.email}
              </Badge>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-200 hover:bg-zinc-800 hover:text-white"
              onClick={signOut}
            >
              <LogOut className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">{children}</main>
    </div>
  );
}
