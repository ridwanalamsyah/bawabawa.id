# Go Live Checklist

- Semua test pipeline hijau (unit, integration, e2e smoke).
- Tidak ada critical/high vulnerability yang terbuka.
- Migrasi DB telah diuji rollback.
- RBAC, approval chain, audit trail tervalidasi pada UAT.
- Monitoring dashboard dan alert aktif.
- Readiness endpoint (`/health/ready`) dan metrics endpoint (`/metrics`) berjalan normal.
- Rollback deployment plan siap dijalankan.
