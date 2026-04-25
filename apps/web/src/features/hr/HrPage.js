import { jsx as _jsx } from "react/jsx-runtime";
import { EnterpriseModulePage } from "../../shared/ui/EnterpriseModulePage";
export function HrPage() {
    return (_jsx(EnterpriseModulePage, { title: "HR & Payroll", subtitle: "Employee lifecycle, attendance logging, dan payroll run.", points: [
            "Employee master dan status aktif",
            "Attendance log harian",
            "Payroll run bulanan",
            "Integrasi approval untuk perubahan sensitif"
        ] }));
}
