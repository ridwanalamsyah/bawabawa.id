import { Heart, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ITEMS = [
  { name: "Sepatu Compass Gazelle Hi", category: "Fashion", price: 540000, store: "Pasar Baru" },
  { name: "Brownies Amanda", category: "Snack Bandung", price: 80000, store: "Outlet Cihampelas" },
  { name: "Cardigan Erigo Boxy", category: "Fashion", price: 320000, store: "Trans Studio Mall" },
  { name: "Avoskin Skincare Set", category: "Skincare", price: 350000, store: "Avoskin Outlet Dago" },
  { name: "Hijab Vanilla Premium", category: "Hijab", price: 130000, store: "Pasar Baru Lt.2" },
  { name: "Tas Eiger Anaconda 25L", category: "Tas", price: 490000, store: "Eiger Adventure Store" },
];

export default function WishlistPage() {
  return (
    <>
      <PageHeader
        eyebrow="Wishlist"
        title="Barang yang lagi kamu incar"
        description="Tinggal pilih, langsung dititipkan saat ada Open Trip cocok."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ITEMS.map((it, i) => (
          <GlassCard key={i} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-2xl bg-linear-to-br from-[hsl(var(--sage-300))] to-[hsl(var(--sage-700))] grid place-items-center text-white">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <button className="h-8 w-8 rounded-full bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.4)] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))] grid place-items-center">
                <Heart className="h-4 w-4 fill-current" />
              </button>
            </div>
            <p className="font-semibold">{it.name}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{it.store}</p>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="neutral">{it.category}</Badge>
              <span className="ml-auto font-semibold tabular-nums">Rp {it.price.toLocaleString("id-ID")}</span>
            </div>
            <Button asChild size="sm" variant="primary" className="w-full mt-4">
              <Link href="/request">Titip sekarang</Link>
            </Button>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
