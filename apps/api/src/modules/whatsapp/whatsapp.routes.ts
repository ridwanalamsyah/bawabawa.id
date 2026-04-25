import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { authGuard } from "../../common/middleware/auth";
import { WhatsAppService } from "./whatsapp.service";
import { getPool } from "../../infrastructure/db/pool";

const whatsappRouter = Router();
const service = new WhatsAppService();

whatsappRouter.post("/messages/send", authGuard, async (req, res, next) => {
  try {
    const payload = z
      .object({
        to: z.string().min(8),
        templateCode: z.string().min(2),
        variables: z.record(z.string(), z.string())
      })
      .parse(req.body);

    const provider = await service.sendMessage(payload);
    const entry = {
      id: randomUUID(),
      ...payload,
      status: provider.status,
      providerMessageId: provider.providerMessageId,
      retryCount: 0,
      sentAt: new Date().toISOString()
    };
    await (await getPool()).query(
      `INSERT INTO wa_message_logs (id, template_code, recipient_phone, status, provider_message_id, retry_count)
       VALUES ($1::uuid, $2, $3, $4, $5, $6)`,
      [
        entry.id,
        entry.templateCode,
        entry.to,
        entry.status,
        entry.providerMessageId,
        entry.retryCount
      ]
    );
    res.status(202).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
});

whatsappRouter.get("/messages/logs", authGuard, async (_req, res) => {
  (await getPool())
    .query(
      `SELECT id, template_code AS "templateCode", recipient_phone AS "to", status,
              provider_message_id AS "providerMessageId", retry_count AS "retryCount", created_at AS "sentAt"
       FROM wa_message_logs
       ORDER BY created_at DESC
       LIMIT 200`
    )
    .then((result) => res.json({ success: true, data: result.rows }))
    .catch((error) =>
      res.status(500).json({
        success: false,
        error: { code: "WA_LOG_READ_FAILED", message: String(error) }
      })
    );
});

export { whatsappRouter };
