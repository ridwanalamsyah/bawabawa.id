/**
 * Funnel events for Plausible (custom events). No-op when Plausible isn't
 * loaded (NEXT_PUBLIC_PLAUSIBLE_DOMAIN unset), so it is safe to call
 * anywhere on the client. Never send personal data in props.
 */
type Props = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Props }) => void;
  }
}

export type FunnelEvent =
  | "request_start"
  | "request_step"
  | "request_submit"
  | "catalog_add"
  | "checkout_submit"
  | "quote_approve"
  | "order_cancel"
  | "review_submit"
  | "partner_submit"
  | "whatsapp_click";

export function track(event: FunnelEvent, props?: Props): void {
  try {
    window.plausible?.(event, props ? { props } : undefined);
  } catch {
    // analytics must never break the page
  }
}
