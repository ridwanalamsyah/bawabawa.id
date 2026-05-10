import { trips } from "@/lib/mock/trips";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const trip = trips.find((t) => t.id === id || t.code === id);
  if (!trip) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ data: trip });
}
