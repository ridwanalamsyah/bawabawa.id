const STEPS = [
  {
    step: "01",
    title: "Pilih Barang & Jalur",
    desc: "Pilih dari katalog Bandung atau tulis pesanan spesifikmu di form titipan.",
  },
  {
    step: "02",
    title: "Cek Nota & Bayar",
    desc: "Terima rincian harga toko transparan, lalu bayar via Transfer Bank atau QRIS.",
  },
  {
    step: "03",
    title: "Tim Belanja di Toko",
    desc: "Tim Bandung antre langsung pagi hari sesuai jadwal batch oven toko.",
  },
  {
    step: "04",
    title: "Kirim Sesuai Zona",
    desc: "Diantar Instant Bandung, Shuttle Travel Jabar & JKT, atau Kloter Samarinda.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="cara-kerja"
      className="py-14 sm:py-16 border-t border-[#DDD5C4] bg-[#FAF6EE]"
      aria-labelledby="how-title"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-6">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4E5346]">
              PROSES TITIP TANPA AKUN
            </p>
            <h2
              id="how-title"
              className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-[#1C2016]"
            >
              Alur Pemesanan
            </h2>
          </div>
          <p className="font-mono text-xs text-[#4E5346]">
            Garansi refund 100% jika kuota toko di Bandung habis.
          </p>
        </div>

        {/* Hairline Horizontal Process Ledger (No boxed cards per R-05 & R-14) */}
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#DDD5C4] border-y border-[#C9BFA9]">
          {STEPS.map((s) => (
            <li
              key={s.step}
              className="py-5 sm:px-5 first:sm:pl-0 last:sm:pr-0 flex flex-col justify-between gap-3"
            >
              <span className="font-mono text-xs font-bold text-[#4A5828] tabular-nums">
                TAHAP {s.step}
              </span>
              <div>
                <h3 className="text-base font-bold text-[#1C2016]">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#4E5346]">
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
