import { NextResponse } from "next/server";

/**
 * Web Vitals beacon endpoint. The client posts CWV metrics via `navigator.sendBeacon`.
 * Keep this lightweight — the goal is to never block the page. We log to stdout
 * so the deployment platform (Render/Vercel) can capture them; a real
 * implementation could forward to Datadog, GA4, or Plausible.
 */

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const metric = raw ? JSON.parse(raw) : null;
    if (process.env.NODE_ENV === "production") {
      console.log("[web-vitals]", JSON.stringify(metric));
    }
  } catch {
    // never error on analytics
  }
  return new NextResponse(null, { status: 204 });
}
