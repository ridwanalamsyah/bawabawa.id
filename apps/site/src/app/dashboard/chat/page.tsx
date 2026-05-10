"use client";

import { useState } from "react";
import { Send, Paperclip } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Msg = { id: number; from: "user" | "admin" | "shopper"; text: string; at: string };

const initial: Msg[] = [
  { id: 1, from: "admin", text: "Halo Aulia! Aku Tika dari support Bawabawa. Ada yang bisa kubantu?", at: "09:14" },
  { id: 2, from: "user", text: "Halo kak, mau tanya barang aku BWB-AX42K1 sudah sampai mana ya?", at: "09:15" },
  { id: 3, from: "admin", text: "Sebentar ya, aku cek di sistem. Sudah berangkat dari Bandung pukul 06.40 WIB tadi pagi 🚚", at: "09:16" },
  { id: 4, from: "shopper", text: "Halo! Aku Rani, shopper-nya. Brownies Amanda original udah aku beliin yang masih hangat 😄 langsung packing rapi ya.", at: "09:18" },
];

export default function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { id: Date.now(), from: "user", text, at: "sekarang" }]);
    setText("");
    setTimeout(() => {
      setMsgs((m) => [
        ...m,
        {
          id: Date.now() + 1,
          from: "admin",
          text: "Sip, langsung aku update ke kamu kalau ada perubahan status ya kak ✨",
          at: "sekarang",
        },
      ]);
    }, 900);
  };

  return (
    <>
      <PageHeader
        eyebrow="Live Chat Admin"
        title="Ngobrol dengan support & shopper"
        description="Sambung langsung ke tim Bawabawa di Bandung. Online 24/7."
      />
      <Card className="p-0 overflow-hidden flex flex-col h-[calc(100svh-260px)] min-h-[480px]">
        <div className="px-5 py-4 border-b border-[hsl(var(--border))] flex items-center gap-3">
          <Avatar name="Tika Wahyuni" size={36} />
          <div className="flex-1">
            <p className="font-semibold text-sm">Tika · Customer Support</p>
            <p className="text-xs text-[hsl(var(--emerald-600))] dark:text-[hsl(var(--emerald-400))] flex items-center gap-1.5">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-[hsl(var(--emerald-500))] opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(var(--emerald-500))]" />
              </span>
              Online sekarang
            </p>
          </div>
          <Badge variant="success">Trip BWB-AX42K1</Badge>
        </div>
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 bg-[hsl(var(--bg-soft))]">
          {msgs.map((m) => {
            const isUser = m.from === "user";
            return (
              <div key={m.id} className={cn("flex gap-2 max-w-[80%]", isUser && "ml-auto flex-row-reverse")}>
                {!isUser && (
                  <Avatar
                    name={m.from === "admin" ? "Tika Wahyuni" : "Rani Maharani"}
                    size={28}
                  />
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    isUser
                      ? "bg-[hsl(var(--sage-700))] text-[hsl(var(--primary-foreground))]"
                      : "bg-[hsl(var(--surface))] border border-[hsl(var(--border))]"
                  )}
                >
                  {!isUser && (
                    <p className="text-[10px] uppercase tracking-wider mb-0.5 opacity-70">
                      {m.from === "admin" ? "Support" : "Shopper"}
                    </p>
                  )}
                  {m.text}
                  <span className={cn("ml-2 text-[10px]", isUser ? "text-white/70" : "text-[hsl(var(--muted-foreground))]")}>
                    {m.at}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-3 border-t border-[hsl(var(--border))] flex items-center gap-2">
          <button className="h-10 w-10 rounded-full grid place-items-center hover:bg-[hsl(var(--surface-2))]">
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ketik pesan..."
            className="flex-1 h-11 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--surface))] px-4 text-sm outline-none focus:border-[hsl(var(--ring))] focus:ring-4 focus:ring-[hsl(var(--ring)/0.15)]"
          />
          <button
            onClick={send}
            className="h-10 w-10 rounded-full bg-[hsl(var(--sage-700))] text-[hsl(var(--primary-foreground))] grid place-items-center hover:bg-[hsl(var(--sage-800))]"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </>
  );
}
