# Setup layanan Kilat (udara via Balikpapan)

Kilat = kargo udara Bandung (Husein Sastranegara) → Balikpapan (BPN),
lanjut darat ke Samarinda. Sampai saat riset (Okt 2026) belum ditemukan
penerbangan langsung Bandung–Samarinda, jadi rute lewat BPN adalah opsi
realistis. Jadwal penerbangan berubah — cek ulang sebelum mulai.

Di kode, Kilat sudah ada tapi **tersembunyi** sampai tarifnya diisi.

## Checklist sebelum aktif

- [ ] Datangi/kontak **terminal kargo Husein** atau agen kargo udara
      (maskapai yang terbang BDO–BPN). Tanyakan:
  - tarif per kg BDO → BPN, minimum berat (sering 5–10 kg per SMU),
    biaya SMU/admin, surcharge;
  - jam *cut-off* penyerahan barang dan hari terbang;
  - barang terlarang / *dangerous goods*.
- [ ] Cari **mitra Balikpapan → Samarinda** (ekspedisi darat/travel paket)
      yang bisa ambil di bandara BPN dan antar ke Samarinda di hari yang
      sama atau H+1. Sepakati tarif dan siapa yang menanggung kalau rusak.
- [ ] Hitung tarif jual per kg:
      `(kargo udara + SMU dibagi rata + darat BPN→SMD + kemasan) ÷ kg + margin`.
- [ ] Tentukan berat minimum tagihan (supaya kiriman kecil tetap untung).
- [ ] **Baterai lithium** (powerbank, HP, laptop, vape) umumnya ditolak di
      kargo udara biasa. Kategori `Elektronik` sudah otomatis tidak bisa
      memilih Kilat; tambahkan kategori lain di `KILAT_BLOCKED_CATEGORIES`
      (API `pricing.ts` dan situs `lib/pricing.ts`) kalau agen menolak
      barang lain (parfum/aerosol, cairan mudah terbakar).

## Mengaktifkan

Set env dengan nilai yang **sama** di kedua project Vercel lalu redeploy:

```env
# API
KILAT_PER_KG=<tarif jual per kg>
KILAT_MIN_KG=<berat minimum>
# Site
NEXT_PUBLIC_KILAT_PER_KG=<sama>
NEXT_PUBLIC_KILAT_MIN_KG=<sama>
```

Setelah itu kolom Kilat muncul di tabel tarif, kalkulator ongkir, dan
pilihan layanan di `/request`.

## Uji coba

- Kirim 2–3 paket sendiri dulu, catat waktu nyata pintu ke pintu.
- Baru setelah itu sesuaikan estimasi "1–2 hari kerja" di
  `apps/site/src/lib/pricing.ts` (`TIERS.air.eta`) kalau perlu.
