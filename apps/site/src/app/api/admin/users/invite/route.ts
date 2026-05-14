import { callErpAsAdmin } from "@/lib/admin-bff";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    fullName?: string;
    division?: string;
  };
  if (!body.email || !body.fullName) {
    return Response.json({ error: "email & fullName required" }, { status: 400 });
  }
  const result = await callErpAsAdmin<unknown>({
    path: "/admin/users/invite",
    method: "POST",
    body: {
      email: body.email,
      fullName: body.fullName,
      division: body.division ?? "admin",
    },
  });
  if (!result.ok) return result.response;
  return Response.json({ data: result.data });
}
