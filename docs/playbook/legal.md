# Legal & keuangan

Checklist minimum supaya usaha bisa menerima transfer, kerja sama dengan
toko/ekspedisi, dan tidak bermasalah saat omzet naik. Angka dan aturan pajak
berubah — konfirmasi ke KPP setempat atau konsultan pajak sebelum mengambil
keputusan.

## Wajib di awal

- [ ] **NIB lewat OSS** (oss.go.id). Pilih KBLI yang sesuai jasa titip /
      perdagangan eceran melalui internet dan jasa pengiriman. Gratis.
- [ ] **NPWP** pemilik (atau badan kalau sudah CV/PT).
- [ ] **Rekening atas nama usaha** (atau rekening khusus usaha atas nama
      pemilik). Jangan campur dengan rekening pribadi — rekap bagi hasil dan
      pajak jauh lebih mudah.
- [ ] Isi `PAYMENT_INSTRUCTIONS` di API dengan rekening tersebut.
- [ ] Halaman **Syarat & Ketentuan, Kebijakan Refund, Privasi** sudah ada di
      situs (`/terms`, `/refund`, `/privacy`) — baca ulang dan sesuaikan nama
      usaha, alamat, dan nomor kontak.

## Pajak (gambaran umum)

- UMKM orang pribadi umumnya bisa memakai PPh final 0,5% dari omzet
  (PP 55/2022), dengan bagian omzet tertentu per tahun tidak dikenai pajak.
  Cek batas waktu pemakaian tarif ini untuk jenis wajib pajakmu.
- **PKP / PPN** baru wajib kalau omzet setahun melewati Rp4,8 miliar. Sampai
  itu, biarkan `PPN_ENABLED=false` dan `NEXT_PUBLIC_PPN_ENABLED=false`.
- Catat omzet bulanan dari **Admin → Laporan** untuk pelaporan.

## Saat mulai besar

- [ ] Pertimbangkan **CV atau PT perorangan** kalau sudah ada mitra/investor
      atau kontrak B2B.
- [ ] Perjanjian tertulis sederhana dengan mitra ekspedisi (tarif, SLA,
      tanggung jawab kalau barang rusak/hilang).
- [ ] Asuransi kiriman untuk barang bernilai tinggi (tawarkan sebagai opsi
      ke customer).
- [ ] Merek: cek dan daftarkan "Bawabawa" di DJKI (pdki-indonesia.dgip.go.id)
      sebelum dipakai di kemasan dan iklan besar.

## Keamanan akun (dari audit)

- [ ] **Rotasi semua secret** yang pernah tercantum di riwayat
      `DEPLOY-VERCEL.md` (DB, JWT, webhook). Repo ini publik.
- [ ] Aktifkan 2FA di GitHub, Vercel, Neon, Google, dan rekening bank.
