import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-[hsl(var(--surface-2)/0.7)] border border-[hsl(var(--border)/0.6)]",
        className
      )}
      {...props}
    />
  );
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.7)] backdrop-blur-md p-5 sm:p-6">
      <Skeleton className="h-5 w-32 mb-3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3.5 mb-2.5 last:mb-0"
          style={{ width: `${85 - i * 10}%` }}
        />
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
