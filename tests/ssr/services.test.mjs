import assert from 'node:assert/strict'

process.env.INERTIA_SSR_BUILD_ONLY = 'true'
const { renderPage } = await import('../../bootstrap/ssr/ssr.js')

const seo = {
  title: 'Services',
  description: 'What I can help with',
  canonicalUrl: 'https://example.test/services',
  jsonLd: [],
}

const base = {
  version: 'test',
  props: {
    errors: {},
    auth: { user: null },
    newsletter: { subscriberCount: 0 },
    seo,
    serviceReading: [
      { title: 'A related post', url: '/blog/ecs-fargate-spot-capacity-providers', brief: 'Spot capacity.' },
    ],
    caseStudiesByService: {},
    serviceIndex: [
      {
        title: 'Performance Optimization',
        path: '/services/performance-optimization',
        description: 'I measure the slow path, fix that, and stop paying for capacity you aren\'t using.',
        group: 'aws',
      },
    ],
  },
}

const hub = await renderPage({ ...base, component: 'Services', url: '/services' })
assert.match(hub.body, /What I can help with/)
assert.match(hub.body, /href="\/services\/performance-optimization"/)
assert.match(hub.body, />Services</)

const page = await renderPage({
  ...base,
  component: 'Services/PerformanceOptimization',
  url: '/services/performance-optimization',
})
assert.match(page.body, /Performance Optimization/)
assert.match(page.body, /What I do/)
assert.match(page.body, /href="\/blog\/ecs-fargate-spot-capacity-providers"/)

const products = await renderPage({ ...base, component: 'Products', url: '/products' })
assert.match(products.body, /CloudPloy/)
assert.match(products.body, /href="\/services"/)

console.log('SSR services: hub links, performance page, products, and footer pass')
