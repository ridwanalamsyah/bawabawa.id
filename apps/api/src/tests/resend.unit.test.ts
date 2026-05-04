import { describe, expect, it } from "vitest";
import {
  applyEmailWebhook,
  enqueueEmail,
  flushOutbox,
  sendQueuedEmail,
  type HttpClient,
  type ResendConfig
} from "../modules/email/resend.service";

type Row = {
  id: string;
  to_email: string;
  subject: string;
  template_key: string | null;
  html: string;
  text_body: string | null;
  status: string;
  provider: string;
  provider_message_id: string | null;
  attempts: number;
  last_error: string | null;
  related_entity: string | null;
  related_id: string | null;
  scheduled_at: Date;
  sent_at: Date | null;
};

function makeFakeClient() {
  const rows: Row[] = [];
  return {
    rows,
    async query<R = any>(sql: string, params: any[] = []): Promise<{ rows: R[]; rowCount: number }> {
      const t = sql.trim();
      if (/^INSERT INTO email_outbox/i.test(t)) {
        const [
          id,
          to,
          subject,
          tplKey,
          html,
          textBody,
          relatedEntity,
          relatedId,
          scheduledAt
        ] = params;
        rows.push({
          id,
          to_email: to,
          subject,
          template_key: tplKey,
          html,
          text_body: textBody,
          status: "pending",
          provider: "resend",
          provider_message_id: null,
          attempts: 0,
          last_error: null,
          related_entity: relatedEntity,
          related_id: relatedId,
          scheduled_at: scheduledAt ?? new Date(),
          sent_at: null
        });
        return { rows: [] as R[], rowCount: 1 };
      }
      if (/^SELECT id, to_email, subject, html, text_body, status, attempts/i.test(t)) {
        const [id] = params;
        const found = rows.find((r) => r.id === id);
        return found
          ? { rows: [found as unknown as R], rowCount: 1 }
          : { rows: [], rowCount: 0 };
      }
      if (/^SELECT id FROM email_outbox\s+WHERE status = 'pending'/i.test(t)) {
        const [limit] = params;
        const ready = rows
          .filter((r) => r.status === "pending" && r.scheduled_at <= new Date())
          .slice(0, limit);
        return {
          rows: ready.map((r) => ({ id: r.id }) as unknown as R),
          rowCount: ready.length
        };
      }
      if (/^SELECT id FROM email_outbox WHERE provider_message_id/i.test(t)) {
        const [messageId] = params;
        const found = rows.find((r) => r.provider_message_id === messageId);
        return found
          ? { rows: [{ id: found.id } as unknown as R], rowCount: 1 }
          : { rows: [], rowCount: 0 };
      }
      if (/^UPDATE email_outbox\s+SET attempts = attempts \+ 1,\s+last_error = \$1,\s+status = CASE WHEN attempts \+ 1 >= \$2/i.test(t)) {
        // Network-error retryable update path
        const [errMsg, maxAttempts, id] = params;
        const r = rows.find((x) => x.id === id);
        if (r) {
          r.attempts += 1;
          r.last_error = errMsg;
          if (r.attempts >= maxAttempts) r.status = "failed";
        }
        return { rows: [], rowCount: r ? 1 : 0 };
      }
      if (/^UPDATE email_outbox\s+SET status = 'failed'/i.test(t)) {
        const [id] = params;
        const r = rows.find((x) => x.id === id);
        if (r) {
          r.status = "failed";
          r.attempts += 1;
          r.last_error = "Resend response missing id";
        }
        return { rows: [], rowCount: r ? 1 : 0 };
      }
      if (/^UPDATE email_outbox\s+SET status = 'sent'/i.test(t)) {
        const [messageId, id] = params;
        const r = rows.find((x) => x.id === id);
        if (r) {
          r.status = "sent";
          r.provider_message_id = messageId;
          r.attempts += 1;
          r.sent_at = new Date();
          r.last_error = null;
        }
        return { rows: [], rowCount: r ? 1 : 0 };
      }
      if (/^UPDATE email_outbox\s+SET attempts = attempts \+ 1,\s+last_error = \$1,\s+status = CASE\s+WHEN \$2/i.test(t)) {
        const [errMsg, httpStatus, maxAttempts, id] = params;
        const r = rows.find((x) => x.id === id);
        if (r) {
          r.attempts += 1;
          r.last_error = errMsg;
          if (httpStatus < 500) r.status = "failed";
          else if (r.attempts >= maxAttempts) r.status = "failed";
        }
        return { rows: [], rowCount: r ? 1 : 0 };
      }
      if (/^UPDATE email_outbox\s+SET status = CASE/i.test(t)) {
        const [status, id] = params;
        const r = rows.find((x) => x.id === id);
        if (r) {
          // Mirror the SQL guard exactly: terminal statuses ('sent' is
          // also terminal because email.delivery_delayed → 'pending'
          // would otherwise allow a re-send).
          if (!["sent", "bounced", "complained", "failed"].includes(r.status)) {
            r.status = status;
          }
        }
        return { rows: [], rowCount: r ? 1 : 0 };
      }
      throw new Error(`Unhandled SQL in test: ${t.slice(0, 80)}`);
    }
  };
}

function makeHttp(handler: (url: string, init: any) => { status: number; body: any }): HttpClient {
  return async (url, init) => {
    const r = handler(url, init);
    return { status: r.status, ok: r.status >= 200 && r.status < 300, body: r.body };
  };
}

const baseConfig = (over: Partial<ResendConfig> = {}): ResendConfig => ({
  apiKey: "re_test_key_1234567890",
  fromEmail: "noreply@bawabawa.id",
  ...over
});

describe("enqueueEmail", () => {
  it("validates email format", async () => {
    const c = makeFakeClient();
    await expect(
      enqueueEmail(c, { to: "not-an-email", subject: "x", html: "<p>x</p>" })
    ).rejects.toMatchObject({ code: "INVALID_EMAIL", statusCode: 400 });
  });

  it("validates subject + html presence", async () => {
    const c = makeFakeClient();
    await expect(
      enqueueEmail(c, { to: "a@b.co", subject: "", html: "<p>x</p>" })
    ).rejects.toMatchObject({ code: "INVALID_SUBJECT" });
    await expect(
      enqueueEmail(c, { to: "a@b.co", subject: "hi", html: "" })
    ).rejects.toMatchObject({ code: "INVALID_HTML" });
  });

  it("persists pending row with metadata", async () => {
    const c = makeFakeClient();
    const r = await enqueueEmail(c, {
      to: "a@b.co",
      subject: "Test",
      html: "<p>Hi</p>",
      templateKey: "order_confirmation",
      relatedEntity: "order",
      relatedId: "00000000-0000-0000-0000-000000000001"
    });
    expect(r).toMatchObject({ status: "pending" });
    expect(c.rows).toHaveLength(1);
    expect(c.rows[0]).toMatchObject({
      to_email: "a@b.co",
      subject: "Test",
      template_key: "order_confirmation",
      status: "pending"
    });
  });
});

describe("sendQueuedEmail", () => {
  it("delivers on 200 and stores provider_message_id", async () => {
    const c = makeFakeClient();
    const { emailId } = await enqueueEmail(c, {
      to: "a@b.co",
      subject: "Test",
      html: "<p>Hi</p>"
    });
    const fetch = makeHttp(() => ({ status: 200, body: { id: "msg_abc123" } }));
    const result = await sendQueuedEmail(c, baseConfig({ fetch }), emailId);
    expect(result).toEqual({ delivered: true, providerMessageId: "msg_abc123" });
    const row = c.rows[0];
    expect(row.status).toBe("sent");
    expect(row.provider_message_id).toBe("msg_abc123");
    expect(row.sent_at).toBeInstanceOf(Date);
  });

  it("returns no-op for already-sent rows (idempotent re-call)", async () => {
    const c = makeFakeClient();
    const { emailId } = await enqueueEmail(c, {
      to: "a@b.co",
      subject: "x",
      html: "<p>x</p>"
    });
    c.rows[0].status = "sent";
    c.rows[0].provider_message_id = "msg_old";
    const result = await sendQueuedEmail(c, baseConfig(), emailId);
    expect(result).toEqual({ delivered: true, providerMessageId: "noop-already-sent" });
  });

  it("4xx → permanent failure (no retry)", async () => {
    const c = makeFakeClient();
    const { emailId } = await enqueueEmail(c, {
      to: "a@b.co",
      subject: "x",
      html: "<p>x</p>"
    });
    const fetch = makeHttp(() => ({
      status: 422,
      body: { message: "Domain not verified" }
    }));
    const result = await sendQueuedEmail(c, baseConfig({ fetch }), emailId);
    expect(result).toMatchObject({
      delivered: false,
      reason: "PERMANENT",
      error: "Domain not verified"
    });
    expect(c.rows[0].status).toBe("failed");
    expect(c.rows[0].attempts).toBe(1);
  });

  it("5xx → retryable (stays pending until max attempts)", async () => {
    const c = makeFakeClient();
    const { emailId } = await enqueueEmail(c, {
      to: "a@b.co",
      subject: "x",
      html: "<p>x</p>"
    });
    const fetch = makeHttp(() => ({ status: 500, body: { message: "boom" } }));
    const result = await sendQueuedEmail(c, baseConfig({ fetch }), emailId);
    expect(result).toMatchObject({ delivered: false, reason: "RETRYABLE" });
    expect(c.rows[0].status).toBe("pending");
    expect(c.rows[0].attempts).toBe(1);
  });

  it("network error → retryable", async () => {
    const c = makeFakeClient();
    const { emailId } = await enqueueEmail(c, {
      to: "a@b.co",
      subject: "x",
      html: "<p>x</p>"
    });
    const fetch: HttpClient = async () => {
      throw new Error("ECONNRESET");
    };
    const result = await sendQueuedEmail(c, baseConfig({ fetch }), emailId);
    expect(result).toMatchObject({ delivered: false, reason: "RETRYABLE", error: "ECONNRESET" });
    expect(c.rows[0].status).toBe("pending");
    expect(c.rows[0].last_error).toBe("ECONNRESET");
  });

  it("2xx without id → permanent (broken provider response)", async () => {
    const c = makeFakeClient();
    const { emailId } = await enqueueEmail(c, {
      to: "a@b.co",
      subject: "x",
      html: "<p>x</p>"
    });
    const fetch = makeHttp(() => ({ status: 200, body: {} }));
    const result = await sendQueuedEmail(c, baseConfig({ fetch }), emailId);
    expect(result).toMatchObject({
      delivered: false,
      reason: "PERMANENT",
      error: "Resend response missing id"
    });
    expect(c.rows[0].status).toBe("failed");
  });

  it("404 for unknown email id", async () => {
    const c = makeFakeClient();
    await expect(
      sendQueuedEmail(c, baseConfig(), "00000000-0000-0000-0000-000000000999")
    ).rejects.toMatchObject({ code: "EMAIL_NOT_FOUND", statusCode: 404 });
  });
});

describe("flushOutbox", () => {
  it("processes only pending rows up to limit", async () => {
    const c = makeFakeClient();
    for (let i = 0; i < 3; i += 1) {
      await enqueueEmail(c, { to: `a${i}@b.co`, subject: "x", html: "<p>x</p>" });
    }
    let n = 0;
    const fetch = makeHttp(() => ({ status: 200, body: { id: `msg_${n++}` } }));
    const result = await flushOutbox(c, baseConfig({ fetch }), 2);
    expect(result).toEqual({ attempted: 2, sent: 2, failed: 0, retryable: 0 });
    expect(c.rows.filter((r) => r.status === "sent")).toHaveLength(2);
    expect(c.rows.filter((r) => r.status === "pending")).toHaveLength(1);
  });

  it("classifies mixed results", async () => {
    const c = makeFakeClient();
    await enqueueEmail(c, { to: "ok@b.co", subject: "x", html: "<p>x</p>" });
    await enqueueEmail(c, { to: "bad@b.co", subject: "x", html: "<p>x</p>" });
    await enqueueEmail(c, { to: "boom@b.co", subject: "x", html: "<p>x</p>" });
    const fetch = makeHttp((_url, init) => {
      const body = JSON.parse(init.body);
      const to = body.to[0];
      if (to === "ok@b.co") return { status: 200, body: { id: "msg_ok" } };
      if (to === "bad@b.co") return { status: 422, body: { message: "Bad" } };
      return { status: 500, body: { message: "Boom" } };
    });
    const result = await flushOutbox(c, baseConfig({ fetch }), 10);
    expect(result).toEqual({ attempted: 3, sent: 1, failed: 1, retryable: 1 });
  });
});

describe("applyEmailWebhook", () => {
  it("delivered event → sent (forward transition)", async () => {
    const c = makeFakeClient();
    const { emailId } = await enqueueEmail(c, {
      to: "a@b.co",
      subject: "x",
      html: "<p>x</p>"
    });
    c.rows[0].provider_message_id = "msg_xyz";
    c.rows[0].status = "pending";
    const r = await applyEmailWebhook(c, {
      type: "email.delivered",
      data: { email_id: "msg_xyz" }
    });
    expect(r).toEqual({ updated: true, emailId, status: "sent" });
    expect(c.rows[0].status).toBe("sent");
  });

  it("bounced event → bounced", async () => {
    const c = makeFakeClient();
    const { emailId } = await enqueueEmail(c, {
      to: "a@b.co",
      subject: "x",
      html: "<p>x</p>"
    });
    c.rows[0].provider_message_id = "msg_xyz";
    const r = await applyEmailWebhook(c, {
      type: "email.bounced",
      data: { email_id: "msg_xyz" }
    });
    expect(r).toEqual({ updated: true, emailId, status: "bounced" });
    expect(c.rows[0].status).toBe("bounced");
  });

  it("does NOT regress bounced → sent on out-of-order delivery event", async () => {
    const c = makeFakeClient();
    await enqueueEmail(c, { to: "a@b.co", subject: "x", html: "<p>x</p>" });
    c.rows[0].provider_message_id = "msg_xyz";
    c.rows[0].status = "bounced";
    const r = await applyEmailWebhook(c, {
      type: "email.delivered",
      data: { email_id: "msg_xyz" }
    });
    expect(r.updated).toBe(true);
    expect(c.rows[0].status).toBe("bounced"); // unchanged
  });

  it("unknown email_id → no-op (returns updated:false)", async () => {
    const c = makeFakeClient();
    const r = await applyEmailWebhook(c, {
      type: "email.delivered",
      data: { email_id: "msg_unknown" }
    });
    expect(r).toEqual({ updated: false });
  });

  it("missing email_id → no-op", async () => {
    const c = makeFakeClient();
    const r = await applyEmailWebhook(c, { type: "email.delivered", data: {} });
    expect(r).toEqual({ updated: false });
  });

  it("unknown event type → no-op (does not corrupt status)", async () => {
    const c = makeFakeClient();
    await enqueueEmail(c, { to: "a@b.co", subject: "x", html: "<p>x</p>" });
    c.rows[0].provider_message_id = "msg_xyz";
    c.rows[0].status = "sent";
    const r = await applyEmailWebhook(c, {
      type: "email.something_unknown",
      data: { email_id: "msg_xyz" }
    });
    expect(r).toEqual({ updated: false });
    expect(c.rows[0].status).toBe("sent");
  });

  it("does NOT regress sent → pending on delayed-delivery event (would cause duplicate send)", async () => {
    // Real-world scenario: email.delivered arrives first and the row
    // is set to `sent`. A delayed `email.delivery_delayed` for the
    // same message arrives later. The SQL guard must keep the row at
    // `sent`, otherwise flushOutbox would re-send the email.
    const c = makeFakeClient();
    await enqueueEmail(c, { to: "a@b.co", subject: "x", html: "<p>x</p>" });
    c.rows[0].provider_message_id = "msg_xyz";
    c.rows[0].status = "sent";
    const r = await applyEmailWebhook(c, {
      type: "email.delivery_delayed",
      data: { email_id: "msg_xyz" }
    });
    expect(r.updated).toBe(true); // we ran the UPDATE — guard handled inside SQL
    expect(c.rows[0].status).toBe("sent"); // but the row didn't actually change
  });
});
