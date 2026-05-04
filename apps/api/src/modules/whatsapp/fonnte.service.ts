import { randomUUID } from "crypto";
import { AppError } from "../../common/errors/app-error";

type QueryClient = {
  query: <Row = any>(sql: string, params?: any[]) => Promise<{ rows: Row[]; rowCount: number }>;
};

export type HttpClient = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string }
) => Promise<{ status: number; ok?: boolean; body: any }>;

export type FonnteConfig = {
  deviceToken: string;
  baseUrl?: string;
  fetch?: HttpClient;
};

export type EnqueueWhatsAppInput = {
  to: string;
  message: string;
  templateKey?: string;
  relatedEntity?: string;
  relatedId?: string;
  scheduledAt?: Date;
};

export type EnqueueWhatsAppResult = {
  whatsappId: string;
  status: "pending";
};

const MAX_ATTEMPTS = 5;

/**
 * Normalize an Indonesian-or-international phone number into Fonnte's
 * expected wire format (digits only, country code prefix without `+`,
 * leading `0` rewritten to `62` for Indonesia). Empty / non-digit
 * results throw, so callers can rely on the persisted value being
 * dialable.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) {
    throw new AppError(400, "INVALID_PHONE", "Nomor telepon tidak valid");
  }
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

function defaultHttp(): HttpClient {
  return async (url, init = {}) => {
    const res = await fetch(url, {
      method: init.method ?? "POST",
      headers: init.headers,
      body: init.body
    });
    let body: any = null;
    const text = await res.text();
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { status: res.status, ok: res.ok, body };
  };
}

export async function enqueueWhatsApp(
  qc: QueryClient,
  input: EnqueueWhatsAppInput
): Promise<EnqueueWhatsAppResult> {
  const phone = normalizePhone(input.to);
  if (!input.message || input.message.length > 4096) {
    throw new AppError(400, "INVALID_MESSAGE", "Pesan 1-4096 karakter");
  }
  const id = randomUUID();
  await qc.query(
    `INSERT INTO whatsapp_outbox
       (id, to_phone, template_key, message, related_entity, related_id,
        scheduled_at, status)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, NOW()), 'pending')`,
    [
      id,
      phone,
      input.templateKey ?? null,
      input.message,
      input.relatedEntity ?? null,
      input.relatedId ?? null,
      input.scheduledAt ?? null
    ]
  );
  return { whatsappId: id, status: "pending" };
}

export type SendWhatsAppResult =
  | { delivered: true; providerMessageId: string }
  | { delivered: false; reason: "RETRYABLE" | "PERMANENT"; error: string };

/**
 * Send a single outbox row through Fonnte. Same retry semantics as the
 * Resend service: 4xx → permanent, 5xx → retry up to MAX_ATTEMPTS,
 * network error → retry, idempotent against double-call (already-sent
 * rows return delivered:true with a sentinel id).
 */
export async function sendQueuedWhatsApp(
  qc: QueryClient,
  config: FonnteConfig,
  whatsappId: string
): Promise<SendWhatsAppResult> {
  const row = await qc.query<{
    id: string;
    to_phone: string;
    message: string;
    status: string;
    attempts: number;
  }>(
    `SELECT id, to_phone, message, status, attempts
       FROM whatsapp_outbox WHERE id = $1 FOR UPDATE`,
    [whatsappId]
  );
  if (!row.rowCount) {
    throw new AppError(404, "WHATSAPP_NOT_FOUND", "Pesan WhatsApp tidak ditemukan");
  }
  if (row.rows[0].status === "sent" || row.rows[0].status === "delivered" || row.rows[0].status === "read") {
    return { delivered: true, providerMessageId: "noop-already-sent" };
  }
  if (row.rows[0].status !== "pending") {
    return {
      delivered: false,
      reason: "PERMANENT",
      error: `Status ${row.rows[0].status} tidak dapat dikirim`
    };
  }

  const baseUrl = config.baseUrl ?? "https://api.fonnte.com";
  const http = config.fetch ?? defaultHttp();
  const formBody = new URLSearchParams({
    target: row.rows[0].to_phone,
    message: row.rows[0].message,
    countryCode: "62"
  }).toString();

  let res: { status: number; ok?: boolean; body: any };
  try {
    res = await http(`${baseUrl}/send`, {
      method: "POST",
      headers: {
        Authorization: config.deviceToken,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formBody
    });
  } catch (err) {
    await qc.query(
      `UPDATE whatsapp_outbox
          SET attempts = attempts + 1,
              last_error = $1,
              status = CASE WHEN attempts + 1 >= $2 THEN 'failed' ELSE 'pending' END,
              updated_at = NOW()
        WHERE id = $3`,
      [err instanceof Error ? err.message : String(err), MAX_ATTEMPTS, whatsappId]
    );
    return {
      delivered: false,
      reason: "RETRYABLE",
      error: err instanceof Error ? err.message : String(err)
    };
  }

  // Fonnte returns 200 with `{ status: false, reason: "..." }` for many
  // application-level errors (e.g. device offline, invalid number),
  // and 200 with `{ status: true, id: [...] }` on success.
  const ok = res.ok ?? (res.status >= 200 && res.status < 300);
  const apiOk = Boolean(res.body?.status);
  if (ok && apiOk) {
    const idCandidate = Array.isArray(res.body?.id) ? res.body.id[0] : res.body?.id;
    const messageId = String(idCandidate ?? "");
    if (!messageId) {
      await qc.query(
        `UPDATE whatsapp_outbox
            SET status = 'failed',
                attempts = attempts + 1,
                last_error = 'Fonnte response missing id',
                updated_at = NOW()
          WHERE id = $1`,
        [whatsappId]
      );
      return { delivered: false, reason: "PERMANENT", error: "Fonnte response missing id" };
    }
    await qc.query(
      `UPDATE whatsapp_outbox
          SET status = 'sent',
              provider_message_id = $1,
              attempts = attempts + 1,
              sent_at = NOW(),
              last_error = NULL,
              updated_at = NOW()
        WHERE id = $2`,
      [messageId, whatsappId]
    );
    return { delivered: true, providerMessageId: messageId };
  }

  // Failure path: distinguish between transport (5xx, will retry) and
  // application-level rejects (200 with status=false → permanent).
  const errorMsg = String(
    res.body?.reason ?? res.body?.message ?? `HTTP ${res.status}`
  );
  // Fonnte returns 200 with `process: pending` for invalid numbers as
  // application errors → treat as permanent. Network 5xx → retryable.
  const isTransport = !ok;
  const isRetryable = isTransport && res.status >= 500;
  await qc.query(
    `UPDATE whatsapp_outbox
        SET attempts = attempts + 1,
            last_error = $1,
            status = CASE
              WHEN $2::int < 500 THEN 'failed'
              WHEN attempts + 1 >= $3 THEN 'failed'
              ELSE 'pending'
            END,
            updated_at = NOW()
      WHERE id = $4`,
    [errorMsg, isTransport ? res.status : 400, MAX_ATTEMPTS, whatsappId]
  );
  return {
    delivered: false,
    reason: isRetryable ? "RETRYABLE" : "PERMANENT",
    error: errorMsg
  };
}

export async function flushWhatsAppOutbox(
  qc: QueryClient,
  config: FonnteConfig,
  limit = 25
): Promise<{ attempted: number; sent: number; failed: number; retryable: number }> {
  const pending = await qc.query<{ id: string }>(
    `SELECT id FROM whatsapp_outbox
       WHERE status = 'pending' AND scheduled_at <= NOW()
       ORDER BY scheduled_at ASC LIMIT $1`,
    [limit]
  );
  let sent = 0;
  let failed = 0;
  let retryable = 0;
  for (const row of pending.rows) {
    const result = await sendQueuedWhatsApp(qc, config, row.id);
    if (result.delivered) sent += 1;
    else if (result.reason === "PERMANENT") failed += 1;
    else retryable += 1;
  }
  return { attempted: pending.rows.length, sent, failed, retryable };
}

// =============================================================================
// Webhook
// =============================================================================

export type FonnteWebhookEvent = {
  /** Fonnte uses `device`, `sender`, `message`, and either `id` or `target`
   *  in different webhook variants. We extract by best effort and skip
   *  events we don't understand (return updated:false). */
  device?: string;
  id?: string;
  status?: string;
  message?: string;
  sender?: string;
  target?: string;
  [key: string]: unknown;
};

const STATUS_RANK: Record<string, number> = {
  pending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
  failed: 1
};

const FONNTE_STATUS_MAP: Record<string, string> = {
  sent: "sent",
  delivered: "delivered",
  read: "read",
  failed: "failed",
  // Some Fonnte webhook payloads use the spelled-out forms.
  "message-sent": "sent",
  "message-delivered": "delivered",
  "message-read": "read",
  "message-failed": "failed"
};

/**
 * Apply a Fonnte delivery-status webhook to the outbox row identified
 * by `id`. Forward-only transitions (read > delivered > sent > pending),
 * so a delayed `sent` event can't roll back a `read` row. Unknown
 * events / message ids are silent no-ops (200 so Fonnte stops retrying).
 */
export async function applyWhatsAppWebhook(
  qc: QueryClient,
  event: FonnteWebhookEvent
): Promise<{ updated: boolean; whatsappId?: string; status?: string }> {
  const messageId = event.id;
  if (!messageId || typeof messageId !== "string") {
    return { updated: false };
  }
  const rawStatus = String(event.status ?? "").toLowerCase();
  const newStatus = FONNTE_STATUS_MAP[rawStatus];
  if (!newStatus) return { updated: false };

  const row = await qc.query<{ id: string; status: string }>(
    `SELECT id, status FROM whatsapp_outbox
      WHERE provider_message_id = $1 FOR UPDATE`,
    [messageId]
  );
  if (!row.rowCount) return { updated: false };
  const currentRank = STATUS_RANK[row.rows[0].status] ?? 0;
  const incomingRank = STATUS_RANK[newStatus] ?? 0;
  // Don't regress past terminal `failed` either.
  if (incomingRank < currentRank || row.rows[0].status === "failed") {
    return {
      updated: false,
      whatsappId: row.rows[0].id,
      status: row.rows[0].status
    };
  }
  await qc.query(
    `UPDATE whatsapp_outbox
        SET status = $1,
            updated_at = NOW()
      WHERE id = $2`,
    [newStatus, row.rows[0].id]
  );
  return { updated: true, whatsappId: row.rows[0].id, status: newStatus };
}
