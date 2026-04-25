import { EnterpriseModulePage } from "../../shared/ui/EnterpriseModulePage";

export function InventoryPage() {
  return (
    <EnterpriseModulePage
      title="Inventory & Warehouse"
      subtitle="Kontrol stok, movement log, dan reservation-release workflow."
      points={[
        "Stock adjustment dengan validasi saldo",
        "Ledger inventory movement persisten",
        "Monitoring low stock dan anomali",
        "Integrasi ke order fulfillment"
      ]}
    />
  );
}
