import { NextResponse } from "next/server";

/**
 * Client error beacon endpoint. ErrorReporter posts uncaught errors and
 * unhandled promise rejections here via `navigator.sendBeacon`.
 *
 * Currently logs to stdout so Render / Vercel logs capture them; replace
 * with a Sentry transport when SENTRY_DSN is set.
 */

export const runtime = "nodejs";

const SENTRY_DSN = process.env.SENTRY_DSN;

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const payload = raw ? JSON.parse(raw) : null;
    if (!payload) return new NextResponse(null, { status: 204 });

    console.error("[client-error]", JSON.stringify(payload));

    if (SENTRY_DSN) {
      // Best-effort fan-out to Sentry. We deliberately avoid the heavy
      // @sentry/nextjs SDK to keep the bundle small; this is just an
      // HTTP envelope POST.
      const dsn = new URL(SENTRY_DSN);
      const projectId = dsn.pathname.replace(/^\//, "");
      const key = dsn.username;
      const event = {
        platform: "javascript",
        timestamp: payload.ts ?? new Date().toISOString(),
        level: payload.type === "error" ? "error" : "warning",
        message: { formatted: payload.message ?? "client error" },
        request: { url: payload.path },
        tags: { source: "bawabawa-site" },
        extra: payload,
      };
      const envelope =
        JSON.stringify({ event_id: crypto.randomUUID().replace(/-/g, ""), sent_at: new Date().toISOString() }) +
        "\n" +
        JSON.stringify({ type: "event" }) +
        "\n" +
        JSON.stringify(event);
      fetch(
        `${dsn.protocol}//${dsn.host}/api/${projectId}/envelope/?sentry_key=${key}&sentry_version=7`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-sentry-envelope" },
          body: envelope,
        }
      ).catch(() => {});
    }
  } catch {
    // never error on analytics
  }
  return new NextResponse(null, { status: 204 });
}
