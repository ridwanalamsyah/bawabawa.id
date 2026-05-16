"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogIn } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Public-facing navigation. /admin intentionally NOT linked here — staff
// access the panel by typing the URL directly and authenticating via
// the existing /login flow (the layout's middleware enforces role=admin).
// Dashboard intentionally not in the public nav either; users land there
// automatically after login via the avatar/menu in the dashboard layout.
const NAV = [
  { href: "/open-trip", label: "Open Trip" },
  { href: "/request", label: "Titip Sekarang" },
];

export function MarketingNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "backdrop-blur-xl bg-[hsl(var(--bg)/0.7)] border-b border-[hsl(var(--border))]"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <Logo />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "text-[hsl(var(--sage-800))] dark:text-[hsl(var(--sage-100))]"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                )}
              >
                {active && (
                  <span className="absolute inset-0 rounded-full bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.4)] -z-10" />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
            <Link href="/login">
              <LogIn className="h-4 w-4" /> Masuk
            </Link>
          </Button>
          <button
            onClick={() => setOpen((s) => !s)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))]"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-[hsl(var(--border))] bg-[hsl(var(--bg))] px-4 py-4 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-sm hover:bg-[hsl(var(--surface-2))]"
            >
              {item.label}
            </Link>
          ))}
          <div className="flex items-center justify-between pt-2">
            <ThemeToggle />
            <Button asChild size="sm" variant="outline">
              <Link href="/login">
                <LogIn className="h-4 w-4" /> Masuk
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
