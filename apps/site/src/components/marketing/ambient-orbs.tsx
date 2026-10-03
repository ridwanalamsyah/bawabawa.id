import type { CSSProperties } from "react";

/**
 * Decorative colour orbs behind the hero. Pure CSS (orb-drift keyframes),
 * so they render on first paint without JS. Switched off from
 * Admin → Pengaturan → Animasi.
 */
export function AmbientOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span
        className="animate-orb-drift absolute -top-32 -left-24 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(closest-side,hsl(var(--sage-500)/0.45),transparent_75%)] blur-3xl"
        style={{ "--orb-duration": "26s" } as CSSProperties}
      />
      <span
        className="animate-orb-drift absolute top-12 right-[-6rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(closest-side,hsl(var(--olive-500)/0.35),transparent_75%)] blur-3xl"
        style={{ "--orb-duration": "32s", animationDirection: "reverse" } as CSSProperties}
      />
      <span
        className="animate-orb-drift absolute bottom-[-8rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(closest-side,hsl(var(--emerald-500)/0.30),transparent_75%)] blur-3xl"
        style={{ "--orb-duration": "38s" } as CSSProperties}
      />
    </div>
  );
}
