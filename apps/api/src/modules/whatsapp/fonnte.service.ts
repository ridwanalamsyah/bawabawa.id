import { randomUUID } from "crypto";
import { AppError } from "../../common/errors/app-error";

type QueryClient = {
  query: <Row = any>(sql: string, params?: any[]) => Promise<{ rows: Row[]; rowCount: number }>;
};

/**
 * Minimal HTTP client interface so tests can inject a fake without
 * mocking the global fetch. Mirrors the BiteShip / Resend service
 * contracts so all three integrations stay structurally consistent.
 */
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
  to: string;
  status: "pending";
};

const MAX_ATTEMPTS = 5;
const MESSAGE_MIN = 1;
const MESSAGE_MAX = 4096;

/**
 * Normalize an Indonesian phone number into Fonnte's expected
 * `62xxxxxxxxxx` format (no `+`, no leading `0`, digits only).
 *
 * Accepts:
 *   * `+6281234567890` → `6281234567890`
 *   * `081234567890`   → `6281234567890`
 *   * `6281234567890`  → `6281234567890` (idempotent)
 *
 * Throws `AppError(400, INVALID_PHONE)` for anything else (the API
 * costs money per attempt, so we'd rather reject early than send a
 * bad number to the gateway).
 */
export function normalizePhone(raw: string): string {
  if (!raw || typeof raw !== "string") {
    throw new AppError(400, "INVALID_PHONE", "Nomor telepon wajib diisi");
  }
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) {
    throw new AppError(400, "INVALID_PHONE", "Nomor telepon tidak valid");
  }
  let normalized: string;
  if (digits.startsWith("62")) normalized = digits;
  else if (digits.startsWith("0")) normalized = `62${digits.slice(1)}`;
  else if (digits.startsWith("8")) normalized = `62${digits}`;
  else {
    throw new AppError(
      400,
      "INVALID_PHONE",
      "Format nomor harus +62 / 0 / 62 (Indonesia)"
    );
  }
  // Indonesian mobile numbers are 10-13 digits including the country code.
  if (normalized.length < 10 || normalized.length > 15) {
    throw new AppError(400, "INVALID_PHONE", "Panjang nomor tidak valid");
  }
  return normalized;
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

/**
 * Validate + persist a WhatsApp message in `pending` status. Caller
 * is expected to commit the surrounding transaction; the row is then
 * picked up by `flushWhatsAppOutbox` (or `sendQueuedWhatsApp` for the
 * one-shot send path).
 */
export async function enqueueWhatsApp(
  qc: QueryClient,
  input: EnqueueWhatsAppInput
): Promise<EnqueueWhatsAppResult> {
  const phone = normalizePhone(input.to);
  if (!input.message || input.message.length < MESSAGE_MIN || input.message.length > MESSAGE_MAX) {
    throw new AppError(
      400,
      "INVALID_MESSAGE",
      `Pesan harus ${MESSAGE_MIN}-${MESSAGE_MAX} karakter`
    );
  }
  const id = randomUUID();
  await qc.query(
    `INSERT INTO whatsapp_outbox
       (id, to_phone, template_key, message,
        related_entity, related_id, scheduled_at, status, provider)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, NOW()), 'pending', 'fonnte')`,
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
  return { whatsappId: id, to: phone, status: "pending" };
}

export type SendWhatsAppResult =
  | { delivered: true; providerMessageId: string }
  | { delivered: false; reason: "RETRYABLE" | "PERMANENT"; error: string };

/**
 * Send a single outbox row to Fonnte. Idempotent: if the row is
 * already in a non-pending state we return a no-op success / failure
 * without hitting the provider.
 *
 * Classification:
 *   * 200 + body.status:true + body.id → `sent` (terminal)
 *   * 200 + body.status:false          → `failed` (permanent — Fonnte
 *                                        rejected the request, e.g.
 *                                        device offline, invalid number)
 *   * 5xx                              → retry up to MAX_ATTEMPTS, then
 *                                        `failed`
 *   * 4xx                              → `failed` (permanent)
 *   * network exception                → retry up to MAX_ATTEMPTS
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
    throw new AppError(404, "WHATSAPP_NOT_FOUND", "Pesan tidak ditemukan");
  }
  const r = row.rows[0];
  if (r.status === "sent" || r.status === "delivered" || r.status === "read") {
    return { delivered: true, providerMessageId: "noop-already-sent" };
  }
  if (r.status !== "pending") {
    return {
      delivered: false,
      reason: "PERMANENT",
      error: `Status ${r.status} tidak dapat dikirim`
    };
  }

  const baseUrl = config.baseUrl ?? "https://api.fonnte.com";
  const http = config.fetch ?? defaultHttp();

  // Fonnte expects application/x-www-form-urlencoded — JSON bodies
  // silently get rejected with status:false.
  const params = new URLSearchParams();
  params.set("target", r.to_phone);
  params.set("message", r.message);
  params.set("countryCode", "62");
  const body = params.toString();

  let res: { status: number; ok?: boolean; body: any };
  try {
    res = await http(`${baseUrl}/send`, {
      method: "POST",
      headers: {
        Authorization: config.deviceToken,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const exhausted = r.attempts + 1 >= MAX_ATTEMPTS;
    await qc.query(
      `UPDATE whatsapp_outbox
          SET attempts = attempts + 1,
              last_error = $1,
              status = CASE WHEN attempts + 1 >= $2 THEN 'failed' ELSE 'pending' END,
              updated_at = NOW()
        WHERE id = $3`,
      [errorMsg, MAX_ATTEMPTS, whatsappId]
    );
    // Once we've burned MAX_ATTEMPTS, the row is terminal `failed` —
    // surface that to the caller (and to flushWhatsAppOutbox's counters)
    // as PERMANENT so it's not double-counted as still retryable.
    return {
      delivered: false,
      reason: exhausted ? "PERMANENT" : "RETRYABLE",
      error: errorMsg
    };
  }

  const httpOk = res.ok ?? (res.status >= 200 && res.status < 300);
  // Fonnte's app-level success flag — even on HTTP 200 it can return
  // `status:false` to indicate a per-message failure.
  const appOk = httpOk && res.body && res.body.status === true;

  if (appOk) {
    // The id field is sometimes a JSON array `[ "id1" ]` and sometimes
    // a string — handle both.
    const rawId = Array.isArray(res.body.id) ? res.body.id[0] : res.body.id;
    const messageId = rawId ? String(rawId) : "";
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
      return {
        delivered: false,
        reason: "PERMANENT",
        error: "Fonnte response missing id"
      };
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

  // Either non-2xx, or 200 + status:false. 5xx is retryable, the rest
  // is permanent.
  const isServerErr = res.status >= 500 && res.status < 600;
  const exhausted = r.attempts + 1 >= MAX_ATTEMPTS;
  const errorMsg = String(
    res.body?.reason ?? res.body?.message ?? res.body?.error ?? `HTTP ${res.status}`
  );
  await qc.query(
    `UPDATE whatsapp_outbox
        SET attempts = attempts + 1,
            last_error = $1,
            status = CASE
              WHEN $2::int >= 200 AND $2::int < 500 THEN 'failed'
              WHEN attempts + 1 >= $3 THEN 'failed'
              ELSE 'pending'
            END,
            updated_at = NOW()
      WHERE id = $4`,
    [errorMsg, res.status, MAX_ATTEMPTS, whatsappId]
  );
  // 5xx is normally retryable, but if this attempt also exhausted the
  // budget the SQL above promoted the row to terminal `failed` — match
  // that in the return classification.
  return {
    delivered: false,
    reason: isServerErr && !exhausted ? "RETRYABLE" : "PERMANENT",
    error: errorMsg
  };
}

/**
 * Pick up to `limit` pending messages whose scheduled_at is in the
 * past and try sending each. Same shape as Resend's `flushOutbox` so
 * a single cron job can drive both queues.
 */
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
// Webhook status updates
// =============================================================================

export type FonnteWebhookEvent = {
  device?: string;
  // Fonnte sends `id` as a string; some plans use `messageid`. We
  // accept either to be defensive.
  id?: string;
  messageid?: string;
  status?: string;
  message?: string;
  sender?: string;
  target?: string;
  [key: string]: unknown;
};

const FONNTE_STATUS_MAP: Record<string, string> = {
  sent: "sent",
  delivered: "delivered",
  read: "read",
  failed: "failed"
};

/**
 * Linear ordering for the WhatsApp message lifecycle. Webhook events
 * for a status with rank < current status are stale (Fonnte retries
 * webhooks aggressively, so out-of-order delivery is common) and must
 * be ignored — applying them would regress the row.
 *
 * `failed` is a sibling terminal of `read` (rank 3) — neither
 * transitions into the other.
 */
const STATUS_RANK: Record<string, number> = {
  pending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
  failed: 3
};

/**
 * Apply a Fonnte webhook delivery event to the corresponding outbox
 * row. Looks up by `provider_message_id`. Unknown events / unknown
 * message ids are silently no-op (return updated:false) so we send
 * 200 and Fonnte stops retrying.
 */
export async function applyWhatsAppWebhook(
  qc: QueryClient,
  event: FonnteWebhookEvent
): Promise<{ updated: boolean; whatsappId?: string; status?: string }> {
  const messageId = event.id ?? event.messageid;
  if (!messageId || typeof messageId !== "string") {
    return { updated: false };
  }
  const incomingStatus = typeof event.status === "string" ? event.status.toLowerCase() : undefined;
  if (!incomingStatus) return { updated: false };
  const mapped = FONNTE_STATUS_MAP[incomingStatus];
  if (!mapped) return { updated: false };

  const existing = await qc.query<{ id: string; status: string }>(
    `SELECT id, status FROM whatsapp_outbox
       WHERE provider = 'fonnte' AND provider_message_id = $1
       FOR UPDATE`,
    [messageId]
  );
  if (!existing.rowCount) return { updated: false };

  const currentStatus = existing.rows[0].status;
  const currentRank = STATUS_RANK[currentStatus] ?? 0;
  const incomingRank = STATUS_RANK[mapped] ?? 0;
  // Block backwards transitions and stale terminal arrivals:
  //   * incomingRank < currentRank → strict regression (e.g. read→sent)
  //   * `failed` is terminal — never overwrite it (re-apply same status
  //     is fine but anything else is a stale event)
  //   * `read` is terminal — same rule
  //   * `delivered → failed` is rank-increasing (3 > 2) but is also a
  //     stale Fonnte event: once the device confirmed delivery, a
  //     later `failed` webhook is the gateway catching up to an old
  //     send-time error. Applying it would corrupt a successfully
  //     delivered message's record.
  if (
    incomingRank < currentRank ||
    (currentStatus === "failed" && mapped !== "failed") ||
    (currentStatus === "read" && mapped !== "read") ||
    (currentStatus === "delivered" && mapped === "failed")
  ) {
    return { updated: false, whatsappId: existing.rows[0].id, status: currentStatus };
  }
  await qc.query(
    `UPDATE whatsapp_outbox
        SET status = $1, updated_at = NOW()
      WHERE id = $2`,
    [mapped, existing.rows[0].id]
  );
  return { updated: true, whatsappId: existing.rows[0].id, status: mapped };
}
