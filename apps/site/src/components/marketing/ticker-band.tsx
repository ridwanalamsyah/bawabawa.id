const LINE = ["Titip dari Bandung", "Cek harga dulu", "Bayar setelah setuju", "Sampai Samarinda", "Update lewat WhatsApp"];

/**
 * Two crossed, slightly tilted bands of running text under the hero —
 * loud, radio-style energy without extra claims. Decorative only.
 */
export function TickerBand() {
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {LINE.map((t) => (
        <span key={t} className="flex items-center whitespace-nowrap px-5 text-lg sm:text-2xl font-bold uppercase tracking-tight">
          {t}
          <span className="ml-10 text-[0.8em]">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div aria-hidden className="relative h-36 sm:h-44 overflow-hidden select-none">
      {/* Two tapes crossing in an X; the dark one sits on top. */}
      <div className="absolute inset-x-[-5%] top-1/2 -translate-y-1/2 rotate-[2.5deg] bg-[hsl(var(--emerald-400))] text-[hsl(var(--sage-900))] py-2.5">
        <div className="animate-ticker-reverse flex w-max">{[row("c"), row("d")]}</div>
      </div>
      <div className="absolute inset-x-[-5%] top-1/2 -translate-y-1/2 -rotate-[2.5deg] bg-[hsl(var(--sage-800))] text-[hsl(var(--cream-100))] py-3 shadow-xl">
        <div className="animate-ticker flex w-max">{[row("a"), row("b")]}</div>
      </div>
    </div>
  );
}
