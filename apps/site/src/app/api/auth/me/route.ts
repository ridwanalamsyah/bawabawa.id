import { bearer } from "@/lib/auth";

export async function GET(req: Request) {
  const session = bearer(req);
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json({ user: session });
}
