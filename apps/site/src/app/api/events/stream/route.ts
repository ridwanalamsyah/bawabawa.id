/**
 * Server-Sent Events stream — pushes mock realtime events to clients.
 * Replace with WebSocket gateway (Socket.IO / uWebSockets) in production.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let n = 0;
      const messages = [
        { event: "order.created", code: "BWB-NEW001" },
        { event: "shipment.update", code: "BWB-AX42K1", status: "in_transit" },
        { event: "trip.update", code: "BDG-SMD-241", bookedKg: 47 },
        { event: "payment.confirmed", invoice: "INV-2025-0042" },
      ];
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      send({ event: "connected", at: new Date().toISOString() });

      const interval = setInterval(() => {
        const m = messages[n % messages.length];
        send({ ...m, at: new Date().toISOString(), seq: n });
        n++;
        if (n > 24) {
          clearInterval(interval);
          controller.close();
        }
      }, 2500);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
