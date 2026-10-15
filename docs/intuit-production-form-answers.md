# Intuit production App details — copy-paste answers

Last checked against live URLs: **15 Oct 2026**.

Use these in [Intuit Developer](https://developer.intuit.com) → your app → **Keys & credentials** → **Production** → **App details**, then **Compliance**.

You do **not** need AI finished to submit this.

---

## URL audit (what exists)

### Marketing site (`revcollect.ai`)

| Page | URL | Status |
| --- | --- | --- |
| Privacy Policy | https://revcollect.ai/security/privacy-policy | Live (200) |
| Terms of Service (EULA) | https://revcollect.ai/security/terms-of-service | Live (200) |
| DPA | https://revcollect.ai/security/dpa | Live (200) |
| `/security` hub | https://revcollect.ai/security | **404 — not required** |
| `/security/p` | https://revcollect.ai/security/p | **404 — not required** |
| `/terms` or `/privacy` short paths | https://revcollect.ai/terms etc. | **404 — not required** |

### App (`app.revcollect.ai`) — Intuit product URLs

| Page | URL | Status |
| --- | --- | --- |
| Privacy | https://app.revcollect.ai/privacy | Live (200) |
| Terms | https://app.revcollect.ai/terms | Live (200) |
| Launch | https://app.revcollect.ai/launch | Live (200) |
| Disconnect QuickBooks | https://app.revcollect.ai/disconnect/quickbooks | Live (200) |
| Connect / reconnect | https://app.revcollect.ai/onboarding/connect-quickbooks | Live (redirects to sign-in if logged out — OK) |

**Nothing blocking is missing.** You can submit App details today.

Optional later (not blockers): fix marketing privacy section headings (content is duplicated/mislabeled), add a `/security` index page that links Privacy / Terms / DPA.

---

## App details — paste these

### 1. Review Intuit Developer Portal profile and verify email

| Field | Value |
| --- | --- |
| Company | Your **US** legal entity name (RevCollect company as formed in the US) |
| Your role | Owner / Founder |
| Email | Prefer `admin@revcollect.ai` (verified) |
| Company address | From Terms: **1007 N Orange St. 4th Floor Suite #3551, Wilmington, Delaware 19801, USA** |
| You work from India | Fine — profile/company = **US**. Do not put India as company HQ unless the entity is Indian. |

Complete profile + verify email, then mark the task done.

### 2. EULA and privacy policy

Use the marketing site (or app — both work). Prefer marketing so it matches the public Legal footer:

| Field | Paste |
| --- | --- |
| **End-user license agreement (EULA) / Terms** | `https://revcollect.ai/security/terms-of-service` |
| **Privacy policy** | `https://revcollect.ai/security/privacy-policy` |

App mirrors (also valid if Intuit prefers same host as the product):

| Field | Alternate |
| --- | --- |
| EULA | `https://app.revcollect.ai/terms` |
| Privacy | `https://app.revcollect.ai/privacy` |

### 3. Host domain, launch, disconnect, connect/reconnect

| Field | Paste |
| --- | --- |
| **Host domain** | `app.revcollect.ai` |
| **Launch URL** | `https://app.revcollect.ai/launch` |
| **Disconnect URL** | `https://app.revcollect.ai/disconnect/quickbooks` |
| **Connect / reconnect URL** | `https://app.revcollect.ai/onboarding/connect-quickbooks` |

Also register these **redirect URIs** on the Intuit app (Keys / OAuth):

| Purpose | URI |
| --- | --- |
| QuickBooks OAuth callback | `https://app.revcollect.ai/api/integrations/quickbooks/callback` |
| Sign in with Intuit (if used) | `https://app.revcollect.ai/api/auth/intuit/callback` |

### 4. Select at least one category

Pick categories that match **AR / collections / invoicing workflow** (use “Show with examples” in the portal).

**Preferred direction:** Invoicing and payments / accounting workflow / receivables-related options.

**Do not pick:** Payroll, Lending, Banking, Tax filing (unless you actually do those).

### 5. Regulated industries

Answer for **who uses RevCollect**, not where you personally live.

| Guidance | Answer |
| --- | --- |
| Are you a bank / lender / insurer? | **No** |
| Do you lend money? | **No** — do not enable Lending |
| Who are customers? | SMBs / service businesses that use QuickBooks for AR |
| If asked about financial services adjacency | Only select if the portal forces a “customers in finance” style option for bookkeeping/AR tools — never claim you are a regulated financial institution unless you are |

### 6. Where the app is hosted

| Field | Paste (adjust if your Vercel/AWS region differs) |
| --- | --- |
| Hosting | **Vercel** (or your actual host) |
| Region / country | **United States** (use the region shown in your Vercel project) |
| Do not write | “Hosted in India” unless production servers are actually in India |

---

## Compliance questionnaire — full answer sheet (RevCollect)

Copy these as you go. Exact wording varies; pick the closest option.  
**Do not invent features.** Answers below match the current codebase.

Skip any **Lending** section entirely (you selected None of the above for regulated industries).

---

### App information

| # | Question | Your answer |
| --- | --- | --- |
| 1 | Which is true about your app? | Check **only**: *You built your app from scratch and wrote the code that lets it interact with Intuit APIs and data* |
| | Do **not** check | Used another platform (Codat), act as a platform for other developers, require users to create Intuit developer apps, or created the app only to get keys for another platform |
| 2 | What platform(s) does your app use / make API calls from? | **Node.js / Next.js** (server-side). Hosted on **Vercel**. Not browser-only. |
| 3 | How does your app interact with Intuit product data? | Paste: *RevCollect syncs open accounts receivable from QuickBooks Online (customers, invoices with balance, payments) into a collections inbox. Users draft and send follow-up emails via Gmail. We do not auto-email clients. QuickBooks remains the system of record. We do not write invoices, process card payments, or use Payroll.* |
| 4 | Private vs public | **We plan to make our app publicly available** |
| | Estimated QBO connections | Honest estimate, e.g. **25** in the first 6–12 months (adjust if you have a clearer plan) |
| 5 | Which QBO users can use the app? | **Any admin of the QuickBooks Online company** (they connect OAuth) |
| 6 | Integrate with platforms other than Intuit? | **Yes** — Gmail (send mail); also Xero and Zoho Books as alternate ledgers |

---

### Authorization and authentication

| # | Question | Your answer |
| --- | --- | --- |
| 1 | Tested connect, disconnect, reconnect in sandbox? | **Yes** (required — Intuit rejects No) |
| 2 | How often refresh access tokens? | **Only when access tokens expire** |
| 3 | Retry failed auth requests? | **Yes** |
| 4 | On auth error, ask customers to reconnect? | **Yes** |
| 5 | Used Intuit discovery document for OAuth endpoints? | **No** — we use Intuit’s documented OAuth 2.0 authorize/token/revoke endpoints (hardcoded to Intuit’s published URLs) |
| 6a | Handle expired access tokens? | **Yes** |
| 6b | Handle expired refresh tokens? | **Yes** |
| 6c | Handle invalid_grant? | **Yes** (clears connection and asks user to reconnect) |
| 6d | Handle CSRF errors? | **Yes** (OAuth `state` cookie validated on callback) |
| 7 | Rely on OAuth Playground for production tokens? | **No** |

---

### API usage

| # | Question | Your answer |
| --- | --- | --- |
| 1 | Accounting API | **Yes** |
| | Payments API | **No** |
| | Payroll API | **No** |
| 2 | How often call APIs per customer? | Closest to: **A few times per day** / on user sync and when opening the app — not continuous high-frequency polling. Free-text if needed: *On connect, manual Resync, and background refresh when the workspace is used (on the order of minutes/hours, not every second).* |

---

### Accounting API follow-ups

| # | Question | Your answer |
| --- | --- | --- |
| 1 | QBO versions designed for | **Simple Start, Essentials, Plus, Advanced** (all — we only need customers + open invoices) |
| 2 | Handle version feature gain/loss? | **Yes** |
| | How? | *We only rely on core Customer / Invoice / Payment query APIs available across QBO versions. If a call fails due to permissions or plan limits, we surface an error and ask the user to reconnect or check QuickBooks access. We do not depend on version-specific premium features.* |
| 3 | Multi-currency / sales tax features verified? | **None of the above** (we sync open AR balances; we have not claimed a dedicated multi-currency or tax module) |
| 4 | Use Intuit webhooks? | **Yes** — endpoint `https://app.revcollect.ai/api/webhooks/quickbooks` (Customer, Invoice, Payment create/update/delete). Set verifier tokens in Vercel env. |
| 5 | Use CDC (Change Data Capture)? | **No** |

---

### Error handling

| # | Question | Your answer |
| --- | --- | --- |
| 1 | Tested API errors (syntax/validation)? | **Yes** |
| 2 | Capture `intuit_tid` from response headers? | **Yes** — every QuickBooks and Intuit OAuth response logs `intuit_tid` (and failed calls include it on the error) |
| 3 | Store errors in logs for troubleshooting? | **Yes** (server logs; Sentry when enabled) |
| 4 | Way for customers to contact support in-app? | **Yes** — email **admin@revcollect.ai** (and Settings / support links in product) |

---

### Security

| # | Question | Your answer |
| --- | --- | --- |
| 1 | Company ever had a reportable security breach? | **No** (unless that is untrue) |
| 2 | Security team / regular vulnerability assessment? | **Yes** — *Founder/engineering reviews dependencies, access, and secrets regularly* (honest for a small US company) |
| 3 | Client ID/secret stored securely (not hardcoded / not in browser)? | **Yes** (Vercel / server env vars only) |
| 4 | App use multi-factor authentication? | **No** for in-app enforced MFA — *unless* you have turned on Supabase/Google MFA enforcement. If users only optionally have Google MFA, prefer **No** unless the form allows “via identity provider.” |
| 5 | Use Captcha? | **No** |
| 6 | Use WebSocket? | **No** |
| 7 | Allow Intuit customer data to be used/shown to anyone other than that customer? | **No** — tenant-isolated; each workspace only sees its own connected company data |

---

### Free-text / AI (if asked)

**Data use / AI:**

> AI may be used for inference only to help draft collection emails. We do not train models on Intuit or customer QuickBooks data. See https://revcollect.ai/security/privacy-policy

**Support contact:** `admin@revcollect.ai`  
**Company address:** 1007 N Orange St. 4th Floor Suite #3551, Wilmington, Delaware 19801, USA

---

## Company / contact (from live Terms)

| Item | Value |
| --- | --- |
| Support / privacy email | `admin@revcollect.ai` |
| Mailing address | 1007 N Orange St. 4th Floor Suite #3551, Wilmington, Delaware 19801, USA |
| Governing law (Terms) | Delaware, USA |

---

## Pre-submit checklist

- [ ] Privacy URL opens in a private browser window  
- [ ] Terms URL opens in a private browser window  
- [ ] Launch / disconnect / connect URLs open  
- [ ] Production redirect URIs registered on the Intuit app  
- [ ] Sandbox: connect → disconnect → reconnect tested once  
- [ ] Profile email verified; US company details filled  
- [ ] Not marked as Lending  
- [ ] Hosting country = where servers run (US), not where you sit (India)  

---

## If rejected

1. Screenshot the rejection email.  
2. Open an Intuit Developer support case and ask **which questionnaire rule failed**.  
3. Many private/early apps hit an automated fail; human review often clears it when answers are consistent and sandbox OAuth works.

---

## Related

- [marketplace-listing-requirements.md](./marketplace-listing-requirements.md) — production keys vs Marketplace listing (Silver fee, security review)  
- Codat’s public walkthrough of the same questionnaire structure: [QBO app assessment questionnaire](https://docs.codat.io/integrations/accounting/quickbooksonline/qbo-app-assessment-questionnaire) (ignore Codat-specific answers; RevCollect calls Intuit directly)
