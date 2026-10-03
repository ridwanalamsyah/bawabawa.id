import Link from "next/link";
import { Footprints, Sparkles, Shirt, Cookie, Smartphone, BookOpen } from "lucide-react";

const ITEMS = [
  { href: "/jastip-fashion", label: "Fashion & distro", icon: Shirt },
  { href: "/jastip-sepatu", label: "Sepatu lokal", icon: Footprints },
  { href: "/jastip-skincare", label: "Skincare & kosmetik", icon: Sparkles },
  { href: "/jastip-makanan", label: "Oleh-oleh & makanan khas", icon: Cookie },
  { href: "/jastip-buku", label: "Buku", icon: BookOpen },
  { href: "/jastip-elektronik", label: "Elektronik & aksesoris", icon: Smartphone },
];

/**
 * Scrolling strip of what people titip from Bandung. Each chip links to its
 * category page; the strip pauses on hover/focus. The list is rendered twice
 * so the CSS loop is seamless; the copy is hidden from screen readers.
 */
export function CategoryMarquee() {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-3 pr-3" aria-hidden={hidden || undefined}>
      {ITEMS.map(({ href, label, icon: Icon }) => (
        <li key={href}>
          <Link
            href={href}
            tabIndex={hidden ? -1 : undefined}
            className="lift inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 py-2 text-sm font-medium hover:border-[hsl(var(--sage-500))]"
          >
            <Icon className="h-4 w-4 text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]" aria-hidden />
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label="Kategori titipan populer" className="border-b border-[hsl(var(--border))] py-5">
      <div className="marquee group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <div className="animate-marquee flex w-max group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </section>
  );
}
