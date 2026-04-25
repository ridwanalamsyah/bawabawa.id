import { EnterpriseModulePage } from "../../shared/ui/EnterpriseModulePage";
import { useEffect, useState } from "react";
import { api } from "../../shared/api/client";

export function AdminPage() {
  const [waTemplatesHint, setWaTemplatesHint] = useState("Template WhatsApp siap dirapikan");
  useEffect(() => {
    api
      .get("/whatsapp/messages/logs")
      .then((response) =>
        setWaTemplatesHint(
          `Log WhatsApp cloud aktif (${Array.isArray(response.data?.data) ? response.data.data.length : 0} pesan)`
        )
      )
      .catch(() => setWaTemplatesHint("Log WhatsApp belum tersedia"));
  }, []);

  return (
    <EnterpriseModulePage
      title="Platform Governance"
      subtitle="Kontrol RBAC, audit trail, approval policy, dan keamanan platform."
      points={[
        "Custom role management",
        "Permission guard lintas modul",
        "Audit log transaksi kritikal",
        "Approval multi-level governance",
        waTemplatesHint,
        "Mode data utama cloud sync, local hanya fallback cache"
      ]}
    />
  );
}
