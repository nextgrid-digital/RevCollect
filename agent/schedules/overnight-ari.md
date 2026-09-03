---
cron: "0 7 * * *"
---

Run overnight ARI for this workspace.

Production schedule: Vercel Cron `GET /api/cron/ari` once per day at 07:00 UTC (`vercel.json`). Hobby only allows daily crons. The route forces the hour so drafts still run. Authorized with `CRON_SECRET`. Never sends email.

1. Call `get_agent_config`. If auto-draft is off or the agent is inactive, `record_ari_run` with an explanation and stop.
2. Production Cron forces the hour (Hobby is once daily). Manual agent runs still stop if `digestHour` does not match.
3. Call `list_open_receivables` and, for each overdue customer with relationship_state `normal`, call `get_customer_context` then `queue_follow_up_draft`.
4. Call `record_ari_run` with short bullets: who was drafted, who was skipped, and why.

Never send email. Never invent amounts, dates, invoice numbers, or names.
