const STEPS = [
  {
    title: "Kirim barangnya",
    desc: "Tempel link toko online, tulis nama barang, atau pilih dari katalog. Isi batas harga yang kamu mau.",
  },
  {
    title: "Terima penawaran",
    desc: "Kami cek stok dan harga asli di Bandung, lalu kirim total final ke WhatsApp-mu.",
  },
  {
    title: "Setujui dan bayar",
    desc: "Belum ada uang keluar sampai kamu setuju. Setelah bayar, barang langsung dibelikan.",
  },
  {
    title: "Barang dikirim",
    desc: "Ditimbang, dikemas, dan dikirim. Nomor resi masuk ke WhatsApp dan halaman tracking.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 sm:py-20" aria-labelledby="how-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 id="how-title" className="text-2xl sm:text-3xl">
          Cara kerjanya
        </h2>
        <ol className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-t-2 border-[hsl(var(--foreground))] pt-4">
              <span className="text-sm font-semibold tabular-nums text-[hsl(var(--muted-foreground))]">
                {i + 1}
              </span>
              <h3 className="mt-1 text-lg">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[hsl(var(--muted-foreground))]">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
