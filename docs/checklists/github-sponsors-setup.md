# GitHub Sponsors setup checklist

Consultation payments run through GitHub Sponsors. Do these once, by hand. Code details: `CLAUDE.md` > Infra.

## Sponsors dashboard
- [ ] Create three one-time tiers: Light $149, Pro $249, Max $349.
- [ ] Create one monthly tier: $499.
- [ ] Welcome message on every tier: "Sign in at harun.dev/consultation with GitHub to book. One-time credits must be used within 60 days."

## Webhook
- [ ] Add a webhook in the Sponsors dashboard.
- [ ] URL `https://harun.dev/github/sponsors/webhook`, content type `application/json`.
- [ ] Secret: generate one, save it as `GITHUB_SPONSORS_WEBHOOK_SECRET` in `.secrets/github.env`.
- [ ] Events: "Sponsorship" only.

## Tier ids
- [ ] Get each tier's node id:
  `gh api graphql -f query='query { viewer { sponsorsListing { tiers(first: 20) { nodes { id name monthlyPriceInDollars isOneTime } } } } }'`
- [ ] Copy each tier's public URL from the dashboard.
- [ ] Set `GITHUB_SPONSORS_TIER_LIGHT`, `_PRO`, `_MAX`, `_MONTHLY` (node ids) and the matching `_URL` vars.
- [ ] Put the secret and all tier vars on Railway `web` AND `scheduler`.

## After deploy
- [ ] `php artisan consultations:retire-unpaid --dry-run`, check the list, then run it without `--dry-run`.
- [ ] Send a test sponsorship, or redeliver a webhook from the dashboard.
- [ ] Check `/admin/sponsorships` shows the credit.
