import type { Metadata } from "next";
import { Download } from "lucide-react";

export const metadata: Metadata = {
  title: "Press Kit & Brand Assets",
  description:
    "Logo, palet warna, tipografi, dan foto resmi Bawabawa.id untuk media partner, blogger, dan kreator konten.",
  alternates: { canonical: "/press-kit" },
};

const COLORS = [
  { name: "Cream", hex: "#FAF7F0", note: "Background utama" },
  { name: "Sage 700", hex: "#4D6755", note: "Primary CTA, link" },
  { name: "Olive 500", hex: "#8A9D6F", note: "Accent secondary" },
  { name: "Warm Tan", hex: "#D4A373", note: "Highlight, badge" },
  { name: "Dark Olive", hex: "#2A2C28", note: "Foreground, dark bg" },
  { name: "Emerald 600", hex: "#4F7D5E", note: "Success, garansi" },
];

const FONTS = [
  { family: "Plus Jakarta Sans", role: "Body & UI", weights: "400, 500, 600, 700, 800" },
  { family: "Playfair Display", role: "Display & hero", weights: "600, 700, 800" },
  { family: "JetBrains Mono", role: "Numbers, code", weights: "400, 600" },
];

export default function PressKitPage() {
  return (
    <article className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] font-semibold">
        Press Kit
      </p>
      <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">
        Brand assets untuk media & kreator
      </h1>
      <p className="mt-4 max-w-2xl text-[hsl(var(--muted-foreground))] leading-relaxed">
        Halo media partner, blogger, dan creator! Berikut aset resmi Bawabawa.id
        yang bisa kamu pakai untuk artikel, video, atau konten. Untuk press
        release atau wawancara, hubungi <strong>press@bawabawa.id</strong>.
      </p>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">Logo</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-8 flex items-center justify-center">
            <span className="text-3xl font-display font-bold bg-linear-to-br from-[hsl(var(--sage-700))] to-[hsl(var(--emerald-600))] bg-clip-text text-transparent">
              Bawabawa.id
            </span>
          </div>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[#2A2C28] p-8 flex items-center justify-center">
            <span className="text-3xl font-display font-bold bg-linear-to-br from-[hsl(var(--sage-300))] to-[hsl(var(--emerald-400))] bg-clip-text text-transparent">
              Bawabawa.id
            </span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="/brand/logo-light.svg"
            download
            className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-1.5 text-xs font-medium hover:bg-[hsl(var(--surface-2))] transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Logo light SVG
          </a>
          <a
            href="/brand/logo-dark.svg"
            download
            className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-1.5 text-xs font-medium hover:bg-[hsl(var(--surface-2))] transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Logo dark SVG
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
              <div className="h-16" style={{ background: c.hex }} />
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

      <section className="mt-12 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.7)] backdrop-blur p-6 sm:p-8">
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
