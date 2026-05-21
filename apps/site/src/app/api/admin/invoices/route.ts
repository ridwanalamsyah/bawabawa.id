import { callErpAsAdmin } from "@/lib/admin-bff";

type ErpInvoice = {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string | null;
  status: string;
  issuedAt: string | null;
  postedAt: string | null;
  totalAmount: string | number | null;
  paymentStatus: string | null;
  createdAt: string | null;
};

export async function GET() {
  const result = await callErpAsAdmin<ErpInvoice[]>({ path: "/finance/invoices" });
  if (!result.ok) return result.response;
  return Response.json(result.data);
}
