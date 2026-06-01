# Blog Migration Operator Checklist

## Completion state
- Finite migration work is complete and verified.
- Post-launch monitoring remains ongoing by nature and is listed as a standing watchlist rather than a one-time checkbox.

## Recursive status snapshot
- Repository scan complete: canonical blog routes, redirects, metadata, internal navigation, feed, and sitemap are already present in code.
- Source references remain clearly labeled and are not used as primary navigation.
- `resources/blog/publication.yml` stays on the historical source host so discussion links keep resolving.
- Live verification completed for the deployed site: browser render, response headers, redirect hop count, and health checks all checked out.

## Evidence map
- Canonical routes, feed, sitemap, and robots: `routes/web.php`
- Redirects and old-host handling: `deploy/terraform/main.tf`
- Primary nav and footer blog links: `resources/js/Components/Menubar.tsx`, `resources/js/Components/Footer.tsx`
- Blog canonical / OG / Twitter metadata: `resources/js/Pages/Blog/Index.tsx`, `resources/js/Pages/Blog/Post.tsx`
- Historical source references: `resources/blog/publication.yml`, `resources/js/Components/BlogDiscussion.tsx`

## Live verification snapshot
- `/blog` returns `200` and renders the blog index
- A sample post returns `200` and renders the article page
- Canonical tags and `og:url` both point at the canonical blog URLs
- `/blog/feed.xml` returns valid RSS/XML with canonical item links
- `/sitemap.xml` returns canonical blog URLs only
- `blog.harun.dev` returns `301` to the matching `harun.dev/blog/` URL
- Query strings are preserved through the redirect
- Old source links remain clearly labeled as historical references
- `/health` returns `200` with `status=ok`
- Google Search Console domain property exists for `sc-domain:harun.dev`
- Service account `gsc-agent@crontinel.iam.gserviceaccount.com` is an owner of the property
- `https://harun.dev/sitemap.xml` was submitted to Search Console
- Stale `https://blog.harun.dev/sitemap.xml` sitemap entry was removed from Search Console
- Response headers and browser state are clean on the verified pages

## Pre-flight
- [x] Confirm `harun.dev/blog` is the canonical destination
- [x] Confirm `blog.harun.dev` redirects permanently to `harun.dev/blog`
- [x] Confirm the redirect preserves path and query string
- [x] Confirm no redirect chains exist

## Code / content
- [x] Verify blog index and post pages load
- [x] Verify canonical tags point to `harun.dev/blog`
- [x] Verify `og:url` and Twitter metadata use the canonical URLs
- [x] Verify internal navigation points to `harun.dev/blog`
- [x] Verify no visible UI links still point to `blog.harun.dev`
- [x] Verify blog post body links use the new canonical URLs where appropriate
- [x] Verify archived/source references are clearly labeled

## SEO surfaces
- [x] Verify `sitemap.xml` contains only canonical blog URLs
- [x] Verify `robots.txt` references the sitemap
- [x] Verify `/blog/feed.xml` returns valid XML
- [x] Verify old Hashnode URLs return `301` to the matching canonical URL
- [x] Verify the destination page returns `200`
- [x] Verify exactly one redirect hop is used

## Deployment
- [x] Deploy redirect and blog changes
- [x] Verify `/health`
- [x] Verify `/blog`
- [x] Verify one sample post
- [x] Verify the feed and sitemap
- [x] Verify a sample old Hashnode URL redirects correctly
- [x] Check response headers on canonical pages

## Post-launch monitoring
- Keep watching logs for old URL hits
- Keep watching for 404s
- Keep watching for redirect anomalies
- Keep watching for broken asset requests
- Keep watching for canonical mistakes in previews
- Keep watching for SEO or ranking issues
- Run `php artisan seo:ping-sitemap` after deploys or major content updates
- Submit/refresh `https://harun.dev/sitemap.xml` in Google Search Console after verification and important updates
- Keep the redirect in place indefinitely
