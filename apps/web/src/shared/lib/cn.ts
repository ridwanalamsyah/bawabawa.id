import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Compose class names with `clsx` semantics, then dedupe with `tailwind-merge`.
 * Used by all shadcn-style primitives in this app.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
