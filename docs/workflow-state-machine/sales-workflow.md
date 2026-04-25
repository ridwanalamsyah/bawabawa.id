# Sales Workflow State Machine

- `draft -> confirmed -> payment_pending`
- `payment_pending -> payment_dp -> payment_paid`
- `payment_paid -> stock_reserved -> packed -> shipped -> invoiced -> posted_finance`
- cancellation hanya valid dari `draft`, `confirmed`, `payment_pending`, `payment_dp`

Critical checks:
- idempotency key wajib pada create order dari POS client.
- reserve stock hanya valid setelah payment lunas.
- posting ke finance hanya valid setelah invoice dibuat.
