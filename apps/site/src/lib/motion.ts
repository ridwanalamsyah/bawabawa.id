import type { CSSProperties } from "react";

/** Stagger helper for `.animate-rise`, `.animate-pop` and `[data-reveal]`. */
export function delay(ms: number): CSSProperties {
  return { "--d": `${ms}ms` } as CSSProperties;
}
