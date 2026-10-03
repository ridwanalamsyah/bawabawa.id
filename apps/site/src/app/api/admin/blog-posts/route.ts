import { revalidateTag } from "next/cache";
import { callErpAsAdmin } from "@/lib/admin-bff";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await callErpAsAdmin<unknown[]>({ path: "/admin/blog-posts" });
  if (!result.ok) return result.response;
  return Response.json(result.data);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const result = await callErpAsAdmin<unknown>({ path: "/admin/blog-posts", method: "POST", body });
  if (!result.ok) return result.response;
  revalidateTag("blog", "max");
  return Response.json(result.data, { status: 201 });
}
