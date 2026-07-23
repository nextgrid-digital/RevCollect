# AI Inference Policy

Engineering rules for all LLM usage in RevCollect. Mandatory for backend sprint implementation.

## Principles

1. **Inference only** — Customer data may be sent to Anthropic/OpenAI commercial APIs for a single request/response. Never for training or fine-tuning.
2. **Data minimization** — Include only fields required for the task (invoice summary, recent thread excerpt, tone preference).
3. **No prompt persistence** — Do not store full prompts in logs, Sentry, analytics, or feedback systems.
4. **No training loops** — Do not use customer corrections or thumbs-up/down to fine-tune models.

## Allowed logging

| Field                                   | Allowed                  |
| --------------------------------------- | ------------------------ |
| `tenant_id`                             | Yes                      |
| `thread_id` / `message_id`              | Yes                      |
| `model` name                            | Yes                      |
| `token_count`                           | Yes                      |
| `latency_ms`                            | Yes                      |
| Email body / full prompt                | **No**                   |
| Customer name / email in error messages | **No** (scrub in Sentry) |

## Implementation checklist

- [ ] `assembleContext()` returns minimized structured context
- [ ] `generateDraft()` calls provider API once; no retry with expanded PII
- [ ] Sentry `beforeSend` scrubs email patterns and invoice content
- [ ] Environment variables for API keys server-side only
- [ ] Anthropic and OpenAI DPAs executed and filed
- [ ] Code review gate: any new LLM call must reference this policy

## Provider terms

- **Anthropic:** Commercial API terms state inputs are not used for training by default.
- **OpenAI:** API data not used for training per enterprise/API terms.

## Xero-specific

Xero API data must not be used to train models (see [xero-partner-compliance.md](./xero-partner-compliance.md)). Inference on synced invoice/contact data for drafting is permitted.

## Violations

Any code path that stores customer content for model improvement is a **severity S1** incident. Stop deployment and escalate to privacy contact immediately.
