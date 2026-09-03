# RevCollect — Zoho Books Marketplace extension

This is a thin Sigma extension, not the product. The product is server-based OAuth ingest (`/onboarding/connect-zoho`).

## Behaviour

1. User installs the extension from Zoho Marketplace.
2. The extension redirects to RevCollect (`NEXT_PUBLIC_APP_URL` + `/onboarding/connect-zoho`).
3. User authorizes Zoho Books OAuth. Gmail remains the send channel.

Do not put “Zoho Books” in the public app name. Keep custom fields under Marketplace limits. Private review, then Submit to Marketplace.

Replace `redirect_url` in `plugin-manifest.json` with the production origin when you submit.
