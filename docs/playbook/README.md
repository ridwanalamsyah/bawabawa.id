# Playbook bisnis Bawabawa.id

Hal-hal yang tidak bisa diselesaikan lewat kode, tapi menentukan apakah
website ini menghasilkan order. Urutan prioritas untuk 90 hari pertama:

| # | Dokumen | Kapan |
|---|---------|-------|
| 1 | [Legal & keuangan](legal.md) | Minggu 1, sebelum promosi berbayar |
| 2 | [SOP operasional](sop-operasional.md) | Minggu 1, sebelum order pertama |
| 3 | [PO batch / Open Trip](po-batch.md) | Setiap jadwal trip |
| 4 | [Media sosial](media-sosial.md) | Mulai minggu 2, rutin |
| 5 | [KPI mingguan](kpi.md) | Setiap Senin |
| 6 | [Program reseller & B2B](reseller.md) | Bulan 2, setelah 20+ order lancar |
| 7 | [Setup Kilat (udara via Balikpapan)](kilat-setup.md) | Setelah tarif kargo udara didapat |

Fitur di website yang terkait:

- `/request`, `/katalog` → order masuk ke **Admin → Pesanan masuk**.
- `/reseller` → **Admin → Reseller & B2B**.
- Ulasan dari halaman lacak → **Admin → Ulasan** (tayang di beranda setelah disetujui).
- Open Trip + tanggal tutup PO → **Admin → Open Trip**.
- Cron harian (`/api/v1/cron/run`) mengingatkan customer yang belum menyetujui penawaran > 24 jam dan mengirim ulang antrean WA/email.
