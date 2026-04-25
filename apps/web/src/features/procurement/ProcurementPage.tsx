import { EnterpriseModulePage } from "../../shared/ui/EnterpriseModulePage";
import { useEffect, useState } from "react";
import { api } from "../../shared/api/client";

export function ProcurementPage() {
  const [poCount, setPoCount] = useState(0);
  useEffect(() => {
    api
      .get("/procurement/purchase-orders")
      .then((response) => setPoCount(Array.isArray(response.data?.data) ? response.data.data.length : 0))
      .catch(() => setPoCount(0));
  }, []);

  return (
    <EnterpriseModulePage
      title="Procurement"
      subtitle={`Purchase flow dari PO creation sampai receiving. ${poCount} PO tersedia.`}
      points={[
        "Purchase order draft ke approved",
        "Barang diterima dan update status",
        "Supplier dan branch tracking",
        "Fondasi 3-way matching PO/GRN/Invoice"
      ]}
    />
  );
}
