import { customers } from "@/lib/mock/customers";

export async function GET() {
  return Response.json({ data: customers, total: customers.length });
}
