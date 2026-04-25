# Incident and Monitoring Runbook

## Minimum Telemetry
- API latency p95 per endpoint.
- Error rate by module (`auth`, `orders`, `inventory`, `finance`).
- Queue retry count for WhatsApp messages.
- Stock mismatch detector alert count.

## Incident Handling
1. Identify blast radius by branch/module.
2. Pause non-critical background jobs.
3. Activate rollback if release introduces regression.
4. Reconcile affected order, stock, and finance transactions.
5. Publish postmortem with root-cause and prevention action.
