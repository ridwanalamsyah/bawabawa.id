import { cookies } from "next/headers";
import { requireAdminContext } from "@/lib/admin-bff";
import { ERP_TOKEN_COOKIE } from "@/lib/auth-edge";

/**
 * POST /api/admin/uploads — forward a multipart image upload to the ERP
 * (`/api/v1/uploads`, cms:manage + Vercel Blob). Forwarded as-is because
 * erpFetch would force a JSON content type.
 */
export async function POST(req: Request) {
  const ctx = await requireAdminContext();
  if (!ctx.ok) return ctx.response;
  const token = (await cookies()).get(ERP_TOKEN_COOKIE)?.value ?? ctx.ctx.erpToken;
  const base = (process.env.ERP_API_BASE_URL ?? process.env.NEXT_PUBLIC_ERP_API_URL ?? "").replace(/\/$/, "");
  const url = `${base.endsWith("/api/v1") ? base : `${base}/api/v1`}/uploads`;
  const form = await req.formData();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: form,
      signal: AbortSignal.timeout(20000),
    });
    const json = await res.json().catch(() => null);
    return Response.json(json ?? { error: "Upload gagal" }, { status: res.status });
  } catch {
    return Response.json({ error: "Server upload tidak terjangkau" }, { status: 502 });
  }
}
