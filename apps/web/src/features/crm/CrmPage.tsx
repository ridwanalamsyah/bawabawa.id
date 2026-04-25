import { EnterpriseModulePage } from "../../shared/ui/EnterpriseModulePage";

export function CrmPage() {
  return (
    <EnterpriseModulePage
      title="CRM & Customer Service"
      subtitle="Manajemen customer, lead pipeline, dan engagement history."
      points={[
        "Customer master data",
        "Lead pipeline dengan owner",
        "Expected value tracking",
        "Dasar integrasi ke sales funnel"
      ]}
    />
  );
}
