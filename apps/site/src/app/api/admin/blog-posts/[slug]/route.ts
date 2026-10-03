import { revalidateTag } from "next/cache";
import { callErpAsAdmin } from "@/lib/admin-bff";

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await req.json().catch(() => ({}));
  const result = await callErpAsAdmin<unknown>({
    path: `/admin/blog-posts/${encodeURIComponent(slug)}`,
    method: "PATCH",
    body,
  });
  if (!result.ok) return result.response;
  revalidateTag("blog", "max");
  return Response.json(result.data);
}
