"use client";

import { useState } from "react";
import { Bell, Search, Command } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export function Topbar({
  title,
  subtitle,
  user,
  notifications = 0,
}: {
  title: string;
  subtitle?: string;
  user?: { name: string; role?: string };
  notifications?: number;
}) {
  const [openNotif, setOpenNotif] = useState(false);
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-[hsl(var(--bg)/0.7)] border-b border-[hsl(var(--border))]">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{subtitle}</p>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <Input placeholder="Cari pesanan, customer, trip..." className="pl-10 pr-16 w-72" />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-1.5 py-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </div>
          <ThemeToggle />
          <div className="relative">
            <button
              onClick={() => setOpenNotif((s) => !s)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-2))]"
              aria-label="Notifikasi"
            >
              <Bell className="h-4 w-4" />
              {notifications > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[hsl(var(--emerald-500))] ring-2 ring-[hsl(var(--bg))] pulse-dot" />
              )}
            </button>
            <AnimatePresence>
              {openNotif && (
                <motion.div
                  initial={{ y: 6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 6, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-80 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] shadow-2xl p-3 z-40"
                >
                  <p className="text-sm font-semibold mb-2">Notifikasi terbaru</p>
                  <ul className="space-y-1">
                    {[
                      { t: "Pesanan BWB-AX42K1 sudah berangkat dari Bandung", a: "5m" },
                      { t: "Personal shopper Rani sedang belanja di Pasar Baru", a: "12m" },
                      { t: "Invoice INV-2025-0042 lunas — escrow rilis", a: "1j" },
                    ].map((n, i) => (
                      <li key={i} className="rounded-xl p-2 hover:bg-[hsl(var(--surface-2))] cursor-pointer">
                        <p className="text-sm">{n.t}</p>
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{n.a} lalu</p>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {user && (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[hsl(var(--border))]">
              <Avatar name={user.name} size={32} />
              <div className="leading-tight">
                <p className="text-sm font-medium">{user.name}</p>
                {user.role && <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{user.role}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
