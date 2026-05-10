import { Plus, MapPin, Star } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ADDRS = [
  {
    label: "Rumah",
    name: "Aulia Putri",
    phone: "+62 812-3456-7890",
    address: "Jl. Bukit Pinang Blok C No. 12, RT 03/RW 02",
    city: "Samarinda",
    postal: "75124",
    primary: true,
  },
  {
    label: "Kantor",
    name: "Aulia Putri",
    phone: "+62 812-3456-7890",
    address: "Gedung Mahakam Tower Lt. 4, Jl. P. Antasari No. 88",
    city: "Samarinda",
    postal: "75131",
    primary: false,
  },
  {
    label: "Rumah Mama",
    name: "Bu Sari",
    phone: "+62 812-9876-5432",
    address: "Jl. Slamet Riyadi Komp. Bukit Pinang II No. 7",
    city: "Samarinda",
    postal: "75117",
    primary: false,
  },
];

export default function AddressesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Alamat"
        title="Alamat tersimpan"
        description="Atur alamat penerima yang sering kamu pakai."
        actions={
          <Button variant="primary"><Plus className="h-4 w-4" /> Alamat baru</Button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ADDRS.map((a, i) => (
          <GlassCard key={i} className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-xl bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.4)] grid place-items-center text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
                <MapPin className="h-4 w-4" />
              </div>
              <p className="font-semibold">{a.label}</p>
              {a.primary && <Badge variant="success"><Star className="h-3 w-3" /> Utama</Badge>}
            </div>
            <p className="text-sm font-medium">{a.name}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{a.phone}</p>
            <p className="mt-2 text-sm">{a.address}, {a.city} {a.postal}</p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm">Edit</Button>
              {!a.primary && <Button variant="ghost" size="sm">Set utama</Button>}
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
