import { useEffect, useState } from "react";
import { ModuleShell, type ModuleKpi } from "../../shared/ui/ModuleShell";
import { api } from "../../shared/api/client";
import { formatIdr, formatNumber } from "../../shared/lib/format";
import type { ProfitShareRule } from "@erp/shared";

interface FinanceTransaction {
  id: string;
  type?: string;
  amount?: number;
}

export function FinancePage() {
  const [rules, setRules] = useState<ProfitShareRule[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.get<{ data?: { rules?: ProfitShareRule[] } }>("/finance/profit-share"),
      api.get<{ data?: FinanceTransaction[] }>("/finance/transactions")
    ])
      .then(([rulesRes, txRes]) => {
        if (!active) return;
        if (rulesRes.status === "fulfilled") {
          const next = rulesRes.value.data?.data?.rules;
          setRules(Array.isArray(next) ? next : []);
        }
        if (txRes.status === "fulfilled") {
          const next = txRes.value.data?.data;
          setTransactions(Array.isArray(next) ? next : []);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const inflow = transactions
    .filter((t) => (t.amount ?? 0) > 0)
    .reduce((sum, t) => sum + (t.amount ?? 0), 0);
  const outflow = transactions
    .filter((t) => (t.amount ?? 0) < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount ?? 0), 0);
  const net = inflow - outflow;
  const partners = rules.length;

  const kpis: ModuleKpi[] = [
    { label: "Pemasukan", value: formatIdr(inflow), tone: "positive" },
    { label: "Pengeluaran", value: formatIdr(outflow), tone: "warn" },
    { label: "Saldo Bersih", value: formatIdr(net) },
    {
      label: "Bagi Hasil",
      value: partners > 0 ? `${formatNumber(partners)} pihak` : "Belum diatur",
      tone: partners > 0 ? "default" : "muted"
    }
  ];

  return (
    <ModuleShell
      title="Keuangan"
      subtitle="Pantau arus kas, transaksi, dan bagi hasil mitra. Posting invoice dan persetujuan terintegrasi."
      kpis={kpis}
      loading={loading}
      empty={
        transactions.length === 0
          ? {
              icon: "💰",
              title: "Belum ada transaksi",
              description:
                "Transaksi keuangan akan muncul di sini setelah invoice pertama diposting atau pembayaran masuk."
            }
          : undefined
      }
    />
  );
}
