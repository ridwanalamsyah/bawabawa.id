import { PageHeader } from "@/components/dashboard/page-header";
import { GlassCard } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader eyebrow="Pengaturan" title="Konfigurasi platform" description="Atur fee jasa titip default, integrasi, dan branding." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-6">
          <h3 className="font-semibold">Fee jasa titip default</h3>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="Persentase fee (%)" defaultValue="8" />
            <Field label="Minimum fee (Rp)" defaultValue="20000" />
            <Field label="Base fee trip (Rp)" defaultValue="25000" />
            <Field label="Per-kg fee trip (Rp)" defaultValue="18000" />
            <Field label="Ongkir lokal Samarinda (Rp)" defaultValue="22000" />
            <Field label="Garansi maksimum (Rp)" defaultValue="5000000" />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost">Reset</Button>
            <Button variant="primary">Simpan</Button>
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="font-semibold">Integrasi & API</h3>
          <div className="mt-4 grid gap-4">
            <Field label="ERP base URL" defaultValue="https://erp.bawabawa.id/api/v3" />
            <Field label="Webhook signing secret" defaultValue="whsec_••••••••••••••••" />
            <Field label="Payment gateway" defaultValue="DOKU Checkout" />
            <Field label="Push provider" defaultValue="OneSignal" />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="primary">Update</Button>
          </div>
        </GlassCard>
      </div>
    </>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input defaultValue={defaultValue} />
    </div>
  );
}
