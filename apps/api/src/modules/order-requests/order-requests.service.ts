import { randomBytes, randomUUID } from "node:crypto";
import { AppError } from "../../common/errors/app-error";
import { getPool } from "../../infrastructure/db/pool";
import { withTransaction } from "../../infrastructure/db/transaction-manager";
import { loadEnv } from "../../config/env";
import { enqueueWhatsApp, normalizePhone, sendQueuedWhatsApp } from "../whatsapp/fonnte.service";
import { reviewStateForToken } from "./reviews";
import { claimVoucher, loadVoucher, releaseVoucher, voucherDiscount, type VoucherSnapshot } from "./order-vouchers";
import {
  KILAT_BLOCKED_CATEGORIES,
  computePricing,
  kilatConfig,
  type PricingBreakdown,
  type TierId
} from "./pricing";

type QueryClient = {
  query: <Row = any>(sql: string, params?: any[]) => Promise<{ rows: Row[]; rowCount: number }>;
};

export const ORDER_REQUEST_STATUSES = [
  "submitted",
  "quoted",
  "approved",
  "paid",
  "purchasing",
  "packed",
  "shipped",
  "delivered",
  "cancelled"
] as const;
export type OrderRequestStatus = (typeof ORDER_REQUEST_STATUSES)[number];

export const STATUS_LABELS: Record<OrderRequestStatus, string> = {
  submitted: "Menunggu pengecekan tim",
  quoted: "Penawaran harga siap — menunggu persetujuanmu",
  approved: "Menunggu pembayaran",
  paid: "Pembayaran diterima",
  purchasing: "Sedang dibelikan",
  packed: "Ditimbang & dikemas",
  shipped: "Dalam pengiriman",
  delivered: "Sudah diterima",
  cancelled: "Dibatalkan"
};

/** Team-driven transitions (admin). Customer actions are approve/cancel. */
const ADMIN_TRANSITIONS: Record<OrderRequestStatus, OrderRequestStatus[]> = {
  submitted: ["quoted", "cancelled"],
  quoted: ["quoted", "approved", "cancelled"],
  approved: ["paid", "cancelled"],
  paid: ["purchasing", "cancelled"],
  purchasing: ["packed", "cancelled"],
  packed: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: []
};

export type RequestItemInput = {
  name: string;
  link?: string;
  category?: string;
  qty: number;
  maxPrice?: number;
  variant?: string;
  notes?: string;
  imageUrl?: string;
  productId?: string;
};

export type CreateOrderRequestInput = {
  source: "request" | "catalog";
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: { street: string; city: string; postal: string; notes?: string };
  tier: TierId;
  tripId?: string | null;
  items: RequestItemInput[];
  outOfStockPreference: "cancel" | "substitute" | "ask";
  customerNotes?: string;
  estimatedKg?: number;
  deliveryMethod?: "delivery" | "pickup";
  userId?: string | null;
  voucherCode?: string;
};

type Row = {
  id: string;
  code: string;
  tracking_token: string;
  source: string;
  status: OrderRequestStatus;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  address: any;
  tier: TierId;
  trip_id: string | null;
  items: any;
  out_of_stock_preference: string;
  customer_notes: string | null;
  estimate: any;
  quote: any;
  quote_note: string | null;
  payment_method: string | null;
  tracking_number: string | null;
  history: any;
  created_at: string;
  updated_at: string;
  delivery_method: string | null;
  voucher: any;
};

const COLUMNS = `id, code, tracking_token, source, status, user_id, customer_name, customer_phone,
  customer_email, address, tier, trip_id, items, out_of_stock_preference, customer_notes,
  estimate, quote, quote_note, payment_method, tracking_number, history, created_at, updated_at,
  delivery_method, voucher`;

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function newCode(): string {
  // Crockford-ish alphabet: no 0/O/1/I so codes read cleanly over the phone.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `BWB-${out}`;
}

function newTrackingToken(): string {
  return randomBytes(24).toString("base64url");
}

function maskPhone(phone: string): string {
  return phone.length <= 6 ? phone : `${phone.slice(0, 4)}••••${phone.slice(-3)}`;
}

function historyEntry(status: OrderRequestStatus, note?: string | null, actor?: string | null) {
  return { status, at: new Date().toISOString(), note: note ?? null, actor: actor ?? null };
}

/**
 * Catalog items are re-priced from the products table so the client can't
 * pick its own price; free-form request items are estimated from the
 * customer's maximum budget.
 */
async function priceItems(qc: QueryClient, input: CreateOrderRequestInput) {
  const items: Array<RequestItemInput & { unitPrice?: number; weightKg?: number }> = [];
  let itemsTotal = 0;
  let weightKg = 0;

  if (input.source === "catalog") {
    const ids = input.items.map((item) => item.productId).filter(Boolean) as string[];
    if (ids.length !== input.items.length) {
      throw new AppError(422, "INVALID_CATALOG_ITEM", "Item katalog tidak valid");
    }
    const { rows } = await qc.query<{
      id: string;
      name: string;
      unit_price: string;
      weight_kg: string | null;
      image_url: string | null;
    }>(
      `SELECT id, name, unit_price, weight_kg, image_url
         FROM products
        WHERE id = ANY($1::uuid[]) AND is_catalog = TRUE`,
      [ids]
    );
    const byId = new Map(rows.map((row) => [row.id, row]));
    for (const item of input.items) {
      const product = byId.get(String(item.productId));
      if (!product) {
        throw new AppError(422, "CATALOG_ITEM_UNAVAILABLE", "Ada produk katalog yang sudah tidak tersedia");
      }
      const unitPrice = Number(product.unit_price);
      const perKg = Number(product.weight_kg ?? 0.5);
      itemsTotal += unitPrice * item.qty;
      weightKg += perKg * item.qty;
      items.push({
        ...item,
        name: product.name,
        imageUrl: item.imageUrl ?? product.image_url ?? undefined,
        unitPrice,
        weightKg: perKg
      });
    }
  } else {
    for (const item of input.items) {
      itemsTotal += (item.maxPrice ?? 0) * item.qty;
      items.push({ ...item });
    }
    weightKg = input.estimatedKg ?? input.items.reduce((sum, item) => sum + 0.5 * item.qty, 0);
  }

  const estimate = computePricing({ itemsTotal, totalKg: weightKg, tier: input.tier });
  return { items, estimate, weightKg };
}

export async function notifyWhatsApp(to: string | undefined | null, message: string, relatedId?: string) {
  const env = loadEnv();
  if (!env.FONNTE_DEVICE_TOKEN || !to) return;
  try {
    const { whatsappId } = await withTransaction((qc) =>
      enqueueWhatsApp(qc, { to, message, templateKey: "order_request", relatedEntity: "order_request", relatedId })
    );
    await withTransaction((qc) =>
      sendQueuedWhatsApp(qc, { deviceToken: env.FONNTE_DEVICE_TOKEN!, baseUrl: env.FONNTE_BASE_URL }, whatsappId)
    );
  } catch (error) {
    // Notifications are best-effort: the order itself is already saved and
    // pending outbox rows are retried by /whatsapp/fonnte/flush.
    console.error("[order-requests] WhatsApp notify failed", error);
  }
}

function siteUrl(): string {
  return (process.env.PUBLIC_SITE_URL ?? "https://bawabawa.id").replace(/\/$/, "");
}

function rupiah(value: number): string {
  return `Rp${Math.round(value).toLocaleString("id-ID")}`;
}

export async function createOrderRequest(input: CreateOrderRequestInput) {
  const phone = normalizePhone(input.customerPhone);
  const result = await withTransaction(async (qc) => {
    if (input.tier === "air") {
      if (!kilatConfig()) {
        throw new AppError(422, "KILAT_UNAVAILABLE", "Layanan Kilat belum tersedia. Pilih Reguler atau Kargo.");
      }
      const blocked = input.items.find((item) => item.category && KILAT_BLOCKED_CATEGORIES.includes(item.category));
      if (blocked) {
        throw new AppError(
          422,
          "KILAT_RESTRICTED_ITEM",
          `${blocked.name} (${blocked.category}) tidak bisa dikirim lewat udara karena baterai lithium. Pilih Reguler atau Kargo.`
        );
      }
    }
    if (input.tier === "batch" && input.tripId) {
      const trip = await qc.query<{ id: string; po_closes_at: string | null }>(
        `SELECT id, po_closes_at FROM trips WHERE id = $1 AND is_published = TRUE AND status <> 'closed'`,
        [input.tripId]
      );
      if (!trip.rowCount) {
        throw new AppError(422, "TRIP_UNAVAILABLE", "Jadwal trip yang dipilih sudah tidak tersedia");
      }
      const closesAt = trip.rows[0].po_closes_at;
      if (closesAt && new Date(closesAt).getTime() < Date.now()) {
        throw new AppError(422, "PO_CLOSED", "PO untuk trip ini sudah ditutup. Pilih trip berikutnya atau layanan Reguler.");
      }
    }
    const priced = await priceItems(qc, input);
    const { items } = priced;
    let estimate = priced.estimate;
    let voucher: VoucherSnapshot | null = null;
    if (input.voucherCode?.trim()) {
      const found = await loadVoucher(qc, input.voucherCode, { itemsTotal: estimate.itemsTotal, phone });
      await claimVoucher(qc, found.id);
      voucher = found.snapshot;
      estimate = computePricing({
        itemsTotal: estimate.itemsTotal,
        totalKg: priced.weightKg,
        tier: input.tier,
        discount: voucherDiscount(voucher, estimate.itemsTotal, estimate.jastipFee + estimate.shippingFee),
        voucherCode: voucher.code
      });
    }
    const id = randomUUID();
    const code = newCode();
    const token = newTrackingToken();
    // Catalog prices are fixed, so the customer goes straight to payment.
    const status: OrderRequestStatus = input.source === "catalog" ? "approved" : "submitted";
    const history = [historyEntry("submitted", "Pesanan diterima")];
    if (status === "approved") history.push(historyEntry("approved", "Harga katalog — silakan lakukan pembayaran"));

    await qc.query(
      `INSERT INTO order_requests
         (id, code, tracking_token, source, status, user_id, customer_name, customer_phone,
          customer_email, address, tier, trip_id, items, out_of_stock_preference,
          customer_notes, estimate, quote, history, approved_at, delivery_method, voucher)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13::jsonb, $14,
               $15, $16::jsonb, $17::jsonb, $18::jsonb, $19, $20, $21::jsonb)`,
      [
        id,
        code,
        token,
        input.source,
        status,
        input.userId ?? null,
        input.customerName,
        phone,
        input.customerEmail ?? null,
        JSON.stringify(input.address),
        input.tier,
        input.tier === "batch" ? input.tripId ?? null : null,
        JSON.stringify(items),
        input.outOfStockPreference,
        input.customerNotes ?? null,
        JSON.stringify(estimate),
        status === "approved" ? JSON.stringify(estimate) : null,
        JSON.stringify(history),
        status === "approved" ? new Date().toISOString() : null,
        input.deliveryMethod ?? "delivery",
        voucher ? JSON.stringify(voucher) : null
      ]
    );
    return { id, code, token, status, estimate, phone };
  });

  const trackUrl = `${siteUrl()}/track/${result.token}`;
  const ops = process.env.OPS_WHATSAPP_NUMBER;
  void notifyWhatsApp(
    ops,
    `🛍️ Pesanan baru ${result.code} (${input.source === "catalog" ? "katalog" : "request"})\n` +
      `${input.customerName} · ${result.phone}\n${input.items.length} item · estimasi ${rupiah(result.estimate.total)}\n` +
      `Buka admin: ${siteUrl()}/admin/orders`,
    result.id
  );
  void notifyWhatsApp(
    result.phone,
    `Halo ${input.customerName}, pesanan ${result.code} sudah kami terima. ` +
      (result.status === "approved"
        ? `Total ${rupiah(result.estimate.total)}. Instruksi pembayaran: ${trackUrl}`
        : `Tim kami akan cek ketersediaan & harga, lalu kirim penawaran. Pantau di ${trackUrl}`),
    result.id
  );

  return {
    id: result.id,
    code: result.code,
    trackingToken: result.token,
    status: result.status,
    estimate: result.estimate
  };
}

async function findByToken(qc: QueryClient, token: string, lock = false) {
  const { rows } = await qc.query<Row>(
    `SELECT ${COLUMNS} FROM order_requests WHERE tracking_token = $1 ${lock ? "FOR UPDATE" : ""}`,
    [token]
  );
  if (!rows[0]) throw new AppError(404, "ORDER_REQUEST_NOT_FOUND", "Pesanan tidak ditemukan");
  return rows[0];
}

async function findById(qc: QueryClient, id: string, lock = false) {
  const { rows } = await qc.query<Row>(
    `SELECT ${COLUMNS} FROM order_requests WHERE id = $1 ${lock ? "FOR UPDATE" : ""}`,
    [id]
  );
  if (!rows[0]) throw new AppError(404, "ORDER_REQUEST_NOT_FOUND", "Pesanan tidak ditemukan");
  return rows[0];
}

async function tripSummary(qc: QueryClient, tripId: string | null) {
  if (!tripId) return null;
  try {
    const { rows } = await qc.query<{ code: string; depart_at: string; arrive_estimate_at: string | null }>(
      "SELECT code, depart_at, arrive_estimate_at FROM trips WHERE id = $1",
      [tripId]
    );
    const trip = rows[0];
    return trip
      ? { code: trip.code, departAt: trip.depart_at, arriveEstimateAt: trip.arrive_estimate_at }
      : null;
  } catch {
    return null;
  }
}

function paymentInstructions(): string | null {
  return process.env.PAYMENT_INSTRUCTIONS?.trim() || null;
}

/** What a guest holding the tracking link may see. */
export async function getPublicView(token: string) {
  const qc = await getPool();
  const row = await findByToken(qc, token);
  const status = row.status;
  return {
    code: row.code,
    source: row.source,
    status,
    statusLabel: STATUS_LABELS[status],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customerName: row.customer_name.split(/\s+/)[0],
    customerPhone: maskPhone(row.customer_phone),
    city: parseJson<{ city?: string }>(row.address, {}).city ?? null,
    tier: row.tier,
    deliveryMethod: row.delivery_method ?? "delivery",
    pickupPoint: row.delivery_method === "pickup" ? process.env.PICKUP_POINT_ADDRESS?.trim() || null : null,
    trip: await tripSummary(qc, row.trip_id),
    items: parseJson<RequestItemInput[]>(row.items, []).map((item) => ({
      name: item.name,
      qty: item.qty,
      variant: item.variant ?? null,
      maxPrice: item.maxPrice ?? null,
      unitPrice: (item as { unitPrice?: number }).unitPrice ?? null,
      imageUrl: item.imageUrl ?? null
    })),
    outOfStockPreference: row.out_of_stock_preference,
    estimate: parseJson<PricingBreakdown | null>(row.estimate, null),
    quote: parseJson<PricingBreakdown | null>(row.quote, null),
    quoteNote: row.quote_note,
    trackingNumber: row.tracking_number,
    paymentInstructions: status === "approved" ? paymentInstructions() : null,
    history: parseJson<unknown[]>(row.history, []),
    ...(await reviewStateForToken(token)),
    canApprove: status === "quoted",
    canCancel: status === "submitted" || status === "quoted" || status === "approved"
  };
}

async function transition(
  qc: QueryClient,
  row: Row,
  next: OrderRequestStatus,
  extra: { note?: string | null; actor?: string | null; sets?: Record<string, unknown> } = {}
) {
  const history = parseJson<unknown[]>(row.history, []);
  history.push(historyEntry(next, extra.note, extra.actor));
  const sets: string[] = ["status = $1", "history = $2::jsonb", "updated_at = NOW()"];
  const values: unknown[] = [next, JSON.stringify(history)];
  const stamp: Partial<Record<OrderRequestStatus, string>> = {
    quoted: "quoted_at",
    approved: "approved_at",
    paid: "paid_at",
    cancelled: "cancelled_at"
  };
  if (stamp[next]) sets.push(`${stamp[next]} = NOW()`);
  // A cancelled order gives its promo-code use back.
  const voucher = parseJson<VoucherSnapshot | null>(row.voucher, null);
  if (next === "cancelled" && voucher?.code) await releaseVoucher(qc, voucher.code);
  for (const [column, value] of Object.entries(extra.sets ?? {})) {
    values.push(value);
    sets.push(`${column} = $${values.length}${column === "quote" ? "::jsonb" : ""}`);
  }
  values.push(row.id);
  await qc.query(`UPDATE order_requests SET ${sets.join(", ")} WHERE id = $${values.length}`, values);
}

export async function approveByToken(token: string) {
  const row = await withTransaction(async (qc) => {
    const current = await findByToken(qc, token, true);
    if (current.status !== "quoted") {
      throw new AppError(409, "NOT_AWAITING_APPROVAL", "Pesanan ini tidak sedang menunggu persetujuan");
    }
    await transition(qc, current, "approved", { note: "Penawaran disetujui pelanggan", actor: "customer" });
    return current;
  });
  void notifyWhatsApp(
    process.env.OPS_WHATSAPP_NUMBER,
    `✅ ${row.code}: penawaran disetujui ${row.customer_name}. Tunggu pembayaran.`,
    row.id
  );
  return getPublicView(token);
}

export async function cancelByToken(token: string, reason?: string) {
  const row = await withTransaction(async (qc) => {
    const current = await findByToken(qc, token, true);
    if (!["submitted", "quoted", "approved"].includes(current.status)) {
      throw new AppError(409, "CANNOT_CANCEL", "Pesanan sudah diproses dan tidak bisa dibatalkan dari sini. Hubungi admin.");
    }
    await transition(qc, current, "cancelled", { note: reason || "Dibatalkan pelanggan", actor: "customer" });
    return current;
  });
  void notifyWhatsApp(process.env.OPS_WHATSAPP_NUMBER, `❌ ${row.code} dibatalkan oleh pelanggan.`, row.id);
  return getPublicView(token);
}

function adminView(row: Row) {
  return {
    id: row.id,
    code: row.code,
    trackingToken: row.tracking_token,
    source: row.source,
    status: row.status,
    statusLabel: STATUS_LABELS[row.status],
    userId: row.user_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    address: parseJson(row.address, {}),
    tier: row.tier,
    deliveryMethod: row.delivery_method ?? "delivery",
    tripId: row.trip_id,
    items: parseJson(row.items, []),
    outOfStockPreference: row.out_of_stock_preference,
    customerNotes: row.customer_notes,
    estimate: parseJson(row.estimate, null),
    quote: parseJson(row.quote, null),
    quoteNote: row.quote_note,
    paymentMethod: row.payment_method,
    trackingNumber: row.tracking_number,
    history: parseJson(row.history, []),
    allowedNext: ADMIN_TRANSITIONS[row.status],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listForAdmin(filter: { status?: OrderRequestStatus; limit?: number }) {
  const qc = await getPool();
  const params: unknown[] = [];
  let where = "";
  if (filter.status) {
    params.push(filter.status);
    where = `WHERE status = $1`;
  }
  params.push(Math.min(Math.max(filter.limit ?? 50, 1), 200));
  const { rows } = await qc.query<Row>(
    `SELECT ${COLUMNS} FROM order_requests ${where} ORDER BY created_at DESC LIMIT $${params.length}`,
    params
  );
  const counts = await qc.query<{ status: string; count: string }>(
    "SELECT status, COUNT(*)::text AS count FROM order_requests GROUP BY status"
  );
  return {
    items: rows.map(adminView),
    counts: Object.fromEntries(counts.rows.map((row) => [row.status, Number(row.count)]))
  };
}

export async function getForAdmin(id: string) {
  return adminView(await findById(await getPool(), id));
}

/** Customer dashboard: requests linked to the signed-in account. */
export async function listForUser(userId: string) {
  const { rows } = await (await getPool()).query<Row>(
    `SELECT ${COLUMNS} FROM order_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );
  return rows.map((row) => ({
    code: row.code,
    trackingToken: row.tracking_token,
    status: row.status,
    statusLabel: STATUS_LABELS[row.status],
    total: parseJson<PricingBreakdown | null>(row.quote, null)?.total ??
      parseJson<PricingBreakdown | null>(row.estimate, null)?.total ?? null,
    itemCount: parseJson<unknown[]>(row.items, []).length,
    createdAt: row.created_at
  }));
}

export async function setQuote(
  id: string,
  input: { itemsTotal: number; shippingFee: number; jastipFee?: number; withPpn?: boolean; note?: string },
  actor: string | null
) {
  const row = await withTransaction(async (qc) => {
    const current = await findById(qc, id, true);
    if (!ADMIN_TRANSITIONS[current.status].includes("quoted")) {
      throw new AppError(409, "INVALID_TRANSITION", `Tidak bisa mengirim penawaran saat status ${current.status}`);
    }
    const base = computePricing({ itemsTotal: input.itemsTotal, totalKg: 0.5, tier: current.tier, withPpn: input.withPpn });
    const jastipFee = input.jastipFee ?? base.jastipFee;
    const ppn = (input.withPpn ?? false) ? Math.round((jastipFee + input.shippingFee) * 0.11) : 0;
    const voucher = parseJson<VoucherSnapshot | null>(current.voucher, null);
    const discount = voucherDiscount(voucher, input.itemsTotal, jastipFee + input.shippingFee);
    const quote = {
      ...base,
      jastipFee,
      shippingFee: input.shippingFee,
      ppn,
      total: input.itemsTotal + jastipFee + input.shippingFee + ppn - discount,
      ...(discount > 0 ? { discount, voucherCode: voucher?.code ?? null } : {})
    };
    await transition(qc, current, "quoted", {
      note: input.note ?? "Penawaran harga dikirim",
      actor,
      sets: { quote: JSON.stringify(quote), quote_note: input.note ?? null }
    });
    return { ...current, quote };
  });
  void notifyWhatsApp(
    row.customer_phone,
    `Halo ${row.customer_name}, penawaran untuk ${row.code} sudah siap: total ${rupiah(row.quote.total)}.` +
      `${input.note ? `\nCatatan: ${input.note}` : ""}\nSetujui di ${siteUrl()}/track/${row.tracking_token}`,
    row.id
  );
  return getForAdmin(id);
}

export async function setStatus(
  id: string,
  input: { status: OrderRequestStatus; note?: string; trackingNumber?: string; paymentMethod?: string },
  actor: string | null
) {
  const row = await withTransaction(async (qc) => {
    const current = await findById(qc, id, true);
    if (!ADMIN_TRANSITIONS[current.status].includes(input.status) || input.status === "quoted") {
      throw new AppError(
        409,
        "INVALID_TRANSITION",
        `Status ${current.status} tidak bisa diubah ke ${input.status}`
      );
    }
    const sets: Record<string, unknown> = {};
    if (input.trackingNumber) sets.tracking_number = input.trackingNumber;
    if (input.paymentMethod) sets.payment_method = input.paymentMethod;
    await transition(qc, current, input.status, { note: input.note, actor, sets });
    return current;
  });
  void notifyWhatsApp(
    row.customer_phone,
    `Update ${row.code}: ${STATUS_LABELS[input.status]}.` +
      `${input.trackingNumber ? ` No. resi: ${input.trackingNumber}.` : ""}` +
      `${input.note ? `\n${input.note}` : ""}\nDetail: ${siteUrl()}/track/${row.tracking_token}`,
    row.id
  );
  return getForAdmin(id);
}

/**
 * "Lupa link tracking": if the phone + order code match, send the tracking
 * link again to that WhatsApp number. The response never says whether they
 * matched, so the endpoint can't be used to look up other people's orders.
 */
export async function resendTrackingLink(input: { phone: string; code: string }) {
  const phone = normalizePhone(input.phone);
  const code = input.code.trim().toUpperCase();
  const { rows } = await (await getPool()).query<Pick<Row, "id" | "code" | "tracking_token" | "customer_name" | "customer_phone">>(
    "SELECT id, code, tracking_token, customer_name, customer_phone FROM order_requests WHERE UPPER(code) = $1 LIMIT 1",
    [code]
  );
  const row = rows[0];
  if (row && normalizePhone(row.customer_phone) === phone) {
    void notifyWhatsApp(
      row.customer_phone,
      `Halo ${row.customer_name}, ini link untuk melacak pesanan ${row.code}: ${siteUrl()}/track/${row.tracking_token}`,
      row.id
    );
  }
  return { sent: true };
}
