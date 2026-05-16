import { cookies } from "next/headers";
import { bearer, verifyToken } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/auth-edge";

export async function GET(req: Request) {
  // Prefer cookie session (set by /api/auth/login). Fall back to Bearer
  // header for API-style consumers that haven't gone through the form.
  const jar = await cookies();
  const cookieToken = jar.get(SESSION_COOKIE)?.value;
  const session = (await verifyToken(cookieToken)) ?? (await bearer(req));
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json({ user: session });
}
