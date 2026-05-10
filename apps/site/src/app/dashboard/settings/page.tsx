import { PageHeader } from "@/components/dashboard/page-header";
import { GlassCard } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pengaturan"
        title="Pengaturan akun"
        description="Atur profil, preferensi notifikasi, dan keamanan akunmu."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2 p-6">
          <h3 className="font-semibold">Profil</h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama lengkap" defaultValue="Aulia Putri" />
            <Field label="Username" defaultValue="auliaputri" />
            <Field label="Email" defaultValue="aulia.putri@example.com" type="email" />
            <Field label="No. WhatsApp" defaultValue="+62 812-3456-7890" />
            <div className="grid gap-1.5 sm:col-span-2">
              <Label>Bio singkat</Label>
              <Textarea defaultValue="Suka belanja skincare & snack Bandung. Loyal customer Bawabawa sejak 2024." />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost">Batal</Button>
            <Button variant="primary">Simpan perubahan</Button>
          </div>
        </GlassCard>
        <div className="space-y-4">
          <GlassCard className="p-5">
            <h3 className="font-semibold">Notifikasi</h3>
            <ToggleRow label="Push notification" defaultOn />
            <ToggleRow label="Email update mingguan" />
            <ToggleRow label="WhatsApp tracking realtime" defaultOn />
            <ToggleRow label="Newsletter promo" defaultOn />
          </GlassCard>
          <GlassCard className="p-5">
            <h3 className="font-semibold">Status akun</h3>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Badge variant="success">VIP customer</Badge>
              <span className="text-[hsl(var(--muted-foreground))]">19 pesanan · 4.2 jt bulan ini</span>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-3">
              Terhubung ke ERP Bawabawa · ID #c-1
            </p>
          </GlassCard>
        </div>
      </div>
    </>
  );
}

function Field({ label, defaultValue, type = "text" }: { label: string; defaultValue: string; type?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input defaultValue={defaultValue} type={type} />
    </div>
  );
}

function ToggleRow({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  return (
    <label className="flex items-center justify-between text-sm py-2">
      <span>{label}</span>
      <span className={"relative inline-flex h-6 w-11 items-center rounded-full transition-colors " + (defaultOn ? "bg-[hsl(var(--sage-700))]" : "bg-[hsl(var(--surface-2))]")}>
        <span className={"inline-block h-5 w-5 rounded-full bg-white transition-transform " + (defaultOn ? "translate-x-5" : "translate-x-1")} />
      </span>
    </label>
  );
}
