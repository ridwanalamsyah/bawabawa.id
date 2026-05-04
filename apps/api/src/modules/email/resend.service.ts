import { randomUUID } from "crypto";
import { AppError } from "../../common/errors/app-error";

type QueryClient = {
  query: <Row = any>(sql: string, params?: any[]) => Promise<{ rows: Row[]; rowCount: number }>;
};

/**
 * Minimal HTTP client interface so tests can inject a fake without
 * mocking the global fetch. Mirrors the BiteShip service contract.
 */
export type HttpClient = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string }
) => Promise<{ status: number; ok?: boolean; body: any }>;

export type ResendConfig = {
  apiKey: string;
  baseUrl?: string;
  fromEmail: string;
  replyTo?: string;
  fetch?: HttpClient;
};

export type EnqueueEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateKey?: string;
  relatedEntity?: string;
  relatedId?: string;
  scheduledAt?: Date;
};

export type EnqueueEmailResult = {
  emailId: string;
  status: "pending";
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ATTEMPTS = 5;

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
 * Validate + persist an email row in `pending` status. Caller is expected
 * to commit the surrounding transaction; the row will be picked up by
 * `flushOutbox` (or `sendQueuedEmail` for one-shot) on the next pass.
 *
 * Outbox pattern means a webhook handler can enqueue mail in the same
 * transaction as the business event — we never lose nor double-send.
 */
export async function enqueueEmail(
  qc: QueryClient,
  input: EnqueueEmailInput
): Promise<EnqueueEmailResult> {
  if (!EMAIL_REGEX.test(input.to)) {
    throw new AppError(400, "INVALID_EMAIL", "Format email tidak valid");
  }
  if (!input.subject || input.subject.length > 255) {
    throw new AppError(400, "INVALID_SUBJECT", "Subject 1-255 karakter");
  }
  if (!input.html) {
    throw new AppError(400, "INVALID_HTML", "Body HTML wajib diisi");
  }
  const id = randomUUID();
  await qc.query(
    `INSERT INTO email_outbox
       (id, to_email, subject, template_key, html, text_body,
        related_entity, related_id, scheduled_at, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, NOW()), 'pending')`,
    [
      id,
      input.to,
      input.subject,
      input.templateKey ?? null,
      input.html,
      input.text ?? null,
      input.relatedEntity ?? null,
      input.relatedId ?? null,
      input.scheduledAt ?? null
    ]
  );
  return { emailId: id, status: "pending" };
}

export type SendEmailResult =
  | { delivered: true; providerMessageId: string }
  | { delivered: false; reason: "RETRYABLE" | "PERMANENT"; error: string };

/**
 * Send a single outbox row to Resend. Marks the row `sent` on 2xx,
 * increments attempts on 5xx (retryable), or `failed` on 4xx (permanent
 * — bad request, no point retrying). Idempotent against double-call:
 * if the row is already `sent` we no-op.
 */
export async function sendQueuedEmail(
  qc: QueryClient,
  config: ResendConfig,
  emailId: string
): Promise<SendEmailResult> {
  const row = await qc.query<{
    id: string;
    to_email: string;
    subject: string;
    html: string;
    text_body: string | null;
    status: string;
    attempts: number;
  }>(
    `SELECT id, to_email, subject, html, text_body, status, attempts
       FROM email_outbox WHERE id = $1 FOR UPDATE`,
    [emailId]
  );
  if (!row.rowCount) {
    throw new AppError(404, "EMAIL_NOT_FOUND", "Email tidak ditemukan");
  }
  if (row.rows[0].status === "sent") {
    return { delivered: true, providerMessageId: "noop-already-sent" };
  }
  if (row.rows[0].status !== "pending") {
    return {
      delivered: false,
      reason: "PERMANENT",
      error: `Email status ${row.rows[0].status} tidak dapat dikirim`
    };
  }

  const baseUrl = config.baseUrl ?? "https://api.resend.com";
  const http = config.fetch ?? defaultHttp();
  const reqBody: Record<string, unknown> = {
    from: config.fromEmail,
    to: [row.rows[0].to_email],
    subject: row.rows[0].subject,
    html: row.rows[0].html
  };
  if (row.rows[0].text_body) reqBody.text = row.rows[0].text_body;
  if (config.replyTo) reqBody.reply_to = config.replyTo;

  let res: { status: number; ok?: boolean; body: any };
  try {
    res = await http(`${baseUrl}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(reqBody)
    });
  } catch (err) {
    const exhausted = row.rows[0].attempts + 1 >= MAX_ATTEMPTS;
    await qc.query(
      `UPDATE email_outbox
          SET attempts = attempts + 1,
              last_error = $1,
              status = CASE WHEN attempts + 1 >= $2 THEN 'failed' ELSE 'pending' END,
              updated_at = NOW()
        WHERE id = $3`,
      [err instanceof Error ? err.message : String(err), MAX_ATTEMPTS, emailId]
    );
    // After MAX_ATTEMPTS the SQL above promotes the row to terminal
    // `failed` — surface that to the caller (and to flushOutbox
    // counters) as PERMANENT so it's not double-counted as retryable.
    return {
      delivered: false,
      reason: exhausted ? "PERMANENT" : "RETRYABLE",
      error: err instanceof Error ? err.message : String(err)
    };
  }

  const ok = res.ok ?? (res.status >= 200 && res.status < 300);
  if (ok) {
    const messageId = String(res.body?.id ?? "");
    if (!messageId) {
      // Provider responded 2xx without an id — treat as permanent: their
      // contract is broken, retrying won't help.
      await qc.query(
        `UPDATE email_outbox
            SET status = 'failed',
                attempts = attempts + 1,
                last_error = 'Resend response missing id',
                updated_at = NOW()
          WHERE id = $1`,
        [emailId]
      );
      return { delivered: false, reason: "PERMANENT", error: "Resend response missing id" };
    }
    await qc.query(
      `UPDATE email_outbox
          SET status = 'sent',
              provider_message_id = $1,
              attempts = attempts + 1,
              sent_at = NOW(),
              last_error = NULL,
              updated_at = NOW()
        WHERE id = $2`,
      [messageId, emailId]
    );
    return { delivered: true, providerMessageId: messageId };
  }

  // 4xx → permanent (validation, blocked sender). 5xx → retryable.
  const isClientErr = res.status >= 400 && res.status < 500;
  const exhausted = row.rows[0].attempts + 1 >= MAX_ATTEMPTS;
  const errorMsg = String(res.body?.message ?? res.body?.error ?? `HTTP ${res.status}`);
  await qc.query(
    `UPDATE email_outbox
        SET attempts = attempts + 1,
            last_error = $1,
            status = CASE
              WHEN $2::int < 500 THEN 'failed'
              WHEN attempts + 1 >= $3 THEN 'failed'
              ELSE 'pending'
            END,
            updated_at = NOW()
      WHERE id = $4`,
    [errorMsg, res.status, MAX_ATTEMPTS, emailId]
  );
  // 5xx is normally retryable, but if this attempt exhausted the
  // budget the SQL above promoted the row to terminal `failed` —
  // match that in the return classification.
  return {
    delivered: false,
    reason: isClientErr || exhausted ? "PERMANENT" : "RETRYABLE",
    error: errorMsg
  };
}

/**
 * Pick up to `limit` pending emails whose scheduled_at is in the past
 * and try sending each. Logs a result summary; individual row failures
 * are persisted on the row itself (last_error, attempts).
 */
export async function flushOutbox(
  qc: QueryClient,
  config: ResendConfig,
  limit = 25
): Promise<{ attempted: number; sent: number; failed: number; retryable: number }> {
  const pending = await qc.query<{ id: string }>(
    `SELECT id FROM email_outbox
       WHERE status = 'pending' AND scheduled_at <= NOW()
       ORDER BY scheduled_at ASC LIMIT $1`,
    [limit]
  );
  let sent = 0;
  let failed = 0;
  let retryable = 0;
  for (const row of pending.rows) {
    const result = await sendQueuedEmail(qc, config, row.id);
    if (result.delivered) sent += 1;
    else if (result.reason === "PERMANENT") failed += 1;
    else retryable += 1;
  }
  return { attempted: pending.rows.length, sent, failed, retryable };
}

// =============================================================================
// Webhook status updates
// =============================================================================

export type ResendWebhookEvent = {
  type: string; // e.g. "email.delivered", "email.bounced", "email.complained"
  data?: { email_id?: string; [key: string]: unknown };
  [key: string]: unknown;
};

const EVENT_STATUS_MAP: Record<string, string> = {
  "email.delivered": "sent",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.delivery_delayed": "pending"
};

/**
 * Apply a Resend webhook delivery event to the corresponding outbox row.
 * Looks up by `provider_message_id`. Unknown events / unknown message ids
 * are silently no-op (return updated:false) so we send 200 and Resend
 * doesn't keep retrying for messages that aren't ours.
 */
export async function applyEmailWebhook(
  qc: QueryClient,
  event: ResendWebhookEvent
): Promise<{ updated: boolean; emailId?: string; status?: string }> {
  const messageId = event.data?.email_id;
  if (!messageId || typeof messageId !== "string") {
    return { updated: false };
  }
  const status = EVENT_STATUS_MAP[event.type];
  if (!status) {
    // Unknown event type — record as no-op rather than corrupting status.
    return { updated: false };
  }
  const row = await qc.query<{ id: string }>(
    `SELECT id FROM email_outbox WHERE provider_message_id = $1`,
    [messageId]
  );
  if (!row.rowCount) return { updated: false };
  // Targeted forward-only transitions:
  //   * `bounced` / `complained` / `failed` are TERMINAL — never
  //     overwrite them (a late `email.delivered` after a `bounce` is
  //     a provider-side replay we ignore).
  //   * `sent` may transition to `bounced` / `complained` (Resend can
  //     deliver these after the initial 2xx) but MUST NOT regress to
  //     `pending` — `EVENT_STATUS_MAP['email.delivery_delayed'] =
  //     'pending'` would otherwise let `flushOutbox` re-send the
  //     same email (duplicate delivery).
  await qc.query(
    `UPDATE email_outbox
        SET status = CASE
              WHEN status IN ('bounced','complained','failed') THEN status
              WHEN status = 'sent' AND $1 = 'pending' THEN status
              ELSE $1
            END,
            updated_at = NOW()
      WHERE id = $2`,
    [status, row.rows[0].id]
  );
  return { updated: true, emailId: row.rows[0].id, status };
}
