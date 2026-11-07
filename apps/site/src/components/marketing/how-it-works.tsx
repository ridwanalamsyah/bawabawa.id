const STEPS = [
  {
    step: "01",
    title: "Pilih Barang & Jalur",
    desc: "Pilih dari katalog Bandung atau ketik pesananmu di form.",
  },
  {
    step: "02",
    title: "Cek Nota & Bayar",
    desc: "Terima rincian harga transparan, bayar via Transfer Bank atau QRIS.",
  },
  {
    step: "03",
    title: "Tim Belanja di Toko",
    desc: "Tim Bandung antre langsung pagi hari agar produk tiba fresh.",
  },
  {
    step: "04",
    title: "Kirim Sesuai Zona",
    desc: "Instant Bandung, Shuttle Travel Jabar & JKT, atau Kloter Samarinda.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="cara-kerja"
      className="py-12 sm:py-16 border-t border-[hsl(var(--border))]"
      aria-labelledby="how-title"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <h2
            id="how-title"
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]"
          >
            Cara Kerja
          </h2>
          <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
            Garansi refund 100% jika kuota toko di Bandung habis.
          </p>
        </div>

        <ol className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s) => (
            <li
              key={s.step}
              className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 flex flex-col justify-between gap-3"
            >
              <span className="text-xs font-bold text-[hsl(var(--sage-700))]">
                {s.step}
              </span>
              <div>
                <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">
                  {s.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {s.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
