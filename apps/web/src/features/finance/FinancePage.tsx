import { EnterpriseModulePage } from "../../shared/ui/EnterpriseModulePage";
import { useEffect, useState } from "react";
import { api } from "../../shared/api/client";
import type { ProfitShareRule } from "@erp/shared";

export function FinancePage() {
  const [rules, setRules] = useState<ProfitShareRule[]>([]);

  useEffect(() => {
    api
      .get("/finance/profit-share")
      .then((response) => {
        const next = response.data?.data?.rules;
        setRules(Array.isArray(next) ? next : []);
      })
      .catch(() => setRules([]));
  }, []);

  return (
    <EnterpriseModulePage
      title="Finance & Accounting"
      subtitle="Transaksi keuangan dan posting invoice dengan approval-aware flow."
      points={[
        "Invoice posting menghasilkan financial transaction",
        "Daftar transaksi real-time dari DB",
        "Approval request/approve/reject",
        "Dasar rekonsiliasi dan period close",
        `Bagi hasil aktif: ${rules.map((item) => `${item.owner} ${item.percentage}%`).join(", ") || "belum diatur"}`
      ]}
    />
  );
}
