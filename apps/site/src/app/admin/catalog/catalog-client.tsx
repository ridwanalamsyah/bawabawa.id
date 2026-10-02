"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, Save, X } from "lucide-react";
import { Card, GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Textarea } from "@/components/ui/input";
import { formatIDR } from "@/lib/utils";
import { errorMessage } from "@/lib/order-requests";

type Product = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  originStore: string | null;
  price: number;
  weightKg: number | null;
  category: string | null;
  variants: string[];
  isCatalog: boolean;
  sort: number;
};

type Form = {
  name: string;
  description: string;
  imageUrl: string;
  originStore: string;
  price: string;
  weightKg: string;
  category: string;
  variants: string;
  isCatalog: boolean;
  sort: string;
};

const CATEGORY_SUGGESTIONS = ["Snack Khas Bandung", "Fashion & Factory Outlet", "Hijab", "Sepatu", "Skincare Lokal", "Lagi Rame"];

const empty: Form = {
  name: "",
  description: "",
  imageUrl: "",
  originStore: "",
  price: "",
  weightKg: "0.5",
  category: CATEGORY_SUGGESTIONS[0],
  variants: "",
  isCatalog: true,
  sort: "0",
};

function toForm(p: Product): Form {
  return {
    name: p.name,
    description: p.description ?? "",
    imageUrl: p.imageUrl ?? "",
    originStore: p.originStore ?? "",
    price: String(p.price),
    weightKg: p.weightKg != null ? String(p.weightKg) : "",
    category: p.category ?? "",
    variants: p.variants.join(", "),
    isCatalog: p.isCatalog,
    sort: String(p.sort ?? 0),
  };
}

function toPayload(f: Form) {
  return {
    name: f.name.trim(),
    description: f.description.trim() || null,
    imageUrl: f.imageUrl.trim() || null,
    originStore: f.originStore.trim() || null,
    price: Number(f.price.replace(/\D/g, "")) || 0,
    weightKg: f.weightKg ? Number(f.weightKg.replace(",", ".")) : null,
    category: f.category.trim() || null,
    variants: f.variants.split(",").map((v) => v.trim()).filter(Boolean),
    isCatalog: f.isCatalog,
    sort: Number(f.sort) || 0,
  };
}

export function CatalogAdminClient() {
  const [items, setItems] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/catalog", { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(errorMessage(json, `Gagal memuat (${res.status})`));
      setItems([]);
      return;
    }
    setItems(Array.isArray(json) ? (json as Product[]) : []);
  }, []);

  useEffect(() => {
    // Fetch-on-mount: state is set after the network round-trip.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const saved = (p: Product) => {
    setItems((list) => {
      const rest = (list ?? []).filter((x) => x.id !== p.id);
      return [p, ...rest];
    });
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setEditing("new")} disabled={editing === "new"}>
          <Plus className="h-4 w-4" aria-hidden /> Tambah barang
        </Button>
      </div>
      {error && (
        <Card className="p-4 text-sm text-[hsl(var(--danger))]" role="alert">
          {error}
        </Card>
      )}
      {editing === "new" && <ProductForm initial={empty} onCancel={() => setEditing(null)} onSaved={saved} />}
      {items === null ? (
        <Card className="p-10 flex justify-center text-sm text-[hsl(var(--muted-foreground))]">
          <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden /> Memuat…
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Belum ada barang. Mulai dari 5–10 barang paling sering dititip (snack khas, outlet favorit).
        </Card>
      ) : (
        <ul className="space-y-3">
          {items.map((p) =>
            editing === p.id ? (
              <li key={p.id}>
                <ProductForm id={p.id} initial={toForm(p)} onCancel={() => setEditing(null)} onSaved={saved} />
              </li>
            ) : (
              <li key={p.id}>
                <GlassCard className="p-4 flex items-center gap-4">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-[hsl(var(--surface-2))]" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {p.category ?? "Tanpa kategori"} · {formatIDR(p.price)}
                      {p.weightKg != null ? ` · ${p.weightKg} kg` : ""}
                    </p>
                  </div>
                  <Badge variant={p.isCatalog ? "success" : "neutral"}>
                    {p.isCatalog ? (
                      <>
                        <Eye className="h-3 w-3" aria-hidden /> Tampil
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" aria-hidden /> Tersembunyi
                      </>
                    )}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => setEditing(p.id)} aria-label={`Ubah ${p.name}`}>
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Button>
                </GlassCard>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}

function ProductForm({
  id,
  initial,
  onCancel,
  onSaved,
}: {
  id?: string;
  initial: Form;
  onCancel: () => void;
  onSaved: (p: Product) => void;
}) {
  const [form, setForm] = useState<Form>(initial);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const fid = (k: string) => `${id ?? "new"}-${k}`;

  const upload = async (file: File) => {
    setUploading(true);
    setErr(null);
    const body = new FormData();
    body.set("file", file);
    body.set("folder", "products");
    body.set("filename", form.name || file.name);
    try {
      const res = await fetch("/api/admin/uploads", { method: "POST", body });
      const json = (await res.json().catch(() => null)) as { data?: { url?: string } } | null;
      if (!res.ok || !json?.data?.url) {
        setErr(errorMessage(json, "Upload gagal"));
        return;
      }
      set({ imageUrl: json.data.url });
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(id ? `/api/admin/catalog/${id}` : "/api/admin/catalog", {
        method: id ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setErr(errorMessage(json, `Gagal menyimpan (${res.status})`));
        return;
      }
      onSaved(json as Product);
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassCard className="p-5">
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 grid gap-1.5">
          <Label htmlFor={fid("name")}>Nama barang</Label>
          <Input id={fid("name")} value={form.name} onChange={(e) => set({ name: e.target.value })} required minLength={2} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={fid("price")}>Harga all-in (Rp)</Label>
          <Input id={fid("price")} inputMode="numeric" value={form.price} onChange={(e) => set({ price: e.target.value })} required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={fid("weight")}>Berat per pcs (kg)</Label>
          <Input id={fid("weight")} inputMode="decimal" value={form.weightKg} onChange={(e) => set({ weightKg: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={fid("category")}>Kategori</Label>
          <Input id={fid("category")} list={fid("cats")} value={form.category} onChange={(e) => set({ category: e.target.value })} />
          <datalist id={fid("cats")}>
            {CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={fid("store")}>Toko asal</Label>
          <Input id={fid("store")} value={form.originStore} onChange={(e) => set({ originStore: e.target.value })} placeholder="Kartika Sari, Jl. Dago" />
        </div>
        <div className="sm:col-span-2 grid gap-1.5">
          <Label htmlFor={fid("variants")}>Varian (pisahkan dengan koma)</Label>
          <Input id={fid("variants")} value={form.variants} onChange={(e) => set({ variants: e.target.value })} placeholder="Original, Keju, Cokelat" />
        </div>
        <div className="sm:col-span-2 grid gap-1.5">
          <Label htmlFor={fid("desc")}>Deskripsi singkat</Label>
          <Textarea id={fid("desc")} value={form.description} onChange={(e) => set({ description: e.target.value })} />
        </div>
        <div className="sm:col-span-2 grid gap-1.5">
          <Label htmlFor={fid("image")}>Foto</Label>
          <div className="flex items-center gap-3">
            {form.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.imageUrl} alt="" className="h-14 w-14 rounded-xl object-cover" />
            )}
            <Input id={fid("image")} value={form.imageUrl} onChange={(e) => set({ imageUrl: e.target.value })} placeholder="https://…" />
            <label className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-[hsl(var(--border))] px-4 text-sm hover:bg-[hsl(var(--surface-2))]">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ImagePlus className="h-4 w-4" aria-hidden />}
              Upload
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} />
            </label>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isCatalog} onChange={(e) => set({ isCatalog: e.target.checked })} /> Tampilkan di katalog
        </label>
        <div className="grid gap-1.5">
          <Label htmlFor={fid("sort")}>Urutan (lebih besar = lebih atas)</Label>
          <Input id={fid("sort")} inputMode="numeric" value={form.sort} onChange={(e) => set({ sort: e.target.value })} />
        </div>
        {err && (
          <p role="alert" className="sm:col-span-2 text-sm text-[hsl(var(--danger))]">
            {err}
          </p>
        )}
        <div className="sm:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4" aria-hidden /> Batal
          </Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />} Simpan
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
