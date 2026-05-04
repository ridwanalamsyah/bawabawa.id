import { createHmac } from "crypto";
import { describe, it, expect } from "vitest";
import { verifyResendSignature } from "../modules/email/resend.routes";

// 32-byte secret base64-encoded → matches the format of `whsec_...` from
// Resend / Svix.
const SECRET_BYTES = Buffer.from(
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "utf8"
);
const WHSEC = `whsec_${SECRET_BYTES.toString("base64")}`;

function sign(svixId: string, ts: string, body: string): string {
  return createHmac("sha256", SECRET_BYTES)
    .update(`${svixId}.${ts}.${body}`)
    .digest("base64");
}

function nowSec(): string {
  return String(Math.floor(Date.now() / 1000));
}

describe("verifyResendSignature", () => {
  it("accepts a valid signature", () => {
    const id = "msg_1";
    const ts = nowSec();
    const body = JSON.stringify({ type: "email.delivered" });
    const sig = sign(id, ts, body);
    const ok = verifyResendSignature(
      body,
      {
        "svix-id": id,
        "svix-timestamp": ts,
        "svix-signature": `v1,${sig}`
      },
      WHSEC
    );
    expect(ok).toBe(true);
  });

  it("accepts when whsec_ prefix is omitted (raw base64 also works)", () => {
    const id = "msg_2";
    const ts = nowSec();
    const body = "{}";
    const sig = sign(id, ts, body);
    const ok = verifyResendSignature(
      body,
      { "svix-id": id, "svix-timestamp": ts, "svix-signature": `v1,${sig}` },
      SECRET_BYTES.toString("base64")
    );
    expect(ok).toBe(true);
  });

  it("rejects when signature is wrong", () => {
    const id = "msg_3";
    const ts = nowSec();
    const body = "{}";
    // Sign different body but present this signature
    const wrong = sign(id, ts, "different body");
    const ok = verifyResendSignature(
      body,
      { "svix-id": id, "svix-timestamp": ts, "svix-signature": `v1,${wrong}` },
      WHSEC
    );
    expect(ok).toBe(false);
  });

  it("rejects when timestamp is older than 5 minutes (replay)", () => {
    const id = "msg_4";
    const oldTs = String(Math.floor(Date.now() / 1000) - 6 * 60);
    const body = "{}";
    const sig = sign(id, oldTs, body);
    const ok = verifyResendSignature(
      body,
      { "svix-id": id, "svix-timestamp": oldTs, "svix-signature": `v1,${sig}` },
      WHSEC
    );
    expect(ok).toBe(false);
  });

  it("rejects when any required header is missing", () => {
    const id = "msg_5";
    const ts = nowSec();
    const body = "{}";
    const sig = sign(id, ts, body);
    expect(
      verifyResendSignature(
        body,
        { "svix-id": undefined, "svix-timestamp": ts, "svix-signature": `v1,${sig}` },
        WHSEC
      )
    ).toBe(false);
    expect(
      verifyResendSignature(
        body,
        { "svix-id": id, "svix-timestamp": undefined, "svix-signature": `v1,${sig}` },
        WHSEC
      )
    ).toBe(false);
    expect(
      verifyResendSignature(
        body,
        { "svix-id": id, "svix-timestamp": ts, "svix-signature": undefined },
        WHSEC
      )
    ).toBe(false);
  });

  it("accepts when one of multiple presented signatures is valid (key rotation)", () => {
    // Svix supports multiple `v1,...` entries during key rotation. The
    // receiver should pass if ANY of them matches.
    const id = "msg_6";
    const ts = nowSec();
    const body = "{}";
    const good = sign(id, ts, body);
    const garbage = "AAAA";
    const ok = verifyResendSignature(
      body,
      {
        "svix-id": id,
        "svix-timestamp": ts,
        "svix-signature": `v1,${garbage} v1,${good}`
      },
      WHSEC
    );
    expect(ok).toBe(true);
  });

  it("rejects malformed timestamp", () => {
    expect(
      verifyResendSignature(
        "{}",
        { "svix-id": "x", "svix-timestamp": "not-a-number", "svix-signature": "v1,abc" },
        WHSEC
      )
    ).toBe(false);
  });
});
