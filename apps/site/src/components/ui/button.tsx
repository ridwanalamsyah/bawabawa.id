import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(var(--sage-700))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--sage-800))] shadow-[0_8px_24px_-8px_hsl(var(--sage-700)/0.5)]",
        primary:
          "bg-[hsl(var(--sage-700))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--sage-800))] shadow-[0_8px_24px_-8px_hsl(var(--sage-700)/0.5)]",
        accent:
          "bg-[hsl(var(--emerald-500))] text-white hover:bg-[hsl(var(--emerald-600))] shadow-[0_8px_24px_-8px_hsl(var(--emerald-500)/0.55)]",
        outline:
          "border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.7)] backdrop-blur hover:bg-[hsl(var(--surface-2))] text-[hsl(var(--foreground))]",
        ghost:
          "hover:bg-[hsl(var(--surface-2))] text-[hsl(var(--foreground))]",
        soft:
          "bg-[hsl(var(--sage-100))] text-[hsl(var(--sage-800))] hover:bg-[hsl(var(--sage-200))] dark:bg-[hsl(var(--sage-700)/0.4)] dark:text-[hsl(var(--sage-100))] dark:hover:bg-[hsl(var(--sage-700)/0.6)]",
        link:
          "text-[hsl(var(--sage-700))] underline-offset-4 hover:underline",
        destructive:
          "bg-[hsl(var(--danger))] text-white hover:bg-[hsl(var(--danger))]/90",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
