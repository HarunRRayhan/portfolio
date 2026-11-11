# GitHub Sponsors setup checklist

Consultation payments run through GitHub Sponsors. Done 2026-11-03 (tiers 677329-677332, webhook 706850459, Railway vars set, end-to-end test passed). Do these once, by hand. Code details: `CLAUDE.md` > Infra.

## Sponsors dashboard
- [x] Create three one-time tiers: Light $449, Max $599, Ultra $999.
- [x] Create one monthly tier: $499.
- [x] Welcome message on every tier: "Sign in at harun.dev/consultation with GitHub to book. One-time credits must be used within 60 days."

## Webhook
- [x] Add a webhook in the Sponsors dashboard.
- [x] URL `https://harun.dev/github/sponsors/webhook`, content type `application/json`.
- [x] Secret: generate one, save it as `GITHUB_SPONSORS_WEBHOOK_SECRET` in `.secrets/github.env`.
- [x] Events: "Sponsorship" only.

## Tier ids
- [x] Get each tier's node id:
  `gh api graphql -f query='query { viewer { sponsorsListing { tiers(first: 20) { nodes { id name monthlyPriceInDollars isOneTime } } } } }'`
- [x] Copy each tier's public URL from the dashboard.
- [x] Set `GITHUB_SPONSORS_TIER_LIGHT`, `_PRO`, `_MAX`, `_MONTHLY` (node ids) and the matching `_URL` vars.
- [x] Put the secret and all tier vars on Railway `web` AND `scheduler`.

## After deploy
- [x] Send a test sponsorship, or redeliver a webhook from the dashboard.
- [x] Check `/admin/sponsorships` shows the credit.
