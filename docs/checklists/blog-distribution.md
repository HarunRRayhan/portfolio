# Blog distribution checklist

Automatic (no action): dev.to copy 3 days after publish, IndexNow + WebSub ping, Bluesky + Mastodon
announcement the minute the post is live. Details: `CLAUDE.md` > Blog > Cross-posting.

Do these by hand for each post, after it is live on harun.dev.

## Medium (once the post is live; canonical link is set by the importer)
- [ ] Open the post while logged in as admin, click **Publish to Medium** (bottom right), then **Copy URL and open Medium import**.
- [ ] Paste the URL into Medium's importer, import, check formatting (code blocks, tables, figures), publish.
- [ ] Back on the post, paste the Medium story URL and click **Mark published on Medium**.

## Once only (feed and sitemap)
- [ ] Google Search Console: submit `https://harun.dev/sitemap.xml`.
- [ ] Bing Webmaster Tools: submit the sitemap (IndexNow already covers new URLs).
- [ ] Flipboard: create a magazine and add `https://harun.dev/blog/feed.xml`.
- [ ] Feedspot: submit the blog to their directory.
- [ ] daily.dev: nothing to submit, it ingests the dev.to copy. Personal blogs are rejected.

## Per post, only when it fits
- [ ] Laravel News link submission (Laravel posts).
- [ ] Reddit (r/laravel, r/aws, r/devops): post by hand, follow each sub's self-promotion rules.
- [ ] Hacker News: submit by hand, only for posts with something new to say.
- [ ] LinkedIn: share the link with a short take.

## Backlinks (ongoing)
- [ ] Open a PR adding the post to a relevant GitHub "awesome" list.
- [ ] Answer questions on Stack Overflow or Reddit and link the post where it really helps.
- [ ] Guest posts that link back to a relevant article.
