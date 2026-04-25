import { Router } from "express";
import { authGuard } from "../../common/middleware/auth";
import * as XLSX from "xlsx";

const reportsRouter = Router();

reportsRouter.get("/kpi", authGuard, (_req, res) => {
  res.json({
    success: true,
    data: {
      dailySales: 4200000,
      topProduct: "Produk A",
      loyalCustomers: 34,
      stockAlerts: 7
    }
  });
});

reportsRouter.get("/sales.xlsx", authGuard, (_req, res) => {
  const rows = [
    { orderNumber: "SO-001", totalAmount: 120000, paymentStatus: "paid" },
    { orderNumber: "SO-002", totalAmount: 80000, paymentStatus: "dp" }
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Sales");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=sales-report.xlsx");
  res.send(buffer);
});

export { reportsRouter };
