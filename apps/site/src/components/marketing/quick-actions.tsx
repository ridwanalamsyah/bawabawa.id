import Link from "next/link";
import { ArrowRight, Link2, Plane, Search, ShoppingBag } from "lucide-react";
import { delay } from "@/lib/motion";

const ACTIONS = [
  {
    href: "/request",
    title: "Titip barang",
    desc: "Tempel link, kami cek harga",
    icon: Link2,
    tile: "bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.3)]",
    ink: "text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]",
  },
  {
    href: "/katalog",
    title: "Katalog",
    desc: "Harga sudah pasti",
    icon: ShoppingBag,
    tile: "bg-[hsl(var(--amber-100))]",
    ink: "text-[hsl(var(--amber-600))]",
  },
  {
    href: "/open-trip",
    title: "Open Trip",
    desc: "Kargo hemat ≤50 kg",
    icon: Plane,
    tile: "bg-[hsl(var(--sky-100))]",
    ink: "text-[hsl(var(--sky-600))]",
  },
  {
    href: "/lacak",
    title: "Lacak pesanan",
    desc: "Pakai link dari WA",
    icon: Search,
    tile: "bg-[hsl(var(--coral-100))]",
    ink: "text-[hsl(var(--coral-600))]",
  },
];

/** Four big tappable entry points right under the hero. */
export function QuickActions() {
  return (
    <section aria-label="Mulai dari sini" className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 -mt-4 pb-6">
      <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {ACTIONS.map(({ href, title, desc, icon: Icon, tile, ink }, i) => (
          <li key={href} data-reveal style={delay(i * 70)}>
            <Link
              href={href}
              className={`lift group flex h-full flex-col gap-3 rounded-2xl p-4 sm:p-5 ${tile}`}
            >
              <span className={`grid h-11 w-11 place-items-center rounded-xl bg-white/70 dark:bg-black/20 ${ink}`}>
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className="flex items-center gap-1 font-semibold">
                  {title}
                  <ArrowRight className="h-4 w-4 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" aria-hidden />
                </span>
                <span className="mt-0.5 block text-sm text-[hsl(var(--muted-foreground))]">{desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
