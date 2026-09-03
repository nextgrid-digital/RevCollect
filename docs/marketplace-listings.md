# Marketplace listing copy and founder checklist

Do not put “Xero”, “QuickBooks”, or “Zoho” in the RevCollect product name.

## Positioning (all stores)

Drafts, you send. Your ledger is the books. Gmail is the mail. RevCollect does not auto-email clients.

Support inbox for listings: hello@revcollect.ai

Public URLs:

- Privacy: `/privacy`
- Terms: `/terms`
- Security: `/security`
- Sub-processors: `/sub-processors`
- Launch: `/launch`
- Connect QuickBooks: `/onboarding/connect-quickbooks` (listing alias `/connect/quickbooks`)
- Disconnect pages: `/disconnect/xero`, `/disconnect/quickbooks`, `/disconnect/zoho`

Demo video for reviewers: connect books → inbox → send from Gmail.

## Xero App Store (do this first)

Founder-only (not in this repo):

- [ ] Move the Xero app to Plus (~$245 AUD/month) with a card on file
- [ ] Apply for app certification
- [ ] Line up ~10 bookkeepers who will confirm they use it
- [ ] Register `XERO_SIGNUP_REDIRECT_URI` (`/api/auth/xero/callback`) on the Xero app
- [ ] Submit listing in receivables / collections
- [ ] Annual recert; keep `docs/xero-partner-compliance.md` in lockstep with AI Gateway

In-app already: Continue with Xero, Connect with Xero / Disconnect from Xero, org name, reconnect after revoke.

## Intuit App Marketplace

Founder-only:

- [ ] Complete the app assessment questionnaire (required for production keys even if you never list)
- [ ] Production keys after approval
- [ ] Silver partner if you want a store listing (Builder cannot keep a listing)
- [ ] Register Sign in with Intuit redirect `/api/auth/intuit/callback`

Listing URLs: launch `/launch`, connect `/onboarding/connect-quickbooks`, disconnect `/disconnect/quickbooks`.

## Zoho Marketplace

Product is server OAuth (already in app). Marketplace listing is a thin Sigma extension in `marketplace/zoho-books-extension/`: install → deep-link to RevCollect connect. Name must not include “Zoho Books”.
