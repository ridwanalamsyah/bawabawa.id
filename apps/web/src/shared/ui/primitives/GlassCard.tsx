import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  elevated?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { className, interactive, elevated, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      data-interactive={interactive ? "true" : undefined}
      data-elevated={elevated ? "true" : undefined}
      className={cn("bb-glass-card", className)}
      {...rest}
    />
  );
});

GlassCard.displayName = "GlassCard";
