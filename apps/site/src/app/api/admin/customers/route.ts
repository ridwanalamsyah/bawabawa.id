import { callErpAsAdmin } from "@/lib/admin-bff";

type ErpCustomer = {
  id: string;
  name: string;
  phone: string | null;
  branchId: string | null;
};

export async function GET() {
  const result = await callErpAsAdmin<ErpCustomer[]>({
    path: "/crm/customers",
  });
  if (!result.ok) return result.response;
  return Response.json(result.data);
}
