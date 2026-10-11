import { cookies } from "next/headers";
import { requireAdminContext } from "@/lib/admin-bff";
import { ERP_TOKEN_COOKIE } from "@/lib/auth-edge";
import { erpApiBase } from "@/lib/erp-internal";

/**
 * POST /api/admin/uploads — forward a multipart image upload to the ERP
 * (`/api/v1/uploads`, cms:manage + Vercel Blob). Forwarded as-is because
 * erpFetch would force a JSON content type.
 */
export async function POST(req: Request) {
  const ctx = await requireAdminContext();
  if (!ctx.ok) return ctx.response;
  const token = (await cookies()).get(ERP_TOKEN_COOKIE)?.value ?? ctx.ctx.erpToken;
  const form = await req.formData();
  try {
    const url = `${await erpApiBase()}/uploads`;
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
