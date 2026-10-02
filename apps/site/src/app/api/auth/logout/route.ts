import { cookies } from "next/headers";
import { SESSION_COOKIE, ERP_TOKEN_COOKIE, ERP_REFRESH_COOKIE } from "@/lib/auth-edge";
import { revokeErpRefreshToken } from "@/lib/erp-session";

export async function POST() {
  const jar = await cookies();
  // Revoke server-side too, so a copied refresh cookie stops working.
  await revokeErpRefreshToken(jar.get(ERP_REFRESH_COOKIE)?.value);
  jar.delete(SESSION_COOKIE);
  jar.delete(ERP_TOKEN_COOKIE);
  jar.delete(ERP_REFRESH_COOKIE);
  return Response.json({ ok: true });
}
