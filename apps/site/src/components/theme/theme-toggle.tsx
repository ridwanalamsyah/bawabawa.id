"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-1",
        className
      )}
      role="radiogroup"
      aria-label="Pilih tema"
    >
      {[
        { v: "light" as const, icon: Sun, label: "Terang" },
        { v: "dark" as const, icon: Moon, label: "Gelap" },
        { v: "system" as const, icon: Monitor, label: "Sistem" },
      ].map(({ v, icon: Icon, label }) => (
        <button
          key={v}
          role="radio"
          aria-checked={theme === v}
          aria-label={label}
          title={label}
          onClick={() => setTheme(v)}
          className={cn(
            "h-8 w-8 inline-flex items-center justify-center rounded-full transition-all",
            theme === v
              ? "bg-[hsl(var(--sage-700))] text-[hsl(var(--primary-foreground))] shadow-sm"
              : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-2))]"
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
