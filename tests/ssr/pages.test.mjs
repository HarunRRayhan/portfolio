import assert from 'node:assert/strict'

process.env.INERTIA_SSR_BUILD_ONLY = 'true'
const { renderPage } = await import('../../bootstrap/ssr/ssr.js')

const props = {
  errors: {},
  auth: { user: null },
  newsletter: { subscriberCount: 0 },
  seo: { title: 'Page', description: 'Page', canonicalUrl: 'https://example.test/', jsonLd: [] },
  serviceReading: [],
  caseStudiesByService: {},
  featuredCaseStudies: [],
}

// Crawlers that skip JavaScript need the heading, copy, and links in the first response.
for (const [component, url] of [['About', '/about'], ['Contact', '/contact'], ['Privacy', '/privacy'], ['Terms', '/terms']]) {
  const { body } = await renderPage({ version: 'test', component, url, props })
  assert.equal(body.match(/<h1/g)?.length, 1, `${component} renders one h1`)
  assert.match(body, /href="\/blog"/, `${component} renders site links`)
}

const bio = await renderPage({
  version: 'test',
  component: 'Bio',
  url: '/bio',
  props: { ...props, links: [], page_share_url: '/bio', tab_share_urls: {}, locale: 'en' },
})
assert.match(bio.body, /<h1/)

console.log('SSR pages: about, contact, legal, and bio render server-side')
