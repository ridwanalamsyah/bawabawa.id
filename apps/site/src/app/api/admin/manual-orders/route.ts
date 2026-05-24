import { callErpAsAdmin } from "@/lib/admin-bff";

type ManualOrderRequest = {
  customerName: string;
  customerPhone: string;
  branchId: string;
  totalAmount: number;
  sourceChannel:
    | "web"
    | "instagram"
    | "whatsapp"
    | "dm"
    | "telepon"
    | "email"
    | "marketplace"
    | "walkin"
    | "lainnya";
  notes?: string | null;
};

/**
 * POST /api/admin/manual-orders
 *
 * Admin-only — forwards a "manual" order to the ERP. Used by the
 * /admin/pos page to insert orders that came in via Instagram, WA, DM,
 * walk-in, etc., so all sales channels end up in the same ERP rather
 * than spreadsheets / chat history.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as ManualOrderRequest | null;
  if (!body || !body.customerName || !body.customerPhone || !body.branchId) {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }
  const result = await callErpAsAdmin({
    path: "/orders/manual",
    method: "POST",
    body,
  });
  if (!result.ok) return result.response;
  return Response.json(result.data);
}
