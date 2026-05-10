import { GlassCard } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  trend = "up",
  tone = "from-[hsl(var(--sage-500))] to-[hsl(var(--emerald-500))]",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down";
  tone?: string;
}) {
  return (
    <GlassCard className="p-5 relative overflow-hidden">
      <div className={cn("absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-25 blur-2xl bg-gradient-to-br", tone)} />
      <div className="flex items-center gap-2.5">
        <span className={cn("h-9 w-9 rounded-2xl grid place-items-center bg-gradient-to-br text-white", tone)}>
          <Icon className="h-4 w-4" />
        </span>
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
