# Homepage Lighthouse 90+ design

## Goal

Raise the standard Lighthouse categories to at least 90 for the public homepage (`https://harun.dev/`) in both Mobile and Desktop PageSpeed reports. The categories are Performance, Accessibility, Best Practices, and SEO. Deploy the verified changes and rerun PageSpeed against production.

## Current production baseline

PageSpeed Insights, Lighthouse 13.5, captured Sep 29, 2026 at 10:24 GMT+6:

| Category | Mobile | Desktop |
|---|---:|---:|
| Performance | 76 | 99 |
| Accessibility | 86 | 86 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |

Mobile metrics: FCP 2.9 s, LCP 3.2 s, TBT 60 ms, CLS 0.246, and Speed Index 2.9 s. The PageSpeed layout-shift report attributes all 0.246 CLS to the hero paragraph. It also reports 125 KiB of unused JavaScript and four long tasks. Accessibility reports insufficient contrast, links without discernible names, and undersized or closely spaced touch targets.

## Design

1. Keep the audited public homepage as the score target and preserve its current visual direction and content.
2. Trace the hero paragraph's layout shift to its actual source, then stabilize its initial and final layout. Check font loading, stylesheet timing, and hydration before selecting the fix.
3. Inspect the mobile LCP breakdown and network dependency path. Reduce the measured bottleneck in initial rendering; consider splitting or deferring below-the-fold JavaScript only where the report and local trace confirm it helps without delaying visible content or interactions.
4. Resolve the homepage Accessibility findings for contrast, discernible link names, and target size. Keep the two already-green categories at 90 or higher after those changes.
5. Preserve the existing server-rendered homepage, navigation, section content, and interaction behavior.

## Verification and release

- Run the project build and relevant feature tests, then review the homepage on mobile and desktop in an isolated local browser.
- Run local Lighthouse in both form factors to compare with the production baseline.
- Deploy through the existing production workflow, verify the web and scheduler deployments and asset-sync workflow, then rerun production PageSpeed on mobile and desktop.
- Success requires Performance, Accessibility, Best Practices, and SEO to each score 90 or higher on both production reports. If a score misses, use that report to guide another targeted iteration before calling the task complete.

## Scope limits

This design targets the homepage URL. Other site routes are not included in the score threshold. It does not change database schema or introduce new runtime dependencies.
