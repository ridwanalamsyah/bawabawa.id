"use client";

import { motion } from "framer-motion";
import {
  ClipboardList,
  ShoppingBag,
  PackageCheck,
  Plane,
  Truck,
  Home,
  CircleDot,
  CheckCircle2,
} from "lucide-react";
import type { OrderStatus, Order } from "@/lib/types";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABEL } from "@/lib/mock/orders";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const ICONS: Record<OrderStatus, React.ElementType> = {
  request_received: ClipboardList,
  shopper_assigned: ShoppingBag,
  purchasing: ShoppingBag,
  packed: PackageCheck,
  departed_origin: Plane,
  in_transit: Plane,
  arrived_destination: Plane,
  out_for_delivery: Truck,
  delivered: Home,
  cancelled: CircleDot,
};

export function TrackingTimeline({ order }: { order: Order }) {
  const currentIdx = ORDER_STATUS_FLOW.indexOf(order.status);
  const timelineMap = new Map(order.timeline.map((t) => [t.status, t]));
  return (
    <ol className="relative pl-2">
      {ORDER_STATUS_FLOW.map((status, idx) => {
        const Icon = ICONS[status];
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const future = idx > currentIdx;
        const entry = timelineMap.get(status);
        return (
          <li key={status} className="relative pl-9 pb-6 last:pb-0">
            {idx < ORDER_STATUS_FLOW.length - 1 && (
              <span
                className={cn(
                  "absolute left-3.5 top-7 bottom-0 w-px",
                  done ? "bg-[hsl(var(--emerald-500))]" : "bg-[hsl(var(--border))]"
                )}
              />
            )}
            <span
              className={cn(
                "absolute left-0 top-0 grid h-7 w-7 place-items-center rounded-full",
                done && "bg-[hsl(var(--emerald-500))] text-white",
                active && "bg-[hsl(var(--sage-700))] text-white",
                future && "bg-[hsl(var(--surface-2))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]"
              )}
            >
              {done ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              {active && (
                <motion.span
                  className="absolute inset-0 rounded-full ring-2 ring-[hsl(var(--sage-700)/0.35)]"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </span>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p
                  className={cn(
                    "text-sm font-medium",
                    future && "text-[hsl(var(--muted-foreground))]"
                  )}
                >
                  {ORDER_STATUS_LABEL[status]}
                </p>
                {entry?.note && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{entry.note}</p>
                )}
              </div>
              {entry?.at && (
                <span className="text-[11px] text-[hsl(var(--muted-foreground))] tabular-nums whitespace-nowrap">
                  {formatDateTime(entry.at)}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
