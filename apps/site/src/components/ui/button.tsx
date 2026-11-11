import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A5828] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#4A5828] text-[#FAF6EE] hover:bg-[#3A461E]",
        primary:
          "bg-[#4A5828] text-[#FAF6EE] hover:bg-[#3A461E]",
        accent:
          "bg-[#A64B2A] text-[#FAF6EE] hover:bg-[#8C3D20]",
        outline:
          "border border-[#C9BFA9] bg-[#FFFDF9] hover:bg-[#F2ECDF] text-[#1C2016]",
        ghost:
          "hover:bg-[#F2ECDF] text-[#1C2016]",
        soft:
          "bg-[#F2ECDF] text-[#1C2016] hover:bg-[#DDD5C4]",
        link:
          "text-[#4A5828] underline-offset-4 hover:underline",
        destructive:
          "bg-[#9E2B25] text-[#FAF6EE] hover:bg-[#82221D]",
      },
      size: {
        default: "min-h-[44px] px-5 py-2",
        sm: "min-h-[40px] px-4 py-1.5 text-xs",
        lg: "min-h-[48px] px-6 py-2.5 text-base",
        icon: "h-11 w-11",
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
