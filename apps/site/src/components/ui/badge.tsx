import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[hsl(var(--sage-100))] text-[hsl(var(--sage-800))] dark:bg-[hsl(var(--sage-700)/0.4)] dark:text-[hsl(var(--sage-100))]",
        outline: "border-[hsl(var(--border))] text-[hsl(var(--foreground))]",
        success:
          "border-transparent bg-[hsl(var(--emerald-500)/0.12)] text-[hsl(var(--emerald-600))] dark:text-[hsl(var(--emerald-400))]",
        warning:
          "border-transparent bg-[hsl(var(--warning)/0.15)] text-[hsl(38_92%_36%)]",
        danger:
          "border-transparent bg-[hsl(var(--danger)/0.12)] text-[hsl(var(--danger))]",
        info:
          "border-transparent bg-[hsl(220_60%_55%/0.12)] text-[hsl(220_60%_45%)]",
        neutral:
          "border-transparent bg-[hsl(var(--surface-2))] text-[hsl(var(--muted-foreground))]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
