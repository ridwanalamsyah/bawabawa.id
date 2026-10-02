# SOP operasional

Tujuannya: setiap pesanan punya bukti di tiap langkah, jadi komplain bisa
dijawab dengan foto, bukan ingatan. Status di admin mengikuti alur ini.

## 1. Request masuk (`submitted`)

- Target respon: **< 2 jam** di jam kerja. Notifikasi masuk ke
  `OPS_WHATSAPP_NUMBER`.
- Cek link/foto barang, ketersediaan, varian. Kalau ragu, chat customer
  sebelum memberi harga.

## 2. Penawaran (`quoted`)

- Isi harga barang aktual, ongkir sesuai layanan, jasa (otomatis 8%,
  minimum Rp20.000).
- Tulis catatan singkat: toko, perkiraan berat, kapan dibelikan.
- Customer menyetujui dari halaman lacak. Cron otomatis mengingatkan sekali
  setelah 24 jam; setelah 48 jam tanpa respon, follow-up manual sekali lalu
  batalkan.

## 3. Pembayaran (`approved` → `paid`)

- Cocokkan mutasi rekening dengan kode pesanan (BWB-…). Minta customer
  menulis kode pesanan di berita transfer.
- Tandai **paid** hanya setelah dana benar-benar masuk.

## 4. Belanja (`purchasing`)

- **Foto nota** dan **foto barang di toko** (label harga terlihat). Unggah ke
  catatan pesanan atau kirim ke customer.
- Barang habis → ikuti preferensi customer (tanya / ganti varian / batal &
  refund). Refund selisih maksimal 1×24 jam.

## 5. Timbang & kemas (`packed`)

- Timbang setelah dikemas, **foto timbangan** dengan barang di atasnya.
- Kemasan: bubble wrap untuk barang pecah/elektronik, plastik untuk tekstil,
  kardus double wall untuk kargo. Label: kode pesanan + nama + no. WA.
- Kalau berat aktual beda > 0,5 kg dari penawaran, kabari customer sebelum
  kirim (tagih/refund selisih ongkir).

## 6. Kirim (`shipped`)

- Isi nomor resi di admin → customer otomatis mendapat notifikasi.
- Kargo Open Trip: satu foto semua paket sebelum diserahkan ke ekspedisi.

## 7. Diterima (`delivered`)

- Tandai setelah ada konfirmasi kurir atau customer.
- Ambil sendiri: minta customer tunjukkan halaman lacak / kode pesanan.
- Customer bisa memberi ulasan dari halaman lacak → setujui di
  **Admin → Ulasan** (tayangkan yang jujur, termasuk yang 3–4 bintang).

## Komplain

1. Minta foto/video unboxing.
2. Bandingkan dengan foto langkah 4–5.
3. Kerusakan di perjalanan → klaim ke ekspedisi; kesalahan kita → refund
   atau kirim ulang, tanpa debat.
