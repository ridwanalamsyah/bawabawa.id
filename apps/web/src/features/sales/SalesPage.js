import { jsx as _jsx } from "react/jsx-runtime";
import { EnterpriseModulePage } from "../../shared/ui/EnterpriseModulePage";
export function SalesPage() {
    return (_jsx(EnterpriseModulePage, { title: "Sales & Order Management", subtitle: "Pipeline order end-to-end dari pembuatan sampai finance posting.", points: [
            "Order create dengan idempotency key wajib",
            "Pembayaran DP/full payment",
            "Stock reserve, packing, shipping",
            "Invoice issue dan posting ke finance"
        ] }));
}
