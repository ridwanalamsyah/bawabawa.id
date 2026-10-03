import Link from "next/link";
import { BookOpen, Cookie, Footprints, Shirt, Smartphone, Sparkles } from "lucide-react";
import { delay } from "@/lib/motion";

const CATEGORIES = [
  { href: "/jastip-fashion", label: "Fashion & distro", icon: Shirt, tile: "bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.3)]", ink: "text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]" },
  { href: "/jastip-sepatu", label: "Sepatu lokal", icon: Footprints, tile: "bg-[hsl(var(--amber-100))]", ink: "text-[hsl(var(--amber-600))]" },
  { href: "/jastip-skincare", label: "Skincare", icon: Sparkles, tile: "bg-[hsl(var(--coral-100))]", ink: "text-[hsl(var(--coral-600))]" },
  { href: "/jastip-makanan", label: "Oleh-oleh", icon: Cookie, tile: "bg-[hsl(var(--amber-100))]", ink: "text-[hsl(var(--amber-600))]" },
  { href: "/jastip-buku", label: "Buku", icon: BookOpen, tile: "bg-[hsl(var(--plum-100))]", ink: "text-[hsl(var(--plum-600))]" },
  { href: "/jastip-elektronik", label: "Elektronik", icon: Smartphone, tile: "bg-[hsl(var(--sky-100))]", ink: "text-[hsl(var(--sky-600))]" },
];

/** Tappable category tiles — the quickest way to browse what people titip. */
export function CategoryGrid() {
  return (
    <section className="py-12 sm:py-16" aria-labelledby="cat-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div data-reveal className="flex items-end justify-between gap-4">
          <h2 id="cat-title" className="text-2xl sm:text-3xl">
            Mau titip apa?
          </h2>
          <Link href="/katalog" className="nudge text-sm font-medium underline underline-offset-4">
            Lihat katalog →
          </Link>
        </div>
        <ul className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-3">
          {CATEGORIES.map(({ href, label, icon: Icon, tile, ink }, i) => (
            <li key={href} data-reveal style={delay(i * 60)}>
              <Link href={href} className={`lift group flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl p-3 text-center ${tile}`}>
                <Icon className={`h-8 w-8 sm:h-9 sm:w-9 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 ${ink}`} aria-hidden />
                <span className="text-xs sm:text-sm font-semibold leading-tight">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
