"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Printer, Save, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";
import {
  DEFAULT_PROFIT_SHARING_3P,
  type PartnerSplitRule,
} from "@/lib/viral-bandung-data";
import {
  downloadExcelCsv,
  printProfitSharingSlipPdf,
} from "@/lib/admin-exports";
import type { AdminOrder } from "../orders/orders-client";

export function BagiHasilClient() {
  const [rules, setRules] = useState<PartnerSplitRule[]>(DEFAULT_PROFIT_SHARING_3P.rules);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Simulasi Manual Cepat bila belum banyak order
  const [simModalRp, setSimModalRp] = useState(4500000);
  const [simProfitBandungJabarRp, setSimProfitBandungJabarRp] = useState(1200000);
  const [simProfitSamarindaRegRp, setSimProfitSamarindaRegRp] = useState(900000);
  const [simProfitSamarindaRefRp, setSimProfitSamarindaRefRp] = useState(750000);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [ordersRes, settingsRes] = await Promise.all([
          fetch("/api/admin/order-requests", { cache: "no-store" }),
          fetch("/api/admin/settings", { cache: "no-store" }),
        ]);

        if (!cancelled && ordersRes.ok) {
          const oj = (await ordersRes.json().catch(() => null)) as { items?: AdminOrder[] } | null;
          if (Array.isArray(oj?.items)) {
            setOrders(oj.items);
          }
        }

        if (!cancelled && settingsRes.ok) {
          const sj = (await settingsRes.json().catch(() => null)) as Array<{ key: string; value: unknown }> | null;
          const row = Array.isArray(sj) ? sj.find((r) => r.key === "profit_sharing") : undefined;
          const val = row?.value as { rules?: PartnerSplitRule[] } | undefined;
          if (Array.isArray(val?.rules) && val.rules.length === 3) {
            setRules(val.rules);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateRule = (idx: number, patch: Partial<PartnerSplitRule>) => {
    setRules((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await fetch("/api/admin/settings/profit_sharing", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          value: {
            partnerNames: DEFAULT_PROFIT_SHARING_3P.partnerNames,
            rules,
          },
        }),
      });
      setMessage("Skema Bagi Hasil 3 Partner berhasil disimpan!");
    } finally {
      setSaving(false);
    }
  };

  // Hitung dari order nyata jika ada, atau gunakan angka simulasi
  const computed = useMemo(() => {
    const activeOrders = orders.filter((o) => o.status !== "cancelled");
    const rBandung = rules[0] ?? DEFAULT_PROFIT_SHARING_3P.rules[0];
    const rSmdReg = rules[1] ?? DEFAULT_PROFIT_SHARING_3P.rules[1];
    const rSmdRef = rules[2] ?? DEFAULT_PROFIT_SHARING_3P.rules[2];

    let modalRp = 0;
    let profitBandungJabar = 0;
    let profitSmdReg = 0;
    let profitSmdRef = 0;

    if (activeOrders.length > 0) {
      for (const o of activeOrders) {
        const p = o.quote ?? o.estimate;
        if (!p) continue;
        modalRp += (p.itemsTotal || 0) + (p.shippingFee || 0);
        const netFee = Math.max(0, (p.jastipFee || 0) - (p.discount || 0));
        const city = (o.address?.city ?? "").toLowerCase();
        const isSmd =
          o.tier === "batch" ||
          city.includes("samarinda") ||
          city.includes("balikpapan") ||
          city.includes("tenggarong");
        const isRef =
          (o.voucherCode ?? "").toUpperCase() === "BAWASMD" ||
          (o.customerNotes ?? "").includes("BAWASMD");

        if (!isSmd) {
          profitBandungJabar += netFee;
        } else if (isRef) {
          profitSmdRef += netFee;
        } else {
          profitSmdReg += netFee;
        }
      }
    } else {
      modalRp = simModalRp;
      profitBandungJabar = simProfitBandungJabarRp;
      profitSmdReg = simProfitSamarindaRegRp;
      profitSmdRef = simProfitSamarindaRefRp;
    }

    const totalNetProfit = profitBandungJabar + profitSmdReg + profitSmdRef;

    const kasBisnisRp = Math.round(
      (profitBandungJabar * rBandung.kasBisnisPct +
        profitSmdReg * rSmdReg.kasBisnisPct +
        profitSmdRef * rSmdRef.kasBisnisPct) /
        100
    );
    const ownerBandungRp = Math.round(
      (profitBandungJabar * rBandung.ownerBandungPct +
        profitSmdReg * rSmdReg.ownerBandungPct +
        profitSmdRef * rSmdRef.ownerBandungPct) /
        100
    );
    const coOwnerBandungRp = Math.round(
      (profitBandungJabar * rBandung.coOwnerBandungPct +
        profitSmdReg * rSmdReg.coOwnerBandungPct +
        profitSmdRef * rSmdRef.coOwnerBandungPct) /
        100
    );
    const hubSamarindaRp = Math.round(
      (profitBandungJabar * rBandung.hubSamarindaPct +
        profitSmdReg * rSmdReg.hubSamarindaPct +
        profitSmdRef * rSmdRef.hubSamarindaPct) /
        100
    );

    return {
      usingRealOrders: activeOrders.length > 0,
      orderCount: activeOrders.length || 24,
      modalRp,
      profitBandungJabar,
      profitSmdReg,
      profitSmdRef,
      totalNetProfit,
      kasBisnisRp,
      ownerBandungRp,
      coOwnerBandungRp,
      hubSamarindaRp,
    };
  }, [
    orders,
    rules,
    simModalRp,
    simProfitBandungJabarRp,
    simProfitSamarindaRegRp,
    simProfitSamarindaRefRp,
  ]);

  const handleExportCsv = () => {
    downloadExcelCsv(
      "Rekap_Bagi_Hasil_3_Partner_Bawabawa.csv",
      [
        "Pos Keuangan / Partner",
        "Peran & Keterangan",
        "Nominal (Rp)",
      ],
      [
        [
          "1. PENGEMBALIAN MODAL BELANJA TOKO & ONGKIR",
          "Wajib dikembalikan utuh 100% ke rekening penombok sebelum bagi hasil",
          computed.modalRp,
        ],
        [
          "2. TOTAL LABA BERSIH JASTIP FEE",
          "Akumulasi Jastip Fee dari 3 Jalur Pengiriman",
          computed.totalNetProfit,
        ],
        [
          "Kas Operasional & Packing Bawabawa",
          "10% untuk lakban, kardus, ice gel & cadangan risiko",
          computed.kasBisnisRp,
        ],
        [
          "Partner 1 — Owner Bandung (Anda)",
          "45% Jalur Bandung/Jabar | 35% SMD Umum | 30% SMD Referral",
          computed.ownerBandungRp,
        ],
        [
          "Partner 2 — Co-Owner & Belanja Bandung (Pacar)",
          "45% Jalur Bandung/Jabar | 35% SMD Umum | 30% SMD Referral",
          computed.coOwnerBandungRp,
        ],
        [
          "Partner 3 — Hub & Promosi Samarinda (Teman)",
          "0% Jalur Bandung/Jabar | 20% SMD Umum | 30% SMD Referral (BAWASMD)",
          computed.hubSamarindaRp,
        ],
      ]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Tombol Export PDF / Excel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5DFAD] px-3 py-1 text-xs font-bold text-[#24201A]">
            <Wallet className="h-3.5 w-3.5 text-[#C8524B]" /> Sistem Bagi Hasil Adil 3 Partner (Bandung &amp; Hub Samarinda)
          </span>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#24201A]">
            Rekap Bagi Hasil &amp; Pemisahan Modal Belanja
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[hsl(var(--muted-foreground))] max-w-2xl">
            Memisahkan <strong>Uang Modal Toko Bandung + Ongkir Asli</strong> (agar tidak pernah terpakai) dari <strong>Laba Bersih Jastip Fee</strong> yang dibagi otomatis untuk Anda, Pacar, dan Teman Hub Samarinda sesuai kontribusi jalur.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              printProfitSharingSlipPdf({
                periodLabel: new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
                totalModalTokoDanOngkirRp: computed.modalRp,
                totalNetJastipProfitRp: computed.totalNetProfit,
                kasBisnisRp: computed.kasBisnisRp,
                ownerBandungRp: computed.ownerBandungRp,
                coOwnerBandungRp: computed.coOwnerBandungRp,
                hubSamarindaRp: computed.hubSamarindaRp,
                orderCount: computed.orderCount,
              })
            }
          >
            <Printer className="h-4 w-4" /> Cetak PDF Slip Bagi Hasil
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={handleExportCsv}>
            <Download className="h-4 w-4" /> Download Excel/CSV Bagi Hasil
          </Button>
        </div>
      </div>

      {/* Kotak Pemisahan Modal vs Laba Bersih */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <GlassCard className="p-5 md:col-span-2 bg-[#FCF3E4] border-2 border-[#24201A]">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#9E3B34] flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" /> 1. Uang Modal Toko &amp; Ongkir (Wajib Kembali Utuh)
          </span>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tabular-nums text-[#24201A]">
            {formatIDR(computed.modalRp)}
          </p>
          <p className="mt-1.5 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
            Uang ini <strong>bukan keuntungan</strong>. Wajib dikembalikan 100% terlebih dahulu ke rekening Anda/Pacar yang menomboki belanja di toko Bandung &amp; kurir/travel.
          </p>
        </GlassCard>

        <GlassCard className="p-5 md:col-span-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[hsl(var(--sage-700))] flex items-center gap-1">
            <Sparkles className="h-4 w-4" /> 2. Pembagian Laba Bersih Jastip ({formatIDR(computed.totalNetProfit)})
          </span>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-3">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] block">🏦 Kas Bisnis (10%)</span>
              <span className="mt-1 text-base font-extrabold tabular-nums text-[#24201A] block">
                {formatIDR(computed.kasBisnisRp)}
              </span>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Packing &amp; Ice Gel</span>
            </div>

            <div className="rounded-2xl border border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-50))] p-3">
              <span className="text-[11px] font-bold text-[hsl(var(--sage-800))] block">Partner 1 · Anda</span>
              <span className="mt-1 text-base font-extrabold tabular-nums text-[hsl(var(--sage-700))] block">
                {formatIDR(computed.ownerBandungRp)}
              </span>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Owner Bandung</span>
            </div>

            <div className="rounded-2xl border border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-50))] p-3">
              <span className="text-[11px] font-bold text-[hsl(var(--sage-800))] block">Partner 2 · Pacar</span>
              <span className="mt-1 text-base font-extrabold tabular-nums text-[hsl(var(--sage-700))] block">
                {formatIDR(computed.coOwnerBandungRp)}
              </span>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Co-Owner Bandung</span>
            </div>

            <div className="rounded-2xl border border-[#E98881] bg-[#FBE8E6]/50 p-3">
              <span className="text-[11px] font-bold text-[#9E3B34] block">Partner 3 · Teman SMD</span>
              <span className="mt-1 text-base font-extrabold tabular-nums text-[#9E3B34] block">
                {formatIDR(computed.hubSamarindaRp)}
              </span>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Hub Samarinda</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Kalkulator Simulasi Interaktif (Bila Ingin Simulasi Angka Bulanan) */}
      <GlassCard className="p-5 sm:p-6">
        <h2 className="text-base font-bold text-[#24201A]">
          Simulasi Laba Bersih per Jalur Pengiriman (Ubah Angka untuk Simulasi Bulanan)
        </h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <Label>Total Modal Belanja &amp; Ongkir (Rp)</Label>
            <Input
              type="number"
              value={simModalRp}
              onChange={(e) => setSimModalRp(Number(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Laba Jastip Bandung &amp; Travel Jabar</Label>
            <Input
              type="number"
              value={simProfitBandungJabarRp}
              onChange={(e) => setSimProfitBandungJabarRp(Number(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Laba Jastip Samarinda (Order Web)</Label>
            <Input
              type="number"
              value={simProfitSamarindaRegRp}
              onChange={(e) => setSimProfitSamarindaRegRp(Number(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Laba Samarinda via Teman (BAWASMD)</Label>
            <Input
              type="number"
              value={simProfitSamarindaRefRp}
              onChange={(e) => setSimProfitSamarindaRefRp(Number(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
        </div>
      </GlassCard>

      {/* Tabel Aturan Persentase 3 Skema (Bisa Diedit & Disimpan) */}
      <GlassCard className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#24201A]">
              Pengaturan Persentase Bagi Hasil 3 Partner Berdasarkan Jalur
            </h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Skema adil: Teman Samarinda mendapat <strong>0%</strong> untuk order Bandung/Jabar (karena tidak lewat Samarinda), <strong>20%</strong> untuk order Samarinda via Web, dan naik menjadi <strong>30%</strong> (setara 30:30:30) jika order dibawa/diinput oleh Teman Samarinda!
            </p>
          </div>
          <Button type="button" onClick={handleSave} disabled={saving || loading}>
            <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan Skema Bagi Hasil"}
          </Button>
        </div>

        {message && (
          <div className="rounded-xl bg-[hsl(var(--sage-100))] p-3 text-xs font-bold text-[hsl(var(--sage-800))]">
            {message}
          </div>
        )}

        <div className="space-y-4">
          {rules.map((r, idx) => {
            const sumPct =
              Number(r.kasBisnisPct) +
              Number(r.ownerBandungPct) +
              Number(r.coOwnerBandungPct) +
              Number(r.hubSamarindaPct);
            return (
              <div
                key={r.zoneId}
                className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#24201A]">{r.zoneName}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{r.description}</p>
                  </div>
                  <span className="rounded-full bg-[#F5DFAD] px-3 py-0.5 text-xs font-bold text-[#24201A]">
                    Total: {sumPct}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <Label>🏦 Kas Bisnis (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={r.kasBisnisPct}
                      onChange={(e) => updateRule(idx, { kasBisnisPct: Number(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Partner 1 · Anda (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={r.ownerBandungPct}
                      onChange={(e) => updateRule(idx, { ownerBandungPct: Number(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Partner 2 · Pacar (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={r.coOwnerBandungPct}
                      onChange={(e) => updateRule(idx, { coOwnerBandungPct: Number(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Partner 3 · Hub Samarinda (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={r.hubSamarindaPct}
                      onChange={(e) => updateRule(idx, { hubSamarindaPct: Number(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
