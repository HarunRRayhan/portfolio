import assert from 'node:assert/strict'

// Exercise the built React/Inertia renderer without a server or database.
process.env.INERTIA_SSR_BUILD_ONLY = 'true'
const { renderPage } = await import('../../bootstrap/ssr/ssr.js')
const canonical = 'https://example.test/'
const personName = 'A schema value </script><script>example</script>'
const page = await renderPage({
  component: 'Homepage', url: '/', version: 'test',
  props: {
    errors: {}, auth: { user: null }, featuredCaseStudies: [], caseStudiesByService: {},
    newsletter: { subscriberCount: 0 },
    siteJsonLd: [{ '@context': 'https://schema.org', '@type': 'Organization', name: 'Harun R. Rayhan' }],
    seo: {
      title: 'Harun R. Rayhan - Homepage', description: 'A single server-rendered description',
      canonicalUrl: canonical, ogImage: 'https://example.test/cover.jpg',
      jsonLd: [{ '@context': 'https://schema.org', '@type': 'Person', name: personName }],
    },
  },
})
const head = page.head.join('\n')
assert.equal((head.match(/<title\b/g) ?? []).length, 1)
assert.equal((head.match(/rel="canonical"/g) ?? []).length, 1)
assert.equal((head.match(/name="description"/g) ?? []).length, 1)
assert.match(head, /href="https:\/\/example.test\/"/)
assert.match(head, /data-inertia="canonical"/)
const schemas = [...head.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)]
assert.equal(schemas.length, 2)
assert.equal(JSON.parse(schemas[1][1]).name, personName)
assert.ok(!head.includes('</script><script>example'))
assert.match(page.body, /<h1\b/)
console.log('SSR SEO: one title, canonical, description; managed schemas round-trip safely')
