"use client";

import { motion } from "framer-motion";

/**
 * Decorative ambient orbs for hero / page backgrounds. Pure presentation, no
 * interactivity. Uses three layered radial gradients with slow parallax loops
 * (60s cycle) and respects prefers-reduced-motion via tailwind's media query.
 */
export function AmbientOrbs() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden"
    >
      <motion.span
        className="absolute -top-32 -left-24 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(closest-side,hsl(var(--sage-500)/0.45),transparent_75%)] blur-3xl"
        animate={{
          x: [0, 40, -20, 0],
          y: [0, 30, -10, 0],
          scale: [1, 1.06, 0.96, 1],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute top-12 right-[-6rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(closest-side,hsl(var(--olive-500)/0.35),transparent_75%)] blur-3xl"
        animate={{
          x: [0, -30, 20, 0],
          y: [0, 20, -20, 0],
          scale: [1, 1.04, 0.98, 1],
        }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute bottom-[-8rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(closest-side,hsl(var(--emerald-500)/0.30),transparent_75%)] blur-3xl"
        animate={{
          x: [0, 30, -10, 0],
          y: [0, -20, 10, 0],
          scale: [1, 1.05, 0.95, 1],
        }}
        transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
