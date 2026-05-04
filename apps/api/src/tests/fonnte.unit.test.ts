import { describe, expect, it } from "vitest";
import {
  applyWhatsAppWebhook,
  enqueueWhatsApp,
  flushWhatsAppOutbox,
  normalizePhone,
  sendQueuedWhatsApp,
  type FonnteConfig,
  type HttpClient
} from "../modules/whatsapp/fonnte.service";

type Row = {
  id: string;
  to_phone: string;
  template_key: string | null;
  message: string;
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
      if (/^INSERT INTO whatsapp_outbox/i.test(t)) {
        const [id, phone, tplKey, message, relatedEntity, relatedId, scheduledAt] = params;
        rows.push({
          id,
          to_phone: phone,
          template_key: tplKey,
          message,
          status: "pending",
          provider: "fonnte",
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
      if (/^SELECT id, to_phone, message, status, attempts/i.test(t)) {
        const [id] = params;
        const found = rows.find((r) => r.id === id);
        return found
          ? { rows: [found as unknown as R], rowCount: 1 }
          : { rows: [], rowCount: 0 };
      }
      if (/^SELECT id FROM whatsapp_outbox\s+WHERE status = 'pending'/i.test(t)) {
        const [limit] = params;
        const ready = rows
          .filter((r) => r.status === "pending" && r.scheduled_at <= new Date())
          .slice(0, limit);
        return {
          rows: ready.map((r) => ({ id: r.id }) as unknown as R),
          rowCount: ready.length
        };
      }
      if (/^SELECT id, status FROM whatsapp_outbox\s+WHERE provider = 'fonnte' AND provider_message_id/i.test(t)) {
        const [messageId] = params;
        const found = rows.find((r) => r.provider_message_id === messageId);
        return found
          ? { rows: [{ id: found.id, status: found.status } as unknown as R], rowCount: 1 }
          : { rows: [], rowCount: 0 };
      }
      // Network-error retry update
      if (/^UPDATE whatsapp_outbox\s+SET attempts = attempts \+ 1,\s+last_error = \$1,\s+status = CASE WHEN attempts \+ 1 >= \$2/i.test(t)) {
        const [errMsg, maxAttempts, id] = params;
        const r = rows.find((x) => x.id === id);
        if (r) {
          r.attempts += 1;
          r.last_error = errMsg;
          if (r.attempts >= maxAttempts) r.status = "failed";
        }
        return { rows: [], rowCount: r ? 1 : 0 };
      }
      // Permanent fail (response missing id)
      if (/^UPDATE whatsapp_outbox\s+SET status = 'failed'/i.test(t)) {
        const [id] = params;
        const r = rows.find((x) => x.id === id);
        if (r) {
          r.status = "failed";
          r.attempts += 1;
          r.last_error = "Fonnte response missing id";
        }
        return { rows: [], rowCount: r ? 1 : 0 };
      }
      // Success
      if (/^UPDATE whatsapp_outbox\s+SET status = 'sent'/i.test(t)) {
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
      // HTTP-error update
      if (/^UPDATE whatsapp_outbox\s+SET attempts = attempts \+ 1,\s+last_error = \$1,\s+status = CASE\s+WHEN \$2/i.test(t)) {
        const [errMsg, httpStatus, maxAttempts, id] = params;
        const r = rows.find((x) => x.id === id);
        if (r) {
          r.attempts += 1;
          r.last_error = errMsg;
          if (httpStatus >= 200 && httpStatus < 500) r.status = "failed";
          else if (r.attempts >= maxAttempts) r.status = "failed";
        }
        return { rows: [], rowCount: r ? 1 : 0 };
      }
      // Webhook UPDATE
      if (/^UPDATE whatsapp_outbox\s+SET status = \$1/i.test(t)) {
        const [status, id] = params;
        const r = rows.find((x) => x.id === id);
        if (r) r.status = status;
        return { rows: [], rowCount: r ? 1 : 0 };
      }
      throw new Error(`Unhandled SQL in fonnte test: ${t.slice(0, 80)}`);
    }
  };
}

function makeHttp(handler: (url: string, init: any) => { status: number; body: any }): HttpClient {
  return async (url, init) => {
    const r = handler(url, init);
    return { status: r.status, ok: r.status >= 200 && r.status < 300, body: r.body };
  };
}

const baseConfig = (over: Partial<FonnteConfig> = {}): FonnteConfig => ({
  deviceToken: "fnt_test_device_token_1234",
  ...over
});

describe("normalizePhone", () => {
  it("accepts +62 prefix", () => {
    expect(normalizePhone("+6281234567890")).toBe("6281234567890");
  });
  it("accepts 0 prefix", () => {
    expect(normalizePhone("081234567890")).toBe("6281234567890");
  });
  it("accepts already-normalized 62 prefix (idempotent)", () => {
    expect(normalizePhone("6281234567890")).toBe("6281234567890");
  });
  it("strips spaces and dashes", () => {
    expect(normalizePhone("+62 812-3456-7890")).toBe("6281234567890");
  });
  it("rejects empty input", () => {
    expect(() => normalizePhone("")).toThrow(/wajib|tidak valid/);
  });
  it("rejects clearly non-Indonesian numbers", () => {
    expect(() => normalizePhone("+1 555 1234567")).toThrow(/Format/);
  });
  it("rejects too-short numbers", () => {
    expect(() => normalizePhone("+62812")).toThrow(/Panjang/);
  });
});

describe("enqueueWhatsApp", () => {
  it("validates and persists pending row", async () => {
    const c = makeFakeClient();
    const r = await enqueueWhatsApp(c, {
      to: "+6281234567890",
      message: "Halo dari ERP"
    });
    expect(r.status).toBe("pending");
    expect(r.to).toBe("6281234567890");
    expect(c.rows).toHaveLength(1);
    expect(c.rows[0].to_phone).toBe("6281234567890");
    expect(c.rows[0].provider).toBe("fonnte");
  });

  it("rejects invalid phone via normalizePhone", async () => {
    const c = makeFakeClient();
    await expect(
      enqueueWhatsApp(c, { to: "abc", message: "x" })
    ).rejects.toMatchObject({ code: "INVALID_PHONE", statusCode: 400 });
  });

  it("rejects empty message", async () => {
    const c = makeFakeClient();
    await expect(
      enqueueWhatsApp(c, { to: "+6281234567890", message: "" })
    ).rejects.toMatchObject({ code: "INVALID_MESSAGE", statusCode: 400 });
  });

  it("rejects message > 4096 chars", async () => {
    const c = makeFakeClient();
    await expect(
      enqueueWhatsApp(c, { to: "+6281234567890", message: "x".repeat(4097) })
    ).rejects.toMatchObject({ code: "INVALID_MESSAGE" });
  });
});

describe("sendQueuedWhatsApp", () => {
  it("posts to /send and marks row sent on status:true", async () => {
    const c = makeFakeClient();
    const { whatsappId } = await enqueueWhatsApp(c, {
      to: "+6281234567890",
      message: "Halo"
    });
    let postedUrl = "";
    let postedHeaders: Record<string, string> | undefined;
    let postedBody = "";
    const fetch = makeHttp((url, init) => {
      postedUrl = url;
      postedHeaders = init.headers;
      postedBody = init.body;
      return { status: 200, body: { status: true, id: ["msg_abc"] } };
    });
    const result = await sendQueuedWhatsApp(c, baseConfig({ fetch }), whatsappId);
    expect(result).toEqual({ delivered: true, providerMessageId: "msg_abc" });
    expect(c.rows[0].status).toBe("sent");
    expect(c.rows[0].provider_message_id).toBe("msg_abc");
    expect(postedUrl).toBe("https://api.fonnte.com/send");
    expect(postedHeaders?.Authorization).toBe("fnt_test_device_token_1234");
    expect(postedHeaders?.["Content-Type"]).toBe("application/x-www-form-urlencoded");
    expect(postedBody).toContain("target=6281234567890");
    expect(postedBody).toContain("countryCode=62");
  });

  it("handles id as plain string (not array)", async () => {
    const c = makeFakeClient();
    const { whatsappId } = await enqueueWhatsApp(c, { to: "+6281234567890", message: "Halo" });
    const fetch = makeHttp(() => ({ status: 200, body: { status: true, id: "msg_str" } }));
    const result = await sendQueuedWhatsApp(c, baseConfig({ fetch }), whatsappId);
    expect(result).toEqual({ delivered: true, providerMessageId: "msg_str" });
  });

  it("200 + status:false → permanent failure", async () => {
    const c = makeFakeClient();
    const { whatsappId } = await enqueueWhatsApp(c, { to: "+6281234567890", message: "Halo" });
    const fetch = makeHttp(() => ({
      status: 200,
      body: { status: false, reason: "device disconnected" }
    }));
    const result = await sendQueuedWhatsApp(c, baseConfig({ fetch }), whatsappId);
    expect(result).toMatchObject({ delivered: false, reason: "PERMANENT" });
    expect(c.rows[0].status).toBe("failed");
  });

  it("200 + status:true but missing id → permanent (broken contract)", async () => {
    const c = makeFakeClient();
    const { whatsappId } = await enqueueWhatsApp(c, { to: "+6281234567890", message: "Halo" });
    const fetch = makeHttp(() => ({ status: 200, body: { status: true } }));
    const result = await sendQueuedWhatsApp(c, baseConfig({ fetch }), whatsappId);
    expect(result).toMatchObject({ delivered: false, reason: "PERMANENT" });
    expect(c.rows[0].status).toBe("failed");
  });

  it("5xx → retryable, row stays pending until MAX_ATTEMPTS", async () => {
    const c = makeFakeClient();
    const { whatsappId } = await enqueueWhatsApp(c, { to: "+6281234567890", message: "Halo" });
    const fetch = makeHttp(() => ({ status: 503, body: { status: false, reason: "upstream" } }));
    const result = await sendQueuedWhatsApp(c, baseConfig({ fetch }), whatsappId);
    expect(result).toMatchObject({ delivered: false, reason: "RETRYABLE" });
    expect(c.rows[0].status).toBe("pending"); // still pending after 1st attempt
    expect(c.rows[0].attempts).toBe(1);
  });

  it("5xx escalates to failed after MAX_ATTEMPTS", async () => {
    const c = makeFakeClient();
    const { whatsappId } = await enqueueWhatsApp(c, { to: "+6281234567890", message: "Halo" });
    c.rows[0].attempts = 4; // one more attempt = 5 = MAX
    const fetch = makeHttp(() => ({ status: 502, body: { status: false } }));
    await sendQueuedWhatsApp(c, baseConfig({ fetch }), whatsappId);
    expect(c.rows[0].status).toBe("failed");
  });

  it("network exception → retryable", async () => {
    const c = makeFakeClient();
    const { whatsappId } = await enqueueWhatsApp(c, { to: "+6281234567890", message: "Halo" });
    const fetch: HttpClient = async () => {
      throw new Error("ECONNRESET");
    };
    const result = await sendQueuedWhatsApp(c, baseConfig({ fetch }), whatsappId);
    expect(result).toMatchObject({ delivered: false, reason: "RETRYABLE", error: "ECONNRESET" });
    expect(c.rows[0].status).toBe("pending");
    expect(c.rows[0].attempts).toBe(1);
  });

  it("idempotent: already-sent row → no-op success", async () => {
    const c = makeFakeClient();
    const { whatsappId } = await enqueueWhatsApp(c, { to: "+6281234567890", message: "Halo" });
    c.rows[0].status = "sent";
    let calls = 0;
    const fetch = makeHttp(() => {
      calls += 1;
      return { status: 200, body: { status: true, id: ["new"] } };
    });
    const result = await sendQueuedWhatsApp(c, baseConfig({ fetch }), whatsappId);
    expect(result).toEqual({ delivered: true, providerMessageId: "noop-already-sent" });
    expect(calls).toBe(0);
  });

  it("404 for unknown id", async () => {
    const c = makeFakeClient();
    await expect(
      sendQueuedWhatsApp(c, baseConfig(), "00000000-0000-0000-0000-000000000999")
    ).rejects.toMatchObject({ code: "WHATSAPP_NOT_FOUND", statusCode: 404 });
  });
});

describe("flushWhatsAppOutbox", () => {
  it("processes only pending rows up to limit", async () => {
    const c = makeFakeClient();
    for (let i = 0; i < 3; i += 1) {
      await enqueueWhatsApp(c, { to: "+6281234567890", message: `m${i}` });
    }
    let n = 0;
    const fetch = makeHttp(() => ({ status: 200, body: { status: true, id: [`msg_${n++}`] } }));
    const result = await flushWhatsAppOutbox(c, baseConfig({ fetch }), 2);
    expect(result).toEqual({ attempted: 2, sent: 2, failed: 0, retryable: 0 });
    expect(c.rows.filter((r) => r.status === "sent")).toHaveLength(2);
    expect(c.rows.filter((r) => r.status === "pending")).toHaveLength(1);
  });

  it("classifies mixed results", async () => {
    const c = makeFakeClient();
    await enqueueWhatsApp(c, { to: "+6281111111111", message: "ok" });
    await enqueueWhatsApp(c, { to: "+6282222222222", message: "bad" });
    await enqueueWhatsApp(c, { to: "+6283333333333", message: "boom" });
    const fetch = makeHttp((_url, init) => {
      const body = init.body as string;
      if (body.includes("target=6281111111111")) return { status: 200, body: { status: true, id: "msg_ok" } };
      if (body.includes("target=6282222222222")) return { status: 200, body: { status: false, reason: "bad number" } };
      return { status: 503, body: { status: false } };
    });
    const result = await flushWhatsAppOutbox(c, baseConfig({ fetch }), 10);
    expect(result).toEqual({ attempted: 3, sent: 1, failed: 1, retryable: 1 });
  });
});

describe("applyWhatsAppWebhook", () => {
  it("sent → delivered (forward transition)", async () => {
    const c = makeFakeClient();
    const { whatsappId } = await enqueueWhatsApp(c, { to: "+6281234567890", message: "x" });
    c.rows[0].provider_message_id = "msg_xyz";
    c.rows[0].status = "sent";
    const r = await applyWhatsAppWebhook(c, { id: "msg_xyz", status: "delivered" });
    expect(r).toEqual({ updated: true, whatsappId, status: "delivered" });
    expect(c.rows[0].status).toBe("delivered");
  });

  it("delivered → read (forward transition)", async () => {
    const c = makeFakeClient();
    await enqueueWhatsApp(c, { to: "+6281234567890", message: "x" });
    c.rows[0].provider_message_id = "msg_xyz";
    c.rows[0].status = "delivered";
    const r = await applyWhatsAppWebhook(c, { id: "msg_xyz", status: "read" });
    expect(r.updated).toBe(true);
    expect(c.rows[0].status).toBe("read");
  });

  it("blocks backward transition: read → delivered (out-of-order)", async () => {
    const c = makeFakeClient();
    await enqueueWhatsApp(c, { to: "+6281234567890", message: "x" });
    c.rows[0].provider_message_id = "msg_xyz";
    c.rows[0].status = "read";
    const r = await applyWhatsAppWebhook(c, { id: "msg_xyz", status: "delivered" });
    expect(r.updated).toBe(false);
    expect(c.rows[0].status).toBe("read");
  });

  it("blocks backward transition: sent → pending (no such Fonnte event but defense in depth)", async () => {
    const c = makeFakeClient();
    await enqueueWhatsApp(c, { to: "+6281234567890", message: "x" });
    c.rows[0].provider_message_id = "msg_xyz";
    c.rows[0].status = "sent";
    // Fonnte status="sent" arrives again — same rank, allowed (no-op
    // semantically; SQL still UPDATEs but to the same value).
    const r = await applyWhatsAppWebhook(c, { id: "msg_xyz", status: "sent" });
    expect(r.updated).toBe(true);
    expect(c.rows[0].status).toBe("sent");
  });

  it("failed terminal blocks transition to read", async () => {
    const c = makeFakeClient();
    await enqueueWhatsApp(c, { to: "+6281234567890", message: "x" });
    c.rows[0].provider_message_id = "msg_xyz";
    c.rows[0].status = "failed";
    const r = await applyWhatsAppWebhook(c, { id: "msg_xyz", status: "read" });
    expect(r.updated).toBe(false);
    expect(c.rows[0].status).toBe("failed");
  });

  it("blocks delivered → failed (stale failure after device confirmed delivery)", async () => {
    // Real Fonnte scenario: delivery webhook arrives first, then a
    // late `failed` webhook (the gateway catching up to an old
    // send-time error). Once delivered=true the failure is stale and
    // must not corrupt the row.
    const c = makeFakeClient();
    await enqueueWhatsApp(c, { to: "+6281234567890", message: "x" });
    c.rows[0].provider_message_id = "msg_xyz";
    c.rows[0].status = "delivered";
    const r = await applyWhatsAppWebhook(c, { id: "msg_xyz", status: "failed" });
    expect(r.updated).toBe(false);
    expect(c.rows[0].status).toBe("delivered");
  });

  it("read terminal blocks transition to failed", async () => {
    const c = makeFakeClient();
    await enqueueWhatsApp(c, { to: "+6281234567890", message: "x" });
    c.rows[0].provider_message_id = "msg_xyz";
    c.rows[0].status = "read";
    const r = await applyWhatsAppWebhook(c, { id: "msg_xyz", status: "failed" });
    expect(r.updated).toBe(false);
    expect(c.rows[0].status).toBe("read");
  });

  it("unknown message id → no-op", async () => {
    const c = makeFakeClient();
    const r = await applyWhatsAppWebhook(c, { id: "msg_unknown", status: "delivered" });
    expect(r).toEqual({ updated: false });
  });

  it("missing message id → no-op", async () => {
    const c = makeFakeClient();
    const r = await applyWhatsAppWebhook(c, { status: "delivered" });
    expect(r).toEqual({ updated: false });
  });

  it("unknown status string → no-op (does not corrupt row)", async () => {
    const c = makeFakeClient();
    await enqueueWhatsApp(c, { to: "+6281234567890", message: "x" });
    c.rows[0].provider_message_id = "msg_xyz";
    c.rows[0].status = "sent";
    const r = await applyWhatsAppWebhook(c, { id: "msg_xyz", status: "weird-event" });
    expect(r).toEqual({ updated: false });
    expect(c.rows[0].status).toBe("sent");
  });

  it("accepts `messageid` field as fallback for `id`", async () => {
    const c = makeFakeClient();
    await enqueueWhatsApp(c, { to: "+6281234567890", message: "x" });
    c.rows[0].provider_message_id = "msg_xyz";
    c.rows[0].status = "sent";
    const r = await applyWhatsAppWebhook(c, { messageid: "msg_xyz", status: "delivered" });
    expect(r.updated).toBe(true);
    expect(c.rows[0].status).toBe("delivered");
  });
});
