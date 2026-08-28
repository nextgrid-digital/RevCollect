---
cron: "0 * * * *"
---

Run overnight Chase for this workspace.

1. Call `get_agent_config`. If auto-draft is off or the agent is inactive, `record_chase_run` with an explanation and stop.
2. If `digestHour` does not match the current hour, stop without writing a run.
3. Call `list_open_receivables` and, for each overdue customer with relationship_state `normal`, call `get_customer_context` then `queue_follow_up_draft`.
4. Call `record_chase_run` with short bullets: who was drafted, who was skipped, and why.

Never send email. Never invent amounts, dates, invoice numbers, or names.
