import { callErpAsAdmin } from "@/lib/admin-bff";

const ALLOWED_STATUSES = new Set(["pending", "active", "suspended", "all"]);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const statusRaw = url.searchParams.get("status") ?? "all";
  const status = ALLOWED_STATUSES.has(statusRaw) ? statusRaw : "all";
  const result = await callErpAsAdmin<unknown[]>({
    path: `/admin/users?status=${encodeURIComponent(status)}`,
  });
  if (!result.ok) return result.response;
  return Response.json({ data: result.data, status });
}
