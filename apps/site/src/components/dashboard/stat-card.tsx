import { GlassCard } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  trend = "up",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down";
  /** @deprecated decorative gradient removed; kept so existing callers compile. */
  tone?: string;
}) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
        <Icon className="h-4 w-4" aria-hidden />
        <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {delta && (
        <div className="mt-1 flex items-center gap-1 text-xs">
          {trend === "up" ? (
            <ArrowUpRight className="h-3.5 w-3.5 text-[hsl(var(--emerald-600))]" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5 text-[hsl(var(--danger))]" />
          )}
          <span className={trend === "up" ? "text-[hsl(var(--emerald-600))] dark:text-[hsl(var(--emerald-400))]" : "text-[hsl(var(--danger))]"}>
            {delta}
          </span>
          <span className="text-[hsl(var(--muted-foreground))]">vs minggu lalu</span>
        </div>
      )}
    </GlassCard>
  );
}
