import { trips } from "@/lib/mock/trips";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const filtered = status ? trips.filter((t) => t.status === status) : trips;
  return Response.json({ data: filtered, total: filtered.length });
}
