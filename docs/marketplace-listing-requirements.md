# Intuit and Zoho marketplace listing requirements

What each store actually requires to list RevCollect, versus what is already in this repo. Confirmed against Intuit App Partner Program Guide v1.2 (March 2026), Intuit publish/list docs, and Zoho Books / Marketplace partner docs (accessed September 2026). Fees and review rules change; re-check the live developer dashboards before you pay or submit.

Do **not** put “QuickBooks”, “Intuit”, or “Zoho” in the RevCollect product name. Use “RevCollect” on the tile; name the integration in the description.

Positioning for both listings: drafts, you send. The ledger stays the books. Gmail is the mail. RevCollect does not auto-email clients.

Support: `hello@revcollect.ai`

Public URLs (already live on `app.revcollect.ai`):

| Page | Path |
| --- | --- |
| Privacy | `/privacy` |
| Terms | `/terms` |
| Security | `/security` |
| Sub-processors | `/sub-processors` |
| Launch | `/launch` |
| Connect QuickBooks | `/onboarding/connect-quickbooks` (alias `/connect/quickbooks`) |
| Disconnect QuickBooks | `/disconnect/quickbooks` |
| Connect Zoho Books | `/onboarding/connect-zoho` |
| Disconnect Zoho | `/disconnect/zoho` |
| Sign in with Intuit | `/api/auth/intuit/start` → `/api/auth/intuit/callback` |
| Sign in with Zoho | `/api/auth/zoho/start` → `/api/auth/zoho/callback` |

Demo for reviewers: connect books → inbox → send from Gmail.

Related: [marketplace-listings.md](./marketplace-listings.md) (copy + founder checklist), [xero-partner-compliance.md](./xero-partner-compliance.md) (AI inference-only language; reuse the same claims for Intuit/Zoho).

---

## Two products, two stores

| | QuickBooks (Intuit App Marketplace) | Zoho Books (Zoho Marketplace) |
| --- | --- | --- |
| How the **product** works | Server OAuth 2.0 + `realmId` → canonical AR ingest | Server OAuth + `organization_id` → same ingest |
| How you **list** | App card on Apps.com / QuickBooks App Store | Sigma **extension** that installs inside Zoho Books, then deep-links to RevCollect |
| In this repo | OAuth, Sign in with Intuit, launch/connect/disconnect pages | OAuth, Sign in with Zoho, thin extension in `marketplace/zoho-books-extension/` |
| Listing is | Optional at Silver+; **not available on Builder** | After **private** Zoho Finance review, then Marketplace review |

Do not ship a Books-only widget as the product. Keep Gmail as send. Do not wait on Gold/Platinum connection counts to list.

---

## Intuit App Marketplace (QuickBooks Online)

Official:

- [Publish your app](https://developer.intuit.com/app/developer/qbo/docs/go-live/publish-app)
- [List on the app store / review](https://developer.intuit.com/app/developer/qbo/docs/go-live/list-on-the-app-store/what-to-expect-during-the-review)
- [Naming and logo](https://developer.intuit.com/app/developer/qbo/docs/go-live/list-on-the-app-store/naming-and-logo-guidelines)
- [Marketing requirements](https://developer.intuit.com/app/developer/qbo/docs/go-live/publish-app/marketing-requirements)
- [Partner program guide (PDF)](https://static.developer.intuit.com/resources/Intuit_App_Partner_Program_Guide.pdf)
- Non-SSO URL notes: [technical requirements for non-SSO apps](https://help.developer.intuit.com/s/article/Referral-app-query)

### 1. Production keys (required even if you never list)

Every workspace starts on **Builder**. You cannot get production Client ID/secret until:

1. Sandbox OAuth works (connect, disconnect, reconnect).
2. You complete the **app assessment questionnaire** (self-attested; privacy, data use, security).
3. Intuit **approves** the questionnaire.
4. You accept Developer Terms.
5. Production **App details** are filled (see URLs below). Then **Show credentials** appears.

Without production keys, marketplace listing is impossible.

### 2. Partner tier to list

| Tier | Monthly program fee (USD, guide example) | Payment method | Marketplace listing |
| --- | --- | --- | --- |
| Builder | $0 | Not required | **Not available** |
| **Silver** | **$300** | Required | **Optional** — this is the listing floor |
| Gold | $1,700 | Required | Optional; also needs **500** active connections |
| Platinum | $4,500 | Required | Optional; also needs **3,000** active connections |

Silver also includes 1M CorePlus API credits / month; overage is metered (guide: ~US$3.50 per 1k CorePlus after 1M). Core API calls are uncapped. Fees are billed at workspace level. Confirm current rates in Billing and Subscriptions.

You do **not** need Gold to list.

### 3. URLs Intuit requires on the production app card

Enter these in developer.intuit.com → app → Production → App details:

| Field | RevCollect |
| --- | --- |
| Host domain | `app.revcollect.ai` |
| EULA / terms | `https://app.revcollect.ai/terms` |
| Privacy policy | `https://app.revcollect.ai/privacy` |
| Launch URL | `https://app.revcollect.ai/launch` |
| Connect / reconnect | `https://app.revcollect.ai/onboarding/connect-quickbooks` |
| Disconnect | `https://app.revcollect.ai/disconnect/quickbooks` |
| Sign in with Intuit redirect | `https://app.revcollect.ai/api/auth/intuit/callback` (register on the app) |
| Connect OAuth redirect | `https://app.revcollect.ai/api/integrations/quickbooks/callback` |

If they treat you as **non-SSO**, they also want a **Learn more** URL (integration explanation + trial/demo). `/launch` covers that. Prefer **Sign in with Intuit** on login (already on the auth page) over Learn-more-only listing.

Disconnect page must say the connection ended and how to reconnect. [`src/app/disconnect/quickbooks/page.tsx`](../src/app/disconnect/quickbooks/page.tsx) already does.

### 4. Three-part listing review

Submit from the app dashboard (**List app on app store**). Typical path:

1. **Technical** — OAuth, connect / disconnect / reconnect from a sandbox company, scopes, no leaked secrets, data flow, reviewer test account + credentials + short test guide. Often a kickoff call, then written comments.
2. **Security** — third-party assessment of the app (pen test / vulnerability questionnaire, staging URL, high-privilege test user, point of contact). Longest gate (often weeks).
3. **Marketing** — listing copy, screenshots, video, pricing, branding, per-country content.

If any stage fails, fix and resubmit. Published apps are **re-reviewed at least annually**.

Expect **weeks to months**, not 5 days. Plan sandbox credentials and a 30-minute security demo.

### 5. Branding and marketing (will fail review if ignored)

- App name and root domain: no QuickBooks / Intuit / QB / QBO.
- Spell **QuickBooks** in full in copy; no “QB”.
- On pages that mention Intuit or QuickBooks, include:  
  `Intuit and QuickBooks are registered trademarks of Intuit Inc. Used with permission.`
- Use official **Sign in with Intuit** / **Connect to QuickBooks** buttons; after connect, show **Disconnect from QuickBooks** that revokes the token.
- Pricing on the listing must include **currency** (e.g. $49 USD/month, Agent $39 USD/month, 30-day no-card trial).
- Privacy and terms must be reachable and match what the app does (AR ingest + Gmail send + AI **inference only**, no training on Intuit data — same stance as Xero).
- Do not show login UI for a competing books product in the Intuit listing screenshots.
- Search ads: no Intuit marks in the front of the display URL; negative-match their brand keywords.

### 6. Listing packet

- App name: RevCollect  
- Categories: up to four (receivables / collections / bookkeeping workflow)  
- Regions: start **US**; CA / UK / AU are extra listings and extra reviews  
- Screenshots: connect QuickBooks → inbox → send from Gmail  
- Short video of that path  
- Support email (and phone if you have one)  
- Test company + login for reviewers  
- Clear statement that **Gmail** is required to send, and that we do not auto-send

### 7. Founder checklist (Intuit)

- [ ] Sandbox connect / disconnect / reconnect works on production hostname
- [ ] Register production redirect URIs on the Intuit app
- [ ] Submit and pass **app assessment questionnaire**
- [ ] Turn on production keys
- [ ] Add payment method and subscribe to **Silver** (~US$300/mo in the Mar 2026 guide)
- [ ] Fill production App details (legal + launch/connect/disconnect)
- [ ] Prepare security review pack (staging URL, test user, data-flow note, contact)
- [ ] Screenshots, video, listing copy with currency and trademark notice
- [ ] Submit for technical → security → marketing review
- [ ] After approval, publish per-country when ready
- [ ] Calendar **annual recert**

**Already in product:** QBO OAuth, Sign in with Intuit, launch/connect/disconnect pages, Gmail send, legal pages.

**Still founder/ops:** questionnaire, Silver billing, security review, listing assets, production keys on Vercel (`INTUIT_CLIENT_ID` / `INTUIT_CLIENT_SECRET` / `INTUIT_ENVIRONMENT=production`).

**Ready-to-paste pack:** [intuit-apps-com-listing-pack.md](./intuit-apps-com-listing-pack.md) (reviewer guide, security data-flow, listing copy, screenshot/video shot list). Public help URL: https://app.revcollect.ai/help/quickbooks

---

## Zoho Marketplace (Zoho Books)

Official:

- [Publish extension (private then Marketplace)](https://www.zoho.com/books/developer/extensions/publish-extension.html)
- [Zoho Books extension review guidelines](https://www.zoho.com/books/developer/extensions/review-guidelines.html)
- [Submit an application (Partner Console)](https://www.zoho.com/marketplace/help-guide/listing-marketplace.html)
- [Extension branding / approval guidelines](https://www.zoho.com/developer/help/marketplace/guidelines.html)

### 1. Two reviews (this is the Zoho sequence)

The product OAuth app in Zoho API Console is **not** the listing. Listing is a **Sigma / Books extension**.

1. Build and test in **Zoho Books sandbox** (Developer Portal).
2. **Publish privately** → **Submit for private review** (Zoho Finance / Books team, typically **5–7 working days**, longer if the extension is heavy).
3. After private approval, **Submit to Marketplace** (Sigma → Partner Console form). Another **~5–7 working days**. Status: Waiting for Approval → Approved.
4. You can share a private install link with specific org admins **only after** private approval.

`Submit to Marketplace` is hidden until private review passes.

### 2. What the extension is allowed to be

RevCollect’s extension should stay thin: **install → redirect to** `https://app.revcollect.ai/onboarding/connect-zoho`. Product OAuth then uses:

`ZohoBooks.invoices.READ`, `ZohoBooks.contacts.READ`, `ZohoBooks.customerpayments.READ`, `ZohoBooks.settings.READ`, `AaaServer.profile.Read`

Repo stub: [`marketplace/zoho-books-extension/`](../marketplace/zoho-books-extension/) (`plugin-manifest.json` `redirect_url` must be the **production** origin before submit).

Reviewers will check:

| Rule | What to do |
| --- | --- |
| Name must **not** contain “Zoho Books” | Call it **RevCollect** (or “RevCollect AR”), not “RevCollect for Zoho Books” |
| ≤ **5 custom fields per module** | Add none unless you have a hard need |
| No unused components / scripts | Keep the extension a redirect, not a mini-app |
| Install / uninstall must be clean | No leftover custom fields; describe what is collected |
| OAuth connections: least scopes; authorize URL includes `access_type=offline` | Match the server OAuth app |
| Connection name | `{Service}-{Extension}` PascalCase, e.g. `ZohoBooks-RevCollect` |
| Third-party data transfer | **Explicit in the listing**: invoice/contact/payment data goes to RevCollect; mail is sent via **Gmail** (separate Google account) |
| Widgets | If you add any, match Zoho Books UI; **no** `console` of customer data |
| Help + support | Install/setup guide + email (and phone if you have it) |
| Performance | Do not hammer Books APIs from Deluge; ingest stays on our servers |

Do not build the collections inbox inside Zoho. Do not add Zoho Mail as a send channel for this listing.

### 3. Partner Console listing form

Create a [Marketplace company profile](https://www.zoho.com/marketplace/help-guide/listing-marketplace.html) first.

**Assets (png/jpg/jpeg):**

| Asset | Spec (Partner Console) |
| --- | --- |
| App icon | 180×180, max 1MB |
| Thumbnail | 740×340, max 1MB |
| Screenshots | max 2MB each |
| (Developer help also cites logo 120×120 and banner 310×142 for some extension UIs) | Provide both sets if the Sigma form asks |

**URLs they ask for** (use production; “N/A” only if the field is optional and you truly have none):

| Field | Use |
| --- | --- |
| Privacy | `https://app.revcollect.ai/privacy` |
| Terms | `https://app.revcollect.ai/terms` |
| Website | `https://app.revcollect.ai/launch` |
| Installation | Redirect to vendor site → `/onboarding/connect-zoho` |
| Admin / user guide / FAQ / help doc | You still need a short public help page or Notion/doc URL (not in the app today) |
| Help video | Same connect → inbox → Gmail send recording |
| Case studies | Optional until you have one |

**Copy:**

- Tagline (one line)
- Description (what it solves; **disclose Gmail + RevCollect hosting**)
- At most **four** key features
- Release notes
- Category + “Integration with: Zoho Books”
- Compatible **editions** of Zoho Books
- **Pricing:** free vs paid. Paid: one-time / recurring / annual. You can attach a trial. **Price cannot change for 30 business days** after listing.
- **DC availability** (US / EU / IN, etc.) — must match `ZOHO_ACCOUNTS_URL` / `ZOHO_API_BASE` you actually run (`zohoapis.com` vs `.eu` / `.in`)
- Optional extra listing languages: Chinese, Japanese

**Developer profile:** company name, logo 120×120, address, description, contact email, phone.

### 4. Founder checklist (Zoho)

- [ ] Zoho API Console production OAuth client; redirect `https://app.revcollect.ai/api/integrations/zoho/callback` and signup `/api/auth/zoho/callback`
- [ ] Vercel env: `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, region URLs for each DC you claim
- [ ] Sigma extension: production `redirect_url`, no “Zoho Books” in the name, zero extra custom fields
- [ ] Sandbox install → lands on RevCollect connect → ingest works
- [ ] Publish privately → pass Finance review (5–7+ days)
- [ ] Marketplace company profile
- [ ] Icons, screenshots, help doc, video, pricing, DC list, Gmail disclosure
- [ ] Submit to Marketplace → Partner Console
- [ ] Respond in Partner Console Inbox if reviewers ask

**Already in product:** Zoho OAuth ingest, Sign in with Zoho, connect/disconnect pages, extension stub.

**Still founder/ops:** Sigma in Developer Portal (the git stub is not a published extension), private review, Partner Console assets, help doc URL, production Zoho keys, DC decision.

---

## Shared packet (do once, reuse)

1. **Help article** — install from store → authorize books → connect Gmail → first send. Host it publicly and paste the URL into both listings.
2. **Screen recording** — same path; export a cut that only shows QuickBooks and a cut that only shows Zoho Books (Intuit does not want other books logins in their screenshots).
3. **Security one-pager** — tenant isolation, encryption, sub-processors (Google, Anthropic/OpenAI, Vercel, Supabase, Stripe), inference-only AI, no training on books data. Point at `/security` and `/sub-processors`.
4. **Pricing** — $49 USD/month workspace, $39 USD/month Agent after 30-day no-card trial; read-only if unpaid. State currency on both stores.
5. **Support** — `hello@revcollect.ai` monitored; incident path if ingest or send fails ([incident-response.md](./incident-response.md)).

---

## Order of work

1. Intuit **questionnaire + production keys** (needed to serve real QBO customers, listing or not).
2. **Silver** only when you are ready to list or need Premium APIs / uncapped CorePlus.
3. Intuit listing submit (budget time for **security** review).
4. In parallel, finish Sigma extension + **private** Zoho review (faster calendar than Intuit if the extension stays a redirect).
5. Zoho Marketplace submit after private approval.

Xero listing remains a separate founder track ([marketplace-listings.md](./marketplace-listings.md)). It does not block these two, but do not reuse Xero screenshots on Intuit or Zoho listings.
