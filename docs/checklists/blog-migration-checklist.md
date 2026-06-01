# Full Blog Migration Checklist

## Completion state
- Finite migration work is complete and verified.
- Post-launch monitoring remains ongoing by nature and is listed as a standing watchlist rather than a one-time checkbox.


## 1) Canonical URL model
- [x] `https://harun.dev/blog` is the only canonical blog root
- [x] Every post keeps the same slug where possible
- [x] Old `blog.harun.dev` URLs map 1:1 to new URLs
- [x] Root `blog.harun.dev/` redirects to `https://harun.dev/blog/`
- [x] Article URLs redirect to `https://harun.dev/blog/{slug}`
- [x] Query strings are preserved
- [x] No redirect chains exist

## 2) Redirect implementation
- [x] `blog.harun.dev/*` returns `301 Moved Permanently`
- [x] Redirect preserves path
- [x] Redirect preserves query string
- [x] HTTPS works on the old host
- [x] No `302`, `307`, or temporary redirects are used
- [x] No old URL returns a 404 when a redirect should exist
- [x] Redirect remains permanent long term

## 3) Canonical tags and metadata
- [x] Blog index has canonical `https://harun.dev/blog`
- [x] Every post has canonical `https://harun.dev/blog/{slug}`
- [x] `og:url` matches the canonical URL
- [x] Twitter card metadata matches the canonical URL
- [x] Page titles are unique and descriptive
- [x] Meta descriptions are present and accurate
- [x] No old Hashnode URLs are used as canonicals

## 4) Internal navigation and links
- [x] Header / menubar blog link points to `https://harun.dev/blog`
- [x] Footer blog link points to `https://harun.dev/blog`
- [x] CTA buttons point to the canonical blog
- [x] No visible UI links still point to `blog.harun.dev`
- [x] External-link styling is correct where a link is truly external
- [x] Social/profile links do not mention the old domain unless intentional

## 5) Blog content links
- [x] Internal links inside posts point to the new canonical URLs
- [x] Legacy `blog.harun.dev` links inside post bodies are updated where appropriate
- [x] Old links in archived/source references remain only if they are explicitly labeled as archive material
- [x] Anchor links and deep links resolve correctly
- [x] Image and asset references still work

## 6) Blog content migration
- [x] All posts exist in the new blog source
- [x] Each post slug matches the intended canonical URL
- [x] Each post title is correct
- [x] Each post excerpt/brief is correct
- [x] Each post publish date is correct
- [x] Each post read time is correct
- [x] Each post tag list is correct
- [x] Cover images render correctly where present
- [x] Broken images are fixed or removed
- [x] Comments or discussion links still work on post pages

## 7) Sitemap and robots
- [x] `sitemap.xml` includes `/blog`
- [x] `sitemap.xml` includes every blog post URL
- [x] No old Hashnode URLs appear in the sitemap
- [x] `robots.txt` references the sitemap
- [x] Blog pages are crawlable
- [x] Old URLs are discoverable only through redirects

## 8) RSS / feed
- [x] `/blog/feed.xml` returns valid XML
- [x] Feed title is correct
- [x] Feed link is canonical
- [x] Feed items point to `https://harun.dev/blog/{slug}`
- [x] Feed descriptions are accurate
- [x] Feed item dates are correct
- [x] Feed validates in a reader

## 9) Publication / archive metadata
- [x] Decide whether the publication metadata should stay preserved
- [x] Confirm `resources/blog/publication.yml` is intentionally retained or should be updated
- [x] Confirm source links do not compete with the canonical site
- [x] Keep historical references only where they add value
- [x] Label legacy content clearly if shown to users

## 10) SEO protection
- [x] No duplicate canonical sources remain
- [x] Search engines can crawl the new site normally
- [x] Old Hashnode URLs redirect cleanly
- [x] Content text is preserved or improved
- [x] Slugs stay stable
- [x] Image alt text is retained
- [x] No accidental content truncation
- [x] Any structured data remains valid

## 11) Verification
- [x] Open `/blog` in a browser and confirm it renders
- [x] Open at least one sample post and confirm it renders
- [x] Confirm canonical tags are correct in page source
- [x] Confirm assets load successfully
- [x] Confirm there are no console errors
- [x] Confirm old `blog.harun.dev` URLs redirect correctly
- [x] Confirm destination URLs return `200`
- [x] Confirm redirect uses exactly one hop
- [x] Check response headers on canonical pages

## 12) Deployment
- [x] Deploy the redirect changes
- [x] Verify the live `/health` endpoint
- [x] Verify the live `/blog` endpoint
- [x] Verify a sample live post
- [x] Verify the live RSS feed
- [x] Verify the live sitemap
- [x] Verify the live redirect from an old Hashnode URL
- [x] Check response headers on canonical pages

## 13) Post-launch monitoring
- Ongoing watchlist; these are operational checks rather than one-time completion items.
- Watch logs for old URL hits
- Watch for 404s
- Watch for redirect anomalies
- Watch for broken asset requests
- Watch for canonical mistakes in previews
- Watch for SEO or ranking issues
- Keep the redirect in place indefinitely



