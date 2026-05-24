import { callErpAsAdmin } from "@/lib/admin-bff";

type Trip = {
  id: string;
  code: string;
  origin: string;
  destination: string;
  departAt: string;
  arriveEstimateAt: string | null;
  capacityKg: number;
  bookedKg: number;
  baseFee: number;
  perKgFee: number;
  status: string;
  popularCategories: string[];
  notes: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function GET() {
  const result = await callErpAsAdmin<Trip[]>({ path: "/admin/trips" });
  if (!result.ok) return result.response;
  return Response.json(result.data);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const result = await callErpAsAdmin<{ id: string; code: string }>({
    path: "/admin/trips",
    method: "POST",
    body,
  });
  if (!result.ok) return result.response;
  return Response.json(result.data, { status: 201 });
}
