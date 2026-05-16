import { cookies } from "next/headers";
import { SESSION_COOKIE, ERP_TOKEN_COOKIE } from "@/lib/auth-edge";

export async function POST() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(ERP_TOKEN_COOKIE);
  return Response.json({ ok: true });
}
