import type { CSSProperties } from "react";

/**
 * Soft colour orbs behind the hero. Plain radial gradients — no `filter:
 * blur()`: iOS Safari painted large blurred, animated layers as black
 * boxes. Pure CSS drift, switched off from Admin → Pengaturan → Animasi.
 */
export function AmbientOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span
        className="animate-orb-drift absolute -top-40 -left-32 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(closest-side,hsl(var(--sage-500)/0.28),transparent)]"
        style={{ "--orb-duration": "26s" } as CSSProperties}
      />
      <span
        className="animate-orb-drift absolute -top-10 right-[-10rem] h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(closest-side,hsl(var(--amber-400)/0.22),transparent)]"
        style={{ "--orb-duration": "32s", animationDirection: "reverse" } as CSSProperties}
      />
      <span
        className="animate-orb-drift absolute bottom-[-12rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(closest-side,hsl(var(--sky-500)/0.16),transparent)]"
        style={{ "--orb-duration": "38s" } as CSSProperties}
      />
    </div>
  );
}
