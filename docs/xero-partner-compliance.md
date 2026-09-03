# Xero App Partner — Compliance Statement

Use this language in the Xero App Partner application and integration documentation.

## Summary

RevCollect syncs invoice and contact data from Xero to help small businesses follow up on overdue accounts. We use this data **only** to provide the collections service and for **real-time AI inference** (drafting emails, classifying replies). We do **not** use Xero API data to train, fine-tune, or improve machine learning models.

## Xero Developer Terms (effective March 2, 2026)

Xero prohibits using API data to train AI/ML models. RevCollect complies as follows:

| Activity                                             | Permitted | Our approach                                      |
| ---------------------------------------------------- | --------- | ------------------------------------------------- |
| Display invoice/contact data in UI                   | Yes       | Structured sync to Postgres with tenant isolation |
| Use data as LLM prompt context for one-off inference | Yes       | Context assembly → single API call → discard      |
| Store API responses for service delivery             | Yes       | Encrypted at rest, retention policy enforced      |
| Fine-tune models on Xero data                        | **No**    | No fine-tuning pipeline exists                    |
| Build training datasets from Xero data               | **No**    | No export to training pipelines                   |
| Log full prompts to analytics                        | **No**    | Audit logs contain IDs only                       |

## Architecture

```
Xero OAuth → Sync job → Postgres (structured fields + encrypted email bodies)
                              ↓
                    Context assembly (minimized facts + recent thread)
                              ↓
                    Anthropic/OpenAI API (inference only, commercial terms)
                              ↓
                    Draft stored encrypted; prompt not retained by RevCollect
```

## Data minimization

- Sync only fields required for collections: contact name, email, invoice number, amount, due date, status.
- Do not sync unrelated Xero entities (payroll, bank transactions beyond payment status).

## Documentation for Xero reviewers

- Privacy policy: https://app.revcollect.ai/privacy
- Security practices: https://app.revcollect.ai/security
- Sub-processors: https://app.revcollect.ai/sub-processors
- Terms: https://app.revcollect.ai/terms
- Internal: [ai-inference-policy.md](./ai-inference-policy.md)

## Partner application checklist

- [ ] State inference-only AI use explicitly
- [ ] Confirm no model training on Xero data
- [ ] Describe encryption and tenant isolation
- [ ] Link to public privacy and security pages
- [ ] Name sub-processors (Anthropic, OpenAI)
