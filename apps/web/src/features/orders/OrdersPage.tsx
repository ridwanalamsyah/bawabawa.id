import { EnterpriseModulePage } from "../../shared/ui/EnterpriseModulePage";
import { useEffect, useState } from "react";
import { api } from "../../shared/api/client";

export function OrdersPage() {
  const [orderCount, setOrderCount] = useState<number>(0);

  useEffect(() => {
    api
      .get("/orders")
      .then((response) => setOrderCount(Array.isArray(response.data?.data) ? response.data.data.length : 0))
      .catch(() => setOrderCount(0));
  }, []);

  return (
    <EnterpriseModulePage
      title="Orders Workflow"
      subtitle={`Alur transaksi order terkontrol dengan state machine enterprise. ${orderCount} order terdeteksi dari API.`}
      points={[
        "draft -> payment_pending -> payment_dp/payment_paid",
        "payment_paid -> stock_reserved -> packed -> shipped",
        "shipped -> invoiced -> posted_finance",
        "Semua transisi kritikal tercatat audit"
      ]}
    />
  );
}
