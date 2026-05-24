import type { Metadata } from "next";
import Link from "next/link";
import { Truck, PackageCheck, Clock, Building2, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pengiriman Langsung — Bandung → Samarinda",
  description:
    "Layanan pengiriman titipan satu perusahaan / batch tertutup dari Bandung ke Samarinda. Cocok untuk pengiriman volume besar, pre-order kantor, atau kebutuhan logistik B2B.",
  alternates: { canonical: "/pengiriman-langsung" }
};

// Soft-launch state: Pengiriman Langsung adalah layanan baru.
// Halaman ini sengaja tidak menampilkan tarif final / jadwal real —
// tarif disetting case-by-case sesuai volume & barang, dan jadwal
// disesuaikan dengan customer. Customer kontak admin lewat WA dulu.

export default function PengirimanLangsungPage() {
  return (
    <>
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-10">
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
                Pengiriman Langsung
              </p>
              <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
                Kirim langsung,{" "}
                <span className="bg-linear-to-br from-[hsl(var(--sage-700))] via-[hsl(var(--olive-500))] to-[hsl(var(--emerald-600))] bg-clip-text text-transparent">
                  satu pengirim
                </span>{" "}
                tanpa tunggu trip
              </h1>
              <p className="mt-4 text-base text-[hsl(var(--muted-foreground))] max-w-xl">
                Untuk perusahaan, reseller, atau personal shopper yang butuh
                kirim volume besar dari Bandung ke Samarinda dalam waktu sendiri.
                Tidak harus nunggu jadwal Open Trip — kami atur jadwal & tarif
                khusus sesuai isi paketmu.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <a
                    href="https://wa.me/6281234567890?text=Halo+Bawabawa%2C+saya+mau+tanya+Pengiriman+Langsung"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Tanya via WhatsApp <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/open-trip">Lihat Open Trip (lebih murah)</Link>
                </Button>
              </div>
            </div>
            <div className="lg:col-span-5">
              <GlassCard className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  Perbandingan singkat
                </p>
                <div className="mt-4 space-y-3 text-sm">
                  <CompareRow
                    label="Tarif"
                    direct="Custom per pengiriman"
                    openTrip="±Rp 200rb / 50kg"
                  />
                  <CompareRow
                    label="Jadwal"
                    direct="Fleksibel, sesuai customer"
                    openTrip="Sesuai jadwal trip"
                  />
                  <CompareRow
                    label="Isi paket"
                    direct="Satu pengirim, banyak barang"
                    openTrip="Banyak pengirim, paket campur"
                  />
                  <CompareRow
                    label="Cocok untuk"
                    direct="B2B, kantor, reseller"
                    openTrip="Personal / titip 1-2 barang"
                  />
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-4">
          <Feature
            icon={<Truck className="h-5 w-5" />}
            title="Volume besar OK"
            body="Mulai dari beberapa kardus sampai full truck. Untuk pengiriman > 200kg kami siapkan armada khusus."
          />
          <Feature
            icon={<Clock className="h-5 w-5" />}
            title="Jadwal fleksibel"
            body="Tidak menunggu Open Trip berikutnya. Pickup di Bandung & delivery ke Samarinda diatur per kasus."
          />
          <Feature
            icon={<PackageCheck className="h-5 w-5" />}
            title="Tracking sampai akhir"
            body="Status pengiriman update di dashboard. POD (proof of delivery) di-share via WA atau email setelah barang diterima."
          />
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <GlassCard className="p-8 lg:p-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]" />
            <h2 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight">
              Mau pesan untuk perusahaan / reseller?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[hsl(var(--muted-foreground))]">
              Kontak tim Bawabawa lewat WhatsApp untuk dapat quote tarif &amp;
              jadwal yang sesuai. Order yang sudah disepakati tetap diberi
              invoice, link pembayaran, dan tracking yang sama seperti
              pemesanan dari web.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <a
                  href="https://wa.me/6281234567890?text=Halo+Bawabawa%2C+saya+mau+request+Pengiriman+Langsung"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Chat admin sekarang
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="mailto:hello@bawabawa.id">Email hello@bawabawa.id</a>
              </Button>
            </div>
          </GlassCard>
        </div>
      </section>
    </>
  );
}

function CompareRow({
  label,
  direct,
  openTrip
}: {
  label: string;
  direct: string;
  openTrip: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
      <span className="font-medium text-[hsl(var(--muted-foreground))]">{label}</span>
      <span>
        <span className="font-semibold text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
          Langsung:
        </span>{" "}
        {direct}
      </span>
      <span>
        <span className="font-semibold">Open Trip:</span> {openTrip}
      </span>
    </div>
  );
}

function Feature({
  icon,
  title,
  body
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--sage-700))]/10 text-[hsl(var(--sage-700))] dark:bg-[hsl(var(--sage-300))]/15 dark:text-[hsl(var(--sage-300))]">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{body}</p>
    </div>
  );
}
