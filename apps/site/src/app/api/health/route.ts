import { erpSafe } from "@/lib/erp-client";

export async function GET() {
  const erp = await erpSafe<{ status: string }>({ path: "/health", timeoutMs: 2000 });
  return Response.json({
    status: "ok",
    service: "bawabawa-site",
    erp: {
      status: erp.ok ? erp.data.status : "fallback",
      reachable: erp.ok,
      source: erp.source,
      lastSync: new Date().toISOString(),
    },
    queue: { workers: 4, pending: 3 },
    uptime: process.uptime(),
  });
}
