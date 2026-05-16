import { ShieldCheck, Lock } from "lucide-react";

type Badge = { label: string; sub?: string };

const PAYMENT_PARTNERS: Badge[] = [
  { label: "Midtrans", sub: "Payment Gateway" },
  { label: "QRIS", sub: "Bank Indonesia" },
  { label: "BCA", sub: "Virtual Account" },
  { label: "Mandiri", sub: "Virtual Account" },
  { label: "BNI", sub: "Virtual Account" },
  { label: "BRI", sub: "Virtual Account" },
  { label: "GoPay", sub: "e-Wallet" },
  { label: "OVO", sub: "e-Wallet" },
  { label: "ShopeePay", sub: "e-Wallet" },
  { label: "DANA", sub: "e-Wallet" },
];

const ASSURANCES: Badge[] = [
  { label: "SSL 256-bit" },
  { label: "Refund jika request batal" },
];

export function TrustBadges() {
  return (
    <section
      aria-label="Pembayaran aman & terpercaya"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12"
    >
      <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.7)] backdrop-blur-md p-6 sm:p-8">
        <div className="flex flex-col gap-1.5 mb-5">
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            Pembayaran aman
          </div>
          <p className="text-lg sm:text-xl font-semibold text-[hsl(var(--foreground))]">
            Pembayaran diproses oleh gateway resmi
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Bawabawa.id memakai Midtrans sebagai payment gateway — Midtrans terdaftar dan
            diawasi OJK & Bank Indonesia. Pembayaran customer tidak pernah masuk ke
            rekening pribadi, langsung diverifikasi dan diteruskan via Midtrans.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {PAYMENT_PARTNERS.map((p) => (
            <div
              key={p.label}
              className="group rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2.5 flex flex-col items-start gap-0.5 hover:border-[hsl(var(--sage-400))] hover:-translate-y-0.5 transition-all"
            >
              <span className="font-semibold text-sm text-[hsl(var(--foreground))]">
                {p.label}
              </span>
              {p.sub && (
                <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  {p.sub}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 pt-5 border-t border-[hsl(var(--border))] flex flex-wrap items-center gap-x-5 gap-y-2">
          {ASSURANCES.map((a) => (
            <div
              key={a.label}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))]"
            >
              {a.label.startsWith("SSL") && <Lock className="h-3.5 w-3.5 text-[hsl(var(--sage-600))]" />}
              {a.label.startsWith("Refund") && <ShieldCheck className="h-3.5 w-3.5 text-[hsl(var(--sage-600))]" />}
              {a.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
