"use client";

import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
function userInitials(user) {
  const name = String(user?.name ?? "").trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return String(user?.email ?? "?")
    .slice(0, 2)
    .toUpperCase();
}

export function AdminUserMenu({ user, onSignOut }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!user) return null;

  const initials = userInitials(user);
  const role = String(user.role || "member").replace("_", " ");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="group relative rounded-full outline-none ring-offset-2 ring-offset-background transition hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
        aria-label="Open account menu"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-0.5 rounded-full bg-gradient-to-br from-zinc-400/80 via-zinc-200/40 to-zinc-600/70 opacity-90 blur-[0.5px] dark:from-zinc-500/60 dark:via-white/25 dark:to-zinc-700/80"
        />
        <Avatar size="lg" className="relative size-10 shadow-md ring-1 ring-black/5 dark:ring-white/15">
          <AvatarFallback className="bg-gradient-to-br from-zinc-700 via-zinc-900 to-black text-[11px] font-black tracking-tight text-white dark:from-zinc-300 dark:via-zinc-100 dark:to-zinc-400 dark:text-zinc-950">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="truncate text-sm font-semibold text-foreground">{user.name || "Team member"}</p>
            <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{role}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2"
          onClick={() => setTheme("light")}
          data-active={mounted && theme === "light" ? true : undefined}
        >
          <Sun className="size-4" />
          Light mode
          {mounted && theme === "light" ? <span className="ml-auto text-xs text-muted-foreground">On</span> : null}
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onClick={() => setTheme("dark")}>
          <Moon className="size-4" />
          Dark mode
          {mounted && theme === "dark" ? <span className="ml-auto text-xs text-muted-foreground">On</span> : null}
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onClick={() => setTheme("system")}>
          <Monitor className="size-4" />
          System
          {mounted && theme === "system" ? <span className="ml-auto text-xs text-muted-foreground">On</span> : null}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="gap-2"
          onClick={() => onSignOut?.()}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
