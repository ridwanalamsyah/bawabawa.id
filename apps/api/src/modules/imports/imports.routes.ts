import { Router } from "express";
import { authGuard } from "../../common/middleware/auth";

const importsRouter = Router();
const previewStore = new Map<string, { validRows: number; invalidRows: number }>();

importsRouter.post("/products", authGuard, (_req, res) => {
  const previewId = `preview_${Date.now()}`;
  previewStore.set(previewId, { validRows: 25, invalidRows: 0 });
  res.status(202).json({
    success: true,
    data: {
      previewId,
      status: "preview_ready",
      validRows: 25,
      invalidRows: 0
    }
  });
});

importsRouter.post("/products/:previewId/commit", authGuard, (req, res) => {
  const previewId = String(req.params.previewId);
  const preview = previewStore.get(previewId);
  if (!preview) {
    return res.status(404).json({
      success: false,
      error: { code: "PREVIEW_NOT_FOUND", message: "Preview import tidak ditemukan" }
    });
  }
  if (preview.invalidRows > 0) {
    return res.status(422).json({
      success: false,
      error: { code: "INVALID_ROWS_FOUND", message: "Masih ada baris invalid" }
    });
  }
  previewStore.delete(previewId);
  return res.json({ success: true, data: { committed: true } });
});

export { importsRouter };
