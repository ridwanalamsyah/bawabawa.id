import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--surface))] px-4 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none transition-shadow focus:border-[hsl(var(--ring))] focus:ring-4 focus:ring-[hsl(var(--ring)/0.15)] disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[88px] w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--surface))] px-4 py-3 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none transition-shadow focus:border-[hsl(var(--ring))] focus:ring-4 focus:ring-[hsl(var(--ring)/0.15)] disabled:opacity-50 resize-y",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-medium text-[hsl(var(--foreground))]", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";
