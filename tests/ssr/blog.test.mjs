import assert from 'node:assert/strict'
process.env.INERTIA_SSR_BUILD_ONLY = 'true'
const { renderPage } = await import('../../bootstrap/ssr/ssr.js')
const post = {
  title: 'Published SSR article', slug: 'published', brief: 'Readable without JavaScript',
  publishedAtHuman: 'September 30, 2026', publishedAtIso: '2026-09-30T00:00:00Z',
  readTimeLabel: '2 min', reactionCount: 0, responseCount: 0, replyCount: 0,
  coverImageAlt: '', isDraft: false, viewCount: 0, tags: [], url: '/blog/published',
  canonicalUrl: 'https://example.test/blog/published', shareUrl: 'https://example.test/blog/published',
  sourceUrl: '', contentHtml: '<p>Article body available before hydration.</p>',
}
const base = {
  version: 'test', props: {
    errors: {}, auth: { user: null }, newsletter: { subscriberCount: 0 },
    canonicalUrl: 'https://example.test/blog', posts: [post], post,
    publication: { title: 'Blog', url: 'https://example.test/blog', host: 'example.test' },
    relatedPosts: [], siteUrl: 'https://example.test', comments: [], commentCount: 0,
    seo: { title: 'Blog', description: 'Published articles', canonicalUrl: 'https://example.test/blog', jsonLd: [] },
  },
}
const index = await renderPage({ ...base, component: 'Blog/Index', url: '/blog' })
assert.match(index.body, /Engineering notes/)
assert.match(index.body, /Published SSR article/)
const filtered = await renderPage({ ...base, component: 'Blog/Index', url: '/blog?q=nonexistent' })
assert.match(filtered.body, /No articles found/)
assert.doesNotMatch(filtered.body, /<h3[^>]*>Published SSR article/)
const article = await renderPage({ ...base, component: 'Blog/Post', url: post.url })
assert.match(article.body, /Article body available before hydration/)
assert.equal((article.head.join('').match(/rel="canonical"/g) ?? []).length, 1)
for (const component of ['Dashboard', 'Admin/Posts/Index', 'Book']) {
  await assert.rejects(() => renderPage({ ...base, component, url: '/admin' }), /SSR is not enabled/)
}
await assert.rejects(() => renderPage({ ...base, component: 'Blog/Post', url: '/blog/published/draft/token', props: { ...base.props, post: { ...post, isDraft: true } } }), /SSR is not enabled/)
console.log('SSR Blog: index, URL filters, article body, metadata and private/draft boundaries pass')
