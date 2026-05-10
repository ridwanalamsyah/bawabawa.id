"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Plane,
  Users,
  CreditCard,
  BarChart3,
  Headphones,
  FileText,
  Shield,
  Settings,
  Cable,
  Bell,
  Truck,
  Heart,
  MapPin,
  Receipt,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export type SidebarIconName =
  | "dashboard"
  | "package"
  | "plane"
  | "users"
  | "card"
  | "chart"
  | "support"
  | "file"
  | "shield"
  | "settings"
  | "cable"
  | "bell"
  | "truck"
  | "heart"
  | "pin"
  | "receipt"
  | "chat";

const ICONS: Record<SidebarIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  package: Package,
  plane: Plane,
  users: Users,
  card: CreditCard,
  chart: BarChart3,
  support: Headphones,
  file: FileText,
  shield: Shield,
  settings: Settings,
  cable: Cable,
  bell: Bell,
  truck: Truck,
  heart: Heart,
  pin: MapPin,
  receipt: Receipt,
  chat: MessageSquare,
};

export type SidebarItem = {
  href: string;
  label: string;
  icon: SidebarIconName;
  badge?: string;
};

export type SidebarGroup = {
  label?: string;
  items: SidebarItem[];
};

export function Sidebar({
  groups,
  brandHref = "/",
  footer,
}: {
  groups: SidebarGroup[];
  brandHref?: string;
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--bg-soft))] h-svh sticky top-0">
      <div className="px-5 py-5">
        <Link href={brandHref}>
          <Logo />
        </Link>
      </div>
      <nav className="flex-1 px-3 overflow-y-auto">
        {groups.map((g, idx) => (
          <div key={idx} className="mb-5">
            {g.label && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                {g.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {g.items.map((it) => {
                const active = pathname === it.href || pathname.startsWith(it.href + "/");
                const Icon = ICONS[it.icon];
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all",
                      active
                        ? "bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] shadow-[0_4px_16px_-10px_hsl(var(--sage-700)/0.4)]"
                        : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface)/0.6)] hover:text-[hsl(var(--foreground))]"
                    )}
                  >
                    {active && (
                      <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-[hsl(var(--sage-700))]" />
                    )}
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]" : "text-[hsl(var(--muted-foreground))]")} />
                    <span className="flex-1 truncate">{it.label}</span>
                    {it.badge && (
                      <span className="ml-auto rounded-full bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.4)] text-[10px] font-medium px-1.5 py-0.5 text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
                        {it.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      {footer && <div className="border-t border-[hsl(var(--border))] p-3">{footer}</div>}
    </aside>
  );
}
