# PO batch / Open Trip

Kargo bersama (flat Rp200.000 s.d. 50 kg) hanya untung kalau slot terisi.
Jalankan dengan jadwal tetap supaya customer terbiasa.

## Ritme yang disarankan

- **Dua trip per bulan**, misalnya berangkat tanggal 5 dan 20.
- **PO dibuka 10 hari** sebelum berangkat, **ditutup 3 hari** sebelum
  berangkat (isi `PO ditutup` di **Admin → Open Trip**). Setelah lewat, situs
  otomatis menampilkan "PO tutup" dan API menolak pesanan Kargo ke trip itu.
- 3 hari antara tutup PO dan berangkat dipakai untuk belanja, timbang, kemas.

## Pengumuman

| Kapan | Isi |
|-------|-----|
| H-10 | "PO dibuka" + tanggal tutup + link `/open-trip` |
| H-6 | Sisa kapasitas (kg) dari admin + kategori populer |
| H-4 | "Besok PO tutup" |
| H-0 | Foto paket berangkat |
| Tiba | Foto paket sampai + pengingat trip berikutnya |

Kanal: Status WA, WA Channel, story IG/TikTok.

## Aturan

- Trip yang belum terisi 60% di H-5 → tawarkan ke pemesan Reguler yang
  cocok (lebih murah buat mereka, slot terisi buat kita).
- Jangan menambah pesanan setelah PO tutup kecuali kapasitas dan waktu
  belanja benar-benar cukup — ubah tanggal tutup di admin kalau memang
  diperpanjang, supaya situs dan WA konsisten.
