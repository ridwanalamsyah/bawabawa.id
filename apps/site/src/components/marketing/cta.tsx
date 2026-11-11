import Link from "next/link";

export async function FinalCTA() {
  return (
    <section className="py-12 sm:py-16 bg-[#FAF6EE]">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-[#C9BFA9] bg-[#F2ECDF] px-6 py-10 sm:px-10 sm:py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4A5828]">
              ORDER HARI INI · BELANJA LANGSUNG DI TOKO BANDUNG
            </p>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-[#1C2016]">
              Siap titip kuliner atau barang Bandung hari ini?
            </h2>
            <p className="mt-2 text-sm text-[#4E5346]">
              Pilih dari katalog atau tulis pesananmu sendiri. Pembayaran mudah via Transfer Bank (BCA, Mandiri, SeaBank) &amp; QRIS.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/request"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#4A5828] px-5 text-sm font-semibold text-[#FAF6EE] hover:bg-[#3A461E] transition-colors"
            >
              Titip Sekarang
            </Link>
            <Link
              href="/katalog"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#C9BFA9] bg-[#FFFDF9] px-5 text-sm font-semibold text-[#1C2016] hover:border-[#4A5828] hover:bg-[#FAF6EE] transition-colors"
            >
              Buka Katalog
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
