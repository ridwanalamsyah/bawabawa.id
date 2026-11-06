import type { Metadata } from "next";
import Image from "next/image";
import { Download } from "lucide-react";

export const metadata: Metadata = {
  title: "Press Kit & Brand Assets",
  description:
    "Logo, palet warna pastel, tipografi, dan aset resmi Bawabawa.id untuk media partner, blogger, dan kreator konten.",
  alternates: { canonical: "/press-kit" },
};

const COLORS = [
  { name: "Pastel Cream", hex: "#FCF3E4", note: "Background utama" },
  { name: "Warm Almond", hex: "#F2E5CB", note: "Surface kartu & 3D krim" },
  { name: "Matcha Cloud", hex: "#9B9D44", note: "Brand accent utama" },
  { name: "Deep Olive", hex: "#6D6F27", note: "Wordmark & tombol utama" },
  { name: "Pastel Sparkle", hex: "#E98881", note: "Aksen bintang & badge" },
  { name: "Olive Ink", hex: "#333516", note: "Teks utama & dark surface" },
];

const FONTS = [
  { family: "Playfair Display", role: "Wordmark & Display", weights: "600, 700, 800" },
  { family: "Plus Jakarta Sans", role: "Body & UI", weights: "400, 500, 600, 700, 800" },
  { family: "JetBrains Mono", role: "Numbers, code", weights: "400, 600" },
];

export default function PressKitPage() {
  return (
    <article className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <p className="text-sm font-semibold text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
        Press Kit
      </p>
      <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">
        Brand assets untuk media &amp; kreator
      </h1>
      <p className="mt-4 max-w-2xl text-[hsl(var(--muted-foreground))] leading-relaxed">
        Halo media partner, blogger, dan creator! Berikut papan identitas merek
        pastel resmi Bawabawa.id (<em>Your Jastip Bestie</em>) yang bisa kamu
        pakai untuk artikel, video, atau konten. Untuk press release atau
        wawancara, hubungi <strong>press@bawabawa.id</strong>.
      </p>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">Papan Identitas Merek</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[#FCF3E4] p-3 sm:p-5">
          <Image
            src="/brand/brand-board.png"
            alt="Papan Identitas Merek Bawabawa.id Pastel — Main Logo, Sub Logo, Simplified Logo, dan Sub Mark"
            width={1024}
            height={682}
            className="w-full h-auto rounded-xl"
            priority
          />
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[#FCF3E4] p-8 flex flex-col items-center justify-center gap-3">
            <Image
              src="/brand/sub-mark.png"
              alt="Bawabawa.id Sub Mark"
              width={96}
              height={96}
              className="h-20 w-20 rounded-2xl shadow-md"
            />
            <span className="font-display text-3xl font-bold text-[#6D6F27]">
              Bawabawa.id
            </span>
            <span className="text-xs tracking-[0.14em] uppercase text-[#797B2F]">
              — Your Jastip Bestie —
            </span>
          </div>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[#18190E] p-8 flex flex-col items-center justify-center gap-3">
            <Image
              src="/brand/sub-mark.png"
              alt="Bawabawa.id Sub Mark"
              width={96}
              height={96}
              className="h-20 w-20 rounded-2xl shadow-md"
            />
            <span className="font-display text-3xl font-bold text-[#FCF3E4]">
              Bawabawa.id
            </span>
            <span className="text-xs tracking-[0.14em] uppercase text-[#C4C676]">
              — Your Jastip Bestie —
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="/brand/brand-board.png"
            download
            className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3.5 py-1.5 text-xs font-medium hover:bg-[hsl(var(--surface-2))] transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Brand Board PNG
          </a>
          <a
            href="/brand/logo-main.png"
            download
            className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3.5 py-1.5 text-xs font-medium hover:bg-[hsl(var(--surface-2))] transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Main Logo PNG
          </a>
          <a
            href="/brand/logo-sub.png"
            download
            className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3.5 py-1.5 text-xs font-medium hover:bg-[hsl(var(--surface-2))] transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Sub Logo PNG
          </a>
          <a
            href="/brand/logo-simplified.png"
            download
            className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3.5 py-1.5 text-xs font-medium hover:bg-[hsl(var(--surface-2))] transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Simplified Logo PNG
          </a>
          <a
            href="/brand/sub-mark.png"
            download
            className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3.5 py-1.5 text-xs font-medium hover:bg-[hsl(var(--surface-2))] transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Sub Mark Icon PNG
          </a>
          <a
            href="/brand/logo-light.svg"
            download
            className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3.5 py-1.5 text-xs font-medium hover:bg-[hsl(var(--surface-2))] transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Logo Light SVG
          </a>
          <a
            href="/brand/logo-dark.svg"
            download
            className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3.5 py-1.5 text-xs font-medium hover:bg-[hsl(var(--surface-2))] transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Logo Dark SVG
          </a>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">Palet warna</h2>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {COLORS.map((c) => (
            <div
              key={c.name}
              className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] overflow-hidden"
            >
              <div className="h-16 border-b border-[hsl(var(--border))]" style={{ background: c.hex }} />
              <div className="p-3">
                <p className="font-semibold text-sm">{c.name}</p>
                <p className="text-[11px] font-mono text-[hsl(var(--muted-foreground))]">
                  {c.hex}
                </p>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">
                  {c.note}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">Tipografi</h2>
        <div className="mt-4 space-y-3">
          {FONTS.map((f) => (
            <div
              key={f.family}
              className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5"
            >
              <p
                className="text-2xl"
                style={{ fontFamily: `var(--font-${f.family === "Plus Jakarta Sans" ? "sans" : f.family === "Playfair Display" ? "display" : "mono"})` }}
              >
                {f.family}
              </p>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                {f.role} · Bobot {f.weights} · Google Fonts (gratis)
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight">Tentang Bawabawa.id</h2>
        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-[hsl(var(--muted-foreground))]">Berdiri</dt>
            <dd className="font-semibold">2024</dd>
          </div>
          <div>
            <dt className="text-[hsl(var(--muted-foreground))]">Markas</dt>
            <dd className="font-semibold">Bandung, Jawa Barat</dd>
          </div>
          <div>
            <dt className="text-[hsl(var(--muted-foreground))]">Layanan utama</dt>
            <dd className="font-semibold">Jasa titip Bandung → Samarinda</dd>
          </div>
          <div>
            <dt className="text-[hsl(var(--muted-foreground))]">Customer aktif</dt>
            <dd className="font-semibold">12.000+</dd>
          </div>
          <div>
            <dt className="text-[hsl(var(--muted-foreground))]">Order berhasil</dt>
            <dd className="font-semibold">27.000+</dd>
          </div>
          <div>
            <dt className="text-[hsl(var(--muted-foreground))]">Rating</dt>
            <dd className="font-semibold">4,96 / 5 (1.200+ ulasan)</dd>
          </div>
        </dl>
        <p className="mt-5 text-sm leading-relaxed">
          Kontak press / kerjasama: <strong>press@bawabawa.id</strong> · Investor relations: <strong>ir@bawabawa.id</strong>
        </p>
      </section>
    </article>
  );
}
