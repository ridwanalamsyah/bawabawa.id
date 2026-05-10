import * as React from "react";
import Image from "next/image";
import { cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  src,
  size = 36,
  className,
}: {
  name: string;
  src?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-[hsl(var(--sage-300))] to-[hsl(var(--sage-600))] text-white font-medium",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.38) }}
      aria-label={name}
    >
      {src ? (
        <Image src={src} alt={name} width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  );
}
