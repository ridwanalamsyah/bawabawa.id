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
  Wallet,
  MessageSquare,
  Star,
  Megaphone,
  PenLine,
  Home,
  ShoppingBag,
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
  | "wallet"
  | "chat"
  | "star"
  | "megaphone"
  | "pen"
  | "home"
  | "bag";

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
  wallet: Wallet,
  chat: MessageSquare,
  star: Star,
  megaphone: Megaphone,
  pen: PenLine,
  home: Home,
  bag: ShoppingBag,
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
  /** Folded by default (opens when one of its pages is active). */
  collapsible?: boolean;
};

function isActive(pathname: string, href: string) {
  // Section roots ("/admin", "/dashboard") only match exactly, otherwise
  // the home item lights up on every page.
  const isRoot = href.split("/").filter(Boolean).length === 1;
  return pathname === href || (!isRoot && pathname.startsWith(href + "/"));
}

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
        {groups.map((g, idx) => {
          const items = (
            <div className="flex flex-col gap-0.5">
              {g.items.map((it) => (
                <NavLink key={it.href} item={it} active={isActive(pathname, it.href)} />
              ))}
            </div>
          );
          if (g.collapsible) {
            const open = g.items.some((it) => isActive(pathname, it.href));
            return (
              <details key={idx} open={open} className="group/fold mb-5">
                <summary className="flex cursor-pointer list-none items-center justify-between px-3 mb-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))] [&::-webkit-details-marker]:hidden">
                  {g.label}
                  <span className="transition-transform group-open/fold:rotate-90" aria-hidden>
                    ›
                  </span>
                </summary>
                {items}
              </details>
            );
          }
          return (
            <div key={idx} className="mb-5">
              {g.label && <p className="px-3 mb-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">{g.label}</p>}
              {items}
            </div>
          );
        })}
      </nav>
      {footer && <div className="border-t border-[hsl(var(--border))] p-3">{footer}</div>}
    </aside>
  );
}

function NavLink({ item, active }: { item: SidebarItem; active: boolean }) {
  const Icon = ICONS[item.icon];
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all",
        active
          ? "bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] shadow-[0_4px_16px_-10px_hsl(var(--sage-700)/0.4)]"
          : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface)/0.6)] hover:text-[hsl(var(--foreground))]",
      )}
    >
      {active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-[hsl(var(--sage-700))]" />}
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]" : "text-[hsl(var(--muted-foreground))]")} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="ml-auto rounded-full bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.4)] text-[10px] font-medium px-1.5 py-0.5 text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

/**
 * Phone navigation: a bottom bar with the main pages and a "Menu" sheet
 * listing everything else (the desktop sidebar is hidden below lg).
 */
export function MobileNav({ groups, primary }: { groups: SidebarGroup[]; primary: SidebarItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    // Close the sheet after navigating.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);
  return (
    <>
      <nav aria-label="Menu admin" className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[hsl(var(--border))] bg-[hsl(var(--bg))]/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <ul className="grid grid-cols-5">
          {primary.map((it) => {
            const Icon = ICONS[it.icon];
            const active = isActive(pathname, it.href);
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2 text-[11px]",
                    active ? "text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] font-semibold" : "text-[hsl(var(--muted-foreground))]",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {it.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex w-full flex-col items-center gap-0.5 py-2 text-[11px] text-[hsl(var(--muted-foreground))]"
            >
              <Settings className="h-5 w-5" aria-hidden />
              Menu
            </button>
          </li>
        </ul>
      </nav>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Semua menu">
          <button type="button" aria-label="Tutup" className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="animate-drop absolute inset-x-0 bottom-0 max-h-[80svh] overflow-y-auto rounded-t-3xl bg-[hsl(var(--bg))] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {groups.map((g, idx) => (
              <div key={idx} className="mb-4">
                {g.label && <p className="px-3 mb-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">{g.label}</p>}
                <div className="grid grid-cols-2 gap-1">
                  {g.items.map((it) => (
                    <NavLink key={it.href} item={it} active={isActive(pathname, it.href)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
