"use client";

import * as React from "react";
import { GlassCard } from "@/components/ui/card";

/**
 * Generic read-only ERP listing — used by /admin/inventory, /procurement,
 * /hr, /vouchers, etc. so every ERP module has at least a discoverable
 * UI surface. Each page wires its own column definitions; this component
 * just handles fetch/loading/empty/error state.
 */
export type Column<Row> = {
  key: string;
  header: string;
  render: (row: Row) => React.ReactNode;
  className?: string;
};

export function ErpListPage<Row extends Record<string, unknown>>({
  endpoint,
  columns,
  emptyMessage,
  rowKey,
  footer,
}: {
  endpoint: string;
  columns: Column<Row>[];
  emptyMessage: string;
  rowKey: (row: Row, index: number) => string;
  footer?: React.ReactNode;
}) {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setError(`Gagal memuat (${res.status})`);
          return;
        }
        const data = (await res.json()) as Row[] | { error?: string };
        if (cancelled) return;
        if (Array.isArray(data)) {
          setRows(data);
        } else {
          setError(data.error ?? "Format response tak terduga");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Gagal terhubung ke server");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--surface-2))] text-left text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {loading && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-[hsl(var(--muted-foreground))]"
                >
                  Memuat…
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-[hsl(var(--rose-700))]"
                >
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-[hsl(var(--muted-foreground))]"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              rows.map((row, i) => (
                <tr key={rowKey(row, i)} className="hover:bg-[hsl(var(--surface-2)/0.5)]">
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {footer && (
        <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-4 py-2 text-xs text-[hsl(var(--muted-foreground))]">
          {footer}
        </div>
      )}
    </GlassCard>
  );
}
