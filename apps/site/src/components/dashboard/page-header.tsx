import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6", className)}>
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))] max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
