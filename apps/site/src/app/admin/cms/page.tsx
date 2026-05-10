import { Plus, Image as ImageIcon, FileText, Layers, Megaphone } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type EntryType = "hero" | "promo" | "faq" | "banner";

const ENTRIES: { type: EntryType; label: string; title: string; status: "Published" | "Scheduled" | "Draft" }[] = [
  { type: "hero", label: "Hero", title: "Hero landing — Q4 2025", status: "Published" },
  { type: "promo", label: "Promo", title: "Diskon 20% trip BDG-SMD-244", status: "Scheduled" },
  { type: "faq", label: "FAQ", title: "Pertanyaan tentang escrow", status: "Draft" },
  { type: "banner", label: "Banner", title: "Open Trip Lebaran", status: "Published" },
];

function EntryIcon({ type }: { type: EntryType }) {
  if (type === "hero") return <Layers className="h-5 w-5" />;
  if (type === "promo") return <Megaphone className="h-5 w-5" />;
  if (type === "faq") return <FileText className="h-5 w-5" />;
  return <ImageIcon className="h-5 w-5" />;
}

export default function CMSPage() {
  return (
    <>
      <PageHeader
        eyebrow="CMS"
        title="Content management"
        description="Edit copy landing page, hero, banner promo, dan artikel blog. Sinkron otomatis ke web."
        actions={<Button variant="primary"><Plus className="h-4 w-4" /> Konten baru</Button>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {ENTRIES.map((e, i) => (
          <GlassCard key={i} className="p-5 flex items-start gap-4">
            <div className="h-10 w-10 rounded-2xl bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.4)] grid place-items-center text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
              <EntryIcon type={e.type} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="neutral">{e.label}</Badge>
                <Badge variant={e.status === "Published" ? "success" : e.status === "Scheduled" ? "info" : "warning"}>
                  {e.status}
                </Badge>
              </div>
              <p className="mt-2 font-semibold">{e.title}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Last updated 2 jam lalu · oleh Salsa Aprilia</p>
            </div>
            <Button variant="ghost" size="sm">Edit</Button>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
