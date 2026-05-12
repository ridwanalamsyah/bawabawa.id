"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  duration?: number;
  formatter?: (v: number) => string;
  className?: string;
};

export function AnimatedCounter({
  value,
  duration = 1800,
  formatter = (v) => Math.round(v).toLocaleString("id-ID"),
  className,
}: Props) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const hasRunRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasRunRef.current) return;

    const start = () => {
      if (hasRunRef.current) return;
      hasRunRef.current = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(eased * value);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            start();
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {formatter(display)}
    </span>
  );
}
