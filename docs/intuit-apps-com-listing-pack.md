# Intuit Apps.com / QuickBooks App Store — listing pack

Use this after production keys are on Vercel and you subscribe to **Silver**. Paste from here into the Intuit listing and security forms. Fill every `TODO:` yourself (credentials, screenshots, video file).

Related: [marketplace-listing-requirements.md](./marketplace-listing-requirements.md), [ai-inference-policy.md](./ai-inference-policy.md), [incident-response.md](./incident-response.md).

---

## Master checklist (submit order)

| Step | Owner | Done when |
| --- | --- | --- |
| Questionnaire approved + Production Client ID/Secret | Intuit → you | Credentials visible in developer.intuit.com |
| Keys on Vercel + redeploy | You | Real QBO company connect works |
| Production Webhooks verifier on Vercel | You | GET `/api/webhooks/quickbooks` → `verifierConfigured: true` |
| Silver partner (~US$300/mo) | You | Billing shows Silver |
| Reviewer packet (Section A) | You | Test user + guide sent / pasted |
| Security pack (Section B) | You | POC + staging + data-flow attached |
| Marketing assets (Section C) | You | Screenshots + video + copy uploaded |
| Submit **List app on app store** | You | Technical → Security → Marketing reviews open |

Expect **weeks to months**, not days. Security is usually the longest gate.

---

## Section A — Reviewer packet (Technical review)

### A1. App identity

| Field | Value |
| --- | --- |
| App name | **RevCollect** (never put QuickBooks / Intuit / QB / QBO in the name) |
| Host domain | `app.revcollect.ai` |
| Launch URL | https://app.revcollect.ai/launch |
| Connect / reconnect | https://app.revcollect.ai/onboarding/connect-quickbooks |
| Disconnect | https://app.revcollect.ai/disconnect/quickbooks |
| Help / setup guide | https://app.revcollect.ai/help/quickbooks |
| Privacy | https://app.revcollect.ai/privacy |
| Terms | https://app.revcollect.ai/terms |
| Security | https://app.revcollect.ai/security |
| Sub-processors | https://app.revcollect.ai/sub-processors |
| Support email | hello@revcollect.ai |
| Privacy / security contact | hello@revcollect.ai (or privacy@ if you prefer) |
| Company | Nextgrid Digital / RevCollect |
| Address | 1007 N Orange St. 4th Floor Suite #3551, Wilmington, Delaware 19801, USA |

### A2. OAuth / scopes

| Item | Value |
| --- | --- |
| OAuth | Authorization Code + refresh tokens (server-side only) |
| Scope | `com.intuit.quickbooks.accounting` |
| Connect callback | `https://app.revcollect.ai/api/integrations/quickbooks/callback` |
| Sign in with Intuit callback | `https://app.revcollect.ai/api/auth/intuit/callback` |
| Client ID/secret storage | Vercel env only — never in browser or client bundles |
| Webhooks | `https://app.revcollect.ai/api/webhooks/quickbooks` (Customer, Invoice, Payment) |

### A3. What the app does (one paragraph for reviewers)

> RevCollect is a collections inbox for bookkeepers. After the user connects QuickBooks Online, we sync customers and open AR (invoices/payments) into a workspace. The user connects Gmail separately to send collection emails they approve. We draft follow-ups; we do **not** auto-email clients. QuickBooks remains the system of record. Disconnect revokes our tokens and stops sync.

### A4. Reviewer test account — fill these `TODO:`s

Create a dedicated workspace **before** you submit. Do not use your personal only-admin account if you can avoid it.

| Field | Value |
| --- | --- |
| App URL | https://app.revcollect.ai/login |
| Reviewer login email | `TODO: e.g. intuit-reviewer@revcollect.ai` |
| Reviewer password | `TODO: generate once; store in password manager; paste into Intuit form` |
| Role | Workspace admin (can connect integrations) |
| Pre-connected? | Prefer **not** pre-connected — reviewers should run Connect themselves. Optional: leave a sandbox company already connected and document it. |
| Gmail for send test | `TODO: Google account reviewers may use, or note “reviewer must connect their own Gmail”` |
| Sandbox QuickBooks company | `TODO: name of Intuit sandbox company you tested with` |
| Staging / prod | Production hostname `app.revcollect.ai` (same app reviewers use) |

### A5. Short test guide (copy into Intuit)

```text
RevCollect — Intuit technical review test guide

Prerequisites
- Reviewer credentials: [TODO email / password]
- A QuickBooks Online sandbox company the reviewer can authorize
- A Google account with Gmail (send path)

Happy path (≈15–20 minutes)
1. Open https://app.revcollect.ai/login and sign in with the reviewer credentials.
2. Go to Connect QuickBooks: https://app.revcollect.ai/onboarding/connect-quickbooks
   (or Settings → Integrations).
3. Complete Intuit OAuth. Confirm customers / open invoices appear in the workspace.
4. Connect Gmail when prompted (Settings → Integrations).
5. Open Inbox, open a thread (or start follow-up from an open invoice customer).
6. Review the draft and Send. Confirm mail leaves via Gmail (user-approved send only).
7. Optionally edit an invoice/customer/payment in the sandbox company; wait for webhook
   or refresh — AR should update without re-OAuth.
8. Disconnect: https://app.revcollect.ai/disconnect/quickbooks (or Integrations → Disconnect).
   Confirm connection ended messaging and that reconnect works from the reconnect link.

Negative / error checks
- Cancel OAuth mid-flow — app should return safely without exposing secrets.
- Disconnect then reconnect — tokens refresh; data re-ingests.
- Unpaid / trial-ended workspace becomes read-only for send (billing banner).

Notes
- We do not auto-send email. Gmail is required to send.
- We do not use the CDC operation; we use OAuth ingest + webhooks.
- AI drafts are inference-only; we do not train on QuickBooks or customer data.
```

### A6. Data fields we read from QuickBooks Online

| Entity | Why |
| --- | --- |
| Customer | Who to contact; AR aging context |
| Invoice | Open balances for collections |
| Payment | Reduce open AR / context |
| Related AR entities as needed (e.g. credit memo) | Keep balances accurate |

We do **not** need bank feeds, payroll, or Payments API for card processing. Accounting API only.

---

## Section B — Security review pack

### B1. Point of contact

| Field | Value |
| --- | --- |
| Name | `TODO: founder full name` |
| Email | hello@revcollect.ai |
| Phone | `TODO: US number if Intuit asks` |
| Time zone | `TODO: e.g. America/New_York` |
| Escalation | Same as above for a small company |

### B2. Environments

| Env | URL | Notes |
| --- | --- | --- |
| Production | https://app.revcollect.ai | Primary review target |
| Staging | `TODO: if you have a Vercel Preview URL; else say “production only”` | Prefer a stable Preview if security asks for non-prod |

High-privilege test user: same as Section A4 (workspace admin). Do **not** give production database credentials or Vercel owner access.

### B3. Data-flow note (copy-paste)

```text
RevCollect — QuickBooks Online data flow

1. User authenticates to RevCollect (email / Google / Sign in with Intuit).
2. User starts Connect to QuickBooks Online (OAuth 2.0 Authorization Code).
3. Intuit redirects to our server callback with an authorization code.
4. Our server exchanges the code for access + refresh tokens (server-side only).
5. Tokens are stored encrypted at rest, scoped to the user’s workspace (tenant).
6. Server calls QuickBooks Online Accounting API to ingest customers and open AR
   (invoices, payments, related AR entities). Data is written to our database
   under that tenant_id only.
7. Optional: Intuit webhooks notify our endpoint; we verify HMAC (intuit-signature)
   with the verifier token, then re-ingest affected realms asynchronously.
8. Separately, the user connects Gmail (Google OAuth). Collection emails are sent
   only when the user approves a send. Mail content goes through Gmail, not through
   an Intuit mail API.
9. Optional AI: minimized invoice/thread context is sent to a commercial LLM API
   for draft generation (inference only). We do not train models on Intuit or
   customer data. See https://app.revcollect.ai/security and /sub-processors.
10. Disconnect from QuickBooks revokes/stops use of tokens and ends sync for that
    workspace. Customer data remains tenant-isolated; we do not show one customer’s
    Intuit data to another customer.

Sub-processors (hosting / infra / AI / billing): listed at
https://app.revcollect.ai/sub-processors
(Vercel, Supabase, Google, Anthropic/OpenAI, Stripe, etc.)

Encryption: TLS in transit; integration secrets encrypted at rest; dashboard
requires a session. Cron/ingest uses server secrets, not browser-exposed keys.
```

### B4. Security questionnaire — short answers

| Topic | Answer |
| --- | --- |
| MFA | App does not enforce its own MFA; users may use Google MFA on their IdP. Be honest if asked “does your app use MFA?” → **No** (unless you later enforce it). |
| Captcha | No |
| WebSockets | No (for this product surface) |
| Client secrets in browser | No |
| Penetration test | `TODO: attach report if you have one; otherwise state “internal review + dependency monitoring; third-party pen test scheduled / not yet completed”` — do not invent a pen test |
| Vulnerability management | Founder/engineering reviews dependencies, access, and secrets regularly |
| Breach history | No reportable breach (update if that changes) |
| Incident response | Internal plan in repo; customer contact hello@revcollect.ai |
| Data isolation | Per-workspace tenant isolation; Intuit data not shown to other customers |
| AI training | Inference only; no training on QuickBooks data |

### B5. What to attach / have ready for the call

- [ ] This data-flow note  
- [ ] Links: privacy, terms, security, sub-processors  
- [ ] Architecture sketch (optional): Browser → Vercel (Next.js) → Supabase + Intuit API + Gmail API + LLM API  
- [ ] Test user credentials  
- [ ] Confirmation Client ID/secret only in Vercel env  
- [ ] Webhook URL + signature verification description  

---

## Section C — Marketing assets

### C1. Listing copy (US)

**App name:** RevCollect

**Tagline (one line):**  
Collections inbox for QuickBooks Online — drafts you send from Gmail.

**Short description:**  
RevCollect helps bookkeepers follow up on open invoices without leaving their workflow. Connect QuickBooks Online to sync customers and open AR, draft collection emails, and send from Gmail when you approve. We do not auto-email your clients. QuickBooks Online stays your books.

**Long description:**

```text
RevCollect is a collections inbox for bookkeepers and small finance teams who run
receivables in QuickBooks Online.

Connect QuickBooks Online once. We sync customers and open invoices into a workspace
so you can see who owes what and draft the next follow-up. Connect Gmail to send —
you review every message; RevCollect does not auto-email your clients.

What you get
• Open AR context next to your collection threads
• Drafts you approve before anything is sent
• Gmail as the mail channel (your sending identity)
• Disconnect anytime — we stop syncing when you disconnect QuickBooks Online

What we do not do
• We do not replace QuickBooks Online
• We do not auto-send collection emails
• We do not train AI models on your QuickBooks Online data (inference-only drafts)

Pricing (USD)
• 30-day trial — no credit card
• Workspace $49 USD/month
• Agent add-on $39 USD/month after trial
• Unpaid workspaces become read-only

Support: hello@revcollect.ai
Help: https://app.revcollect.ai/help/quickbooks

Intuit and QuickBooks are registered trademarks of Intuit Inc. Used with permission.
```

**Categories (pick up to four):** Receivables / Collections / Accounting workflow / Bookkeeping productivity (match Intuit’s live category list).

**Regions:** Start **United States** only. Add CA / UK / AU later (extra reviews).

**Pricing line (must include currency):**  
`$49 USD/month workspace · $39 USD/month Agent · 30-day no-card trial`

**Support:** hello@revcollect.ai

### C2. Trademark & branding rules (will fail if ignored)

- App name / domain: **no** QuickBooks, Intuit, QB, QBO.
- In copy, spell **QuickBooks** or **QuickBooks Online** in full — never “QB”.
- On every public page that mentions Intuit or QuickBooks, include:  
  `Intuit and QuickBooks are registered trademarks of Intuit Inc. Used with permission.`
- Use official **Connect to QuickBooks** / **Sign in with Intuit** button artwork where Intuit requires it.
- Screenshots/video: **no** Xero or Zoho login UI visible.
- Search ads: do not put Intuit marks in the front of the display URL; negative-match brand terms.

### C3. Screenshot shot list (record these)

Capture on `app.revcollect.ai` with a clean demo company. No competitor books UI.

| # | Shot | Notes |
| --- | --- | --- |
| 1 | Launch / value prop | `/launch` or marketing hero if used |
| 2 | Connect QuickBooks Online | Connect screen / OAuth start (official button) |
| 3 | Synced open AR / customers | After successful connect |
| 4 | Inbox with a collection thread | Draft visible |
| 5 | Send via Gmail (compose / sent confirmation) | Make “you send” obvious |
| 6 | Integrations / Disconnect | Shows Disconnect from QuickBooks |

Export PNG/JPG at Intuit’s current size limits (check the upload form). Keep UI chrome consistent.

### C4. Video script (~60–90 seconds)

```text
[0:00] Title card: RevCollect — collections inbox for QuickBooks Online
[0:05] “Connect QuickBooks Online.” Click Connect; complete OAuth; land back in app.
[0:25] Show customers / open invoices synced.
[0:35] Open Inbox → show a draft follow-up with invoice context.
[0:50] “You review and send from Gmail.” Click Send. Show sent state.
[1:05] Optional: Settings → Disconnect from QuickBooks.
[1:15] End card: “Drafts you send. QuickBooks Online stays the books.”
       hello@revcollect.ai · app.revcollect.ai
```

Record 1080p. Export an Intuit-only cut (no Xero/Zoho). Host on YouTube/unlisted or upload if the form allows a file.

### C5. Assets still for you to produce (not in git)

| Asset | Spec | Status |
| --- | --- | --- |
| App icon / logo | Per Intuit upload form | `TODO` |
| Screenshots 1–6 | Shot list above | `TODO` |
| Demo video | Script above | `TODO` |
| Reviewer password | Section A4 | `TODO` |
| Phone (if required) | US | `TODO` |

---

## Section D — After Silver, before Submit

1. Confirm production keys on Vercel and one real/sandbox company E2E.  
2. Create reviewer user; walk the test guide yourself once.  
3. Paste Section A5 + A4 into the technical form.  
4. Paste Section B3 into the security form; attach POC.  
5. Paste Section C1 copy; upload screenshots + video.  
6. Submit listing → respond to Intuit comments in the developer inbox.  
7. Calendar **annual recert** after publish.

---

## Section E — Founder-only secrets (never commit)

- Production Client ID / Secret  
- Webhook verifier tokens  
- Reviewer password  
- Any pen-test PDF  

Store in 1Password / Vercel env only.
