# ADR-000: Discovery Baseline ERP Migration

## Context
- Sistem awal adalah prototype frontend tanpa pemisahan layer backend dan data.
- Belum ada kontrol akses granular, audit trail, workflow approval, atau ACID transaction.
- Integrasi bisnis kritikal (WhatsApp, import/export Excel, laporan finance) belum terdokumentasi sebagai domain modular.

## Risks Identified
- Risiko mismatch data antar modul sales, inventory, dan finance.
- Risiko race condition pada transaksi paralel yang memengaruhi stok.
- Risiko duplikasi order/payments karena retry tanpa idempotency.
- Risiko keamanan (XSS, SQL injection, JWT misuse) karena belum ada baseline security stack.

## Migration Decisions
- Stack: Express + React + PostgreSQL (semua open-source).
- Strategi: phased migration untuk menghindari gangguan operasional.
- Arsitektur: modular monorepo dengan domain boundaries.
- Governance: RBAC granular + multi-level approval + immutable audit log.

## Phase Zero Deliverables
- Blueprint arsitektur dan state machine workflow ERP.
- Daftar domain prioritas: auth/rbac, orders, inventory, finance.
- Definisi response API, error policy, observability, dan quality gate.
