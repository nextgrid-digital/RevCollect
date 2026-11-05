# RevCollect application architecture

How the running app is wired. A workspace connects one accounting ledger and Gmail. ARI drafts collection follow-ups. A person sends them.

Related: [data-layer-and-compliance.md](../data-layer-and-compliance.md) is the privacy contract. [context-intelligence-plan.md](./context-intelligence-plan.md) is a later design for a fact layer. This page is the system that is in the repo today.

## System

```mermaid
flowchart LR
  User[Bookkeeper]
  App[Next.js app on Vercel]
  SB[(Supabase Auth and Postgres)]
  Books[Xero or QuickBooks or Zoho]
  Gmail[Gmail]
  LLM[AI gateway]
  Stripe[Stripe]

  User --> App
  App --> SB
  App --> Books
  App --> Gmail
  App --> LLM
  App --> Stripe
  Books -->|open invoices and contacts| App
  Gmail -->|customer threads| App
  App -->|approved email only| Gmail
```

One tenant is one signed-in Supabase user. That tenant may have one books connection. Connecting a second ledger disconnects the first.

## Screens

Signed-in routes live under `src/app/(app)/`.

| Route | Job |
| --- | --- |
| `/dashboard` | Overnight ARI summary and cash picture |
| `/inbox` and `/inbox/[messageId]` | Thread, AI draft, send |
| `/customers` and `/customers/[id]` | Balances, relationship state |
| `/aging` | Open invoices by age |
| `/agent` | Tone, follow-up rules, when ARI runs |
| `/onboarding` | Connect a ledger, then Gmail |
| `/settings` | Integrations, billing, appearance |

Public pages are marketing, login, signup, privacy, terms, security, and the disconnect/help pages for each ledger.

## Request path

Browser UI does not talk to Xero, QuickBooks, Zoho, or Gmail. It calls the BFF. The server reads and writes the canonical snapshot.

```mermaid
flowchart TB
  Pages["Pages in src/app"]
  UI["Features in src/features/revcollect"]
  RQ[React Query]
  HTTP["getRevCollectService HTTP client"]
  API["POST and GET /api/revcollect"]
  Svc[XeroRevCollectService]
  Canon["getCanonicalStore"]
  PG[(Postgres snapshot)]
  File[".data/canonical JSON fallback"]

  Pages --> UI
  UI --> RQ
  RQ --> HTTP
  HTTP --> API
  API --> Svc
  Svc --> Canon
  Canon --> PG
  Canon --> File
```

`src/features/revcollect/api/service.ts` is the contract. The browser uses `http-xero-service.ts`. Route handlers use `xero-service.ts`, which is server-only. If Supabase admin credentials are missing, or the Postgres store cannot be reached, the snapshot is a JSON file on disk.

The snapshot holds customers, invoices, payments, per-customer intelligence, ARI drafts, sent mail, agent config, and workspace settings.

## Ledger ingest

```mermaid
flowchart LR
  QBO[QuickBooks API]
  Xero[Xero API]
  Zoho[Zoho Books API]
  Pick["One connected ledger"]
  Map[Map to canonical invoices and customers]
  Snap[Canonical snapshot]
  Patterns[Deterministic DSO and on-time patterns]

  QBO --> Pick
  Xero --> Pick
  Zoho --> Pick
  Pick --> Map
  Map --> Snap
  Snap --> Patterns
```

QuickBooks can also push webhooks. Xero and Zoho are pulled on read when the snapshot is empty or stale. Secrets for each OAuth connection stay in `integration_secrets`, service role only.

Switching ledgers clears the inbox that belonged to the previous books connection.

## Mail

Gmail sync attaches threads to open-balance customers by email address, then by subject when the address is ambiguous. Bodies used by the live inbox are stored on the tenant snapshot, not as a separate encrypted email table.

Sending is a button in the inbox. The server checks do-not-contact and the relationship state, appends the CAN-SPAM footer, and sends through the Gmail API. ARI never calls that path.

## ARI

ARI is the collections agent. It queues drafts. It does not send email, and it does not invent invoice numbers, amounts, dates, or names.

```mermaid
flowchart TB
  Cron["Vercel cron 07:00 UTC GET /api/cron/ari"]
  Force["Signed-in POST /api/ari/run"]
  Run[runOvernightAri]
  Gate{Plan includes the agent and the agent is active}
  Policy[Skip sensitive, paused, and do-not-contact accounts]
  Ctx[assembleCustomerContext]
  Model["complete.ts chat completions"]
  Template[Template draft if no model is configured]
  Check[Reject invented facts and blocked collection language]
  Queue[Save draft on the customer thread]
  Inbox[Person edits or sends in the inbox]
  Rewrite["Edit with AI calls rewriteAgentDraft"]

  Cron --> Run
  Force --> Run
  Run --> Gate
  Gate -->|no| Stop[Record a paused run]
  Gate -->|yes| Policy
  Policy --> Ctx
  Ctx --> Model
  Model -->|no API key| Template
  Model -->|text| Check
  Template --> Queue
  Check -->|ok| Queue
  Check -->|rejected| Template
  Queue --> Inbox
  Inbox --> Rewrite
  Rewrite --> Model
```

The model call goes to the Vercel AI gateway when `AI_GATEWAY_API_KEY` is set, otherwise to `AI_BASE_URL` with `AI_API_KEY`. Tasks are `generate`, `extract`, and `classify`.

On the way in, customer replies can be classified and a promised pay date can be extracted. That updates relationship state. It does not send a reply.

A logged-in force run is `POST /api/ari/run`. The daily cron uses `CRON_SECRET`.

## Auth and billing

```mermaid
flowchart LR
  Login["/login and /signup"]
  Auth[Supabase Auth]
  MW[Middleware allows public pages and cron and webhooks]
  AppRoutes[Dashboard, inbox, customers, aging, agent, settings]
  Bill[Stripe checkout and webhooks]
  Ent[Workspace entitlements]
  AgentPlan{Agent add-on}

  Login --> Auth
  Auth --> MW
  MW --> AppRoutes
  Bill --> Ent
  Ent --> AgentPlan
  AgentPlan -->|yes| AriOk[Overnight run and Edit with AI]
  AgentPlan -->|no| AriOff[ARI stays off]
```

Write actions and ARI both check entitlements. A workspace without the agent add-on cannot run the overnight loop or rewrite a draft. `autoSendEnabled` is stored as false.

## Outside this picture

- `agent/` is an optional Eve tool mirror of the same overnight loop. Production cron calls the TypeScript in `src/lib/ari/`.
- The compliance document still names Clerk and ciphertext `thread_emails`. Sign-in is Supabase. Live Gmail bodies sit on the tenant snapshot.
- Context intelligence snapshots, observation tables, and a separate extraction service are specified in the plan and are not built yet.
