# Homepage Lighthouse 90+ implementation plan

## Goal

Reach at least 90 in Performance, Accessibility, Best Practices, and SEO for both mobile and desktop Lighthouse reports on `https://harun.dev/`, deploy the changes, and record fresh production results.

## Task 1: Reproduce the report findings and establish checks

- Production mobile details: CLS 0.246 is entirely on the hero paragraph; LCP is the hero heading with 580 ms render delay; the critical request chain includes Cloudflare RUM at 946 ms; 125 KiB unused JavaScript is reported.
- Production accessibility details: low-contrast slate text on light and terminal backgrounds, an unnamed logo-only home link, and 8px testimonial pagination buttons.
- Add or extend focused checks for homepage accessible link names, contrast-safe text tokens, and lazy loading of below-the-fold sections.
- Confirm the pre-change local build and relevant feature tests, using an isolated SQLite database and leaving `.env` untouched.

## Task 2: Fix homepage accessibility failures

- Update the homepage component files identified in the Lighthouse contrast report to use readable text colors on their actual backgrounds.
- Add accessible names to any homepage links Lighthouse identifies as unnamed.
- Increase the reported mobile target sizes/spacing without changing the desktop layout.
- Run focused checks and review the homepage at mobile and desktop widths.

## Task 3: Improve mobile rendering and startup cost

- Trace the hero paragraph shift to font, stylesheet, or hydration timing; make the initial/final paragraph geometry stable.
- Use the hero heading's render delay and unused-JavaScript findings to prioritize a small, measured change; preserve SSR and visible interactions.
- Build and retest locally in both Lighthouse form factors. Keep the already-green Best Practices and SEO categories at 90 or above.

## Task 4: Deploy and verify production

- Commit the reviewed implementation and deploy through the existing Railway plus frontend asset-sync release path.
- Verify the web and scheduler deployments, asset-sync workflow result, published asset manifest, and live response.
- Rerun PageSpeed/Lighthouse for mobile and desktop, record all four category scores and performance metrics, and iterate on any result below 90.

## Constraints

- Scope is the public homepage URL only.
- Preserve content, visual direction, SSR, and existing navigation/interaction behavior.
- Do not modify database schema or add runtime dependencies.
- Do not edit, replace, or expose `.env` or secrets.
