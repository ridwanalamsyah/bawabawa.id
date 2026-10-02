"use client";

import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function Topbar({
  title,
  subtitle,
  user,
}: {
  title: string;
  subtitle?: string;
  user?: { name: string; role?: string };
}) {
  return (
    <header className="sticky top-0 z-30 bg-[hsl(var(--bg))] border-b border-[hsl(var(--border))]">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{subtitle}</p>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* The search box (⌘K) and notification bell were decorative: the
              search did nothing and the bell listed hardcoded fake events.
              Order updates reach customers via WhatsApp and /track. */}
          <ThemeToggle />
          {user && (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[hsl(var(--border))]">
              <Avatar name={user.name} size={32} />
              <div className="leading-tight">
                <p className="text-sm font-medium">{user.name}</p>
                {user.role && <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{user.role}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
