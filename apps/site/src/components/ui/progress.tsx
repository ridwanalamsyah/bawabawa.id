import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--surface-2))]", className)}
    >
      <div
        className={cn(
          "h-full rounded-full bg-linear-to-r from-[hsl(var(--sage-500))] to-[hsl(var(--emerald-500))] transition-[width] duration-700",
          barClassName
        )}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
