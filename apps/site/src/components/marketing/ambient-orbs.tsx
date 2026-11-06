import type { CSSProperties } from "react";

/**
 * Warm pastel glow behind the hero — uses soft Blush Pink (#E98881) and
 * Butter Cream (#F5DFAD) instead of olive/green fog so the cream background
 * stays bright, clean, and appetizing.
 */
export function AmbientOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span
        className="animate-orb-drift absolute -top-36 -left-28 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(closest-side,rgba(233,136,129,0.16),transparent)]"
        style={{ "--orb-duration": "28s" } as CSSProperties}
      />
      <span
        className="animate-orb-drift absolute -top-12 right-[-8rem] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(closest-side,rgba(245,223,173,0.38),transparent)]"
        style={{ "--orb-duration": "34s", animationDirection: "reverse" } as CSSProperties}
      />
      <span
        className="animate-orb-drift absolute bottom-[-10rem] left-1/3 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(closest-side,rgba(155,157,68,0.08),transparent)]"
        style={{ "--orb-duration": "40s" } as CSSProperties}
      />
    </div>
  );
}
