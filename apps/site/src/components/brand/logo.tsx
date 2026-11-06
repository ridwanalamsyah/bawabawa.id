import Image from "next/image";
import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
  withWordmark?: boolean;
  withTagline?: boolean;
  variant?: "default" | "simplified" | "main";
}

export function Logo({
  className,
  withWordmark = true,
  withTagline = true,
  variant = "default",
}: LogoProps) {
  if (variant === "simplified") {
    return (
      <div className={cn("inline-flex items-center", className)}>
        <Image
          src="/brand/logo-simplified.png"
          alt="Bawabawa.id — Your Jastip Bestie"
          width={210}
          height={54}
          className="h-9 w-auto object-contain"
          priority
        />
      </div>
    );
  }

  if (variant === "main") {
    return (
      <div className={cn("inline-flex flex-col items-center gap-1.5", className)}>
        <Image
          src="/brand/logo-mark.png"
          alt="Bawabawa.id"
          width={153}
          height={109}
          className="h-20 w-auto object-contain drop-shadow-[0_6px_14px_rgba(109,111,39,0.18)]"
          priority
        />
        {withWordmark && (
          <span className="font-display text-2xl font-bold tracking-tight text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
            Bawabawa.id
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#FCF3E4] shadow-[0_6px_18px_-6px_hsl(var(--sage-700)/0.45)] ring-1 ring-[hsl(var(--sage-700)/0.18)] transition-transform duration-200 group-hover:scale-[1.03]"
      >
        <Image
          src="/brand/sub-mark.png"
          alt=""
          width={80}
          height={80}
          className="h-full w-full object-cover"
          priority
        />
      </span>
      {withWordmark && (
        <>
          <span
            aria-hidden
            className="h-7 w-px bg-[hsl(var(--sage-700)/0.24)] dark:bg-[hsl(var(--sage-300)/0.24)]"
          />
          <span className="flex flex-col justify-center leading-none">
            <span className="inline-flex items-center gap-1 font-display text-[1.18rem] font-bold tracking-[-0.02em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
              Bawabawa<span>.id</span>
              <svg
                viewBox="0 0 16 16"
                aria-hidden
                className="-mt-1.5 h-3 w-3 text-[#E97E75] shrink-0"
                fill="currentColor"
              >
                <path d="M8 0.5C8.55 4.6 11.4 7.45 15.5 8C11.4 8.55 8.55 11.4 8 15.5C7.45 11.4 4.6 8.55 0.5 8C4.6 7.45 7.45 4.6 8 0.5Z" />
              </svg>
            </span>
            {withTagline && (
              <span className="mt-1 inline-flex items-center gap-1.5 text-[9.5px] font-medium tracking-[0.08em] text-[hsl(var(--sage-600))] dark:text-[hsl(var(--sage-300))]">
                <span aria-hidden className="h-px w-2.5 bg-current opacity-60" />
                <span>Your Jastip Bestie</span>
                <span aria-hidden className="h-px w-2.5 bg-current opacity-60" />
              </span>
            )}
          </span>
        </>
      )}
    </div>
  );
}
