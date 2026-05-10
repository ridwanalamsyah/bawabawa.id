import { cn } from "@/lib/utils";

export function Logo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-linear-to-br from-[hsl(var(--sage-500))] via-[hsl(var(--sage-700))] to-[hsl(var(--emerald-600))] shadow-[0_8px_24px_-8px_hsl(var(--sage-700)/0.6)]"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 8.5C5 6.6 6.6 5 8.5 5h7C17.4 5 19 6.6 19 8.5v0c0 1.7-1.3 3-3 3H8c-1.7 0-3 1.3-3 3v0C5 16.4 6.6 18 8.5 18h7c1.9 0 3.5-1.6 3.5-3.5" />
          <circle cx="8.2" cy="8.5" r="0.9" fill="currentColor" />
          <circle cx="15.8" cy="14.5" r="0.9" fill="currentColor" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[hsl(var(--emerald-400))] ring-2 ring-[hsl(var(--bg))]" />
      </span>
      {withWordmark && (
        <span className="font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Bawabawa<span className="text-[hsl(var(--sage-600))]">.id</span>
        </span>
      )}
    </div>
  );
}
