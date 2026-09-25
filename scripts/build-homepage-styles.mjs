import { readFile, writeFile } from 'node:fs/promises';
import Beasties from 'beasties';

// Render the real components without a server, database, or production data.
// Include both case-study states so their styles are available before hydration.
process.env.INERTIA_SSR_BUILD_ONLY = 'true';
const { renderPage } = await import('../bootstrap/ssr/ssr.js');
const manifest = JSON.parse(await readFile('public/build/manifest.json', 'utf8'));
const stylesheets = manifest['resources/js/app.tsx'].css;
if (stylesheets?.length !== 1) throw new Error('Expected one application stylesheet');
const stylesheet = stylesheets[0];
const study = {
  slug: 'preview', codename: 'Preview', client: 'Client', industry: 'Industry',
  duration: 'Duration', headlineOutcome: 'Outcome', problem: 'Problem',
  techStack: ['React'], url: '/case-studies/preview', coverImageUrl: '/preview.webp',
};
const pages = await Promise.all([[], [study]].map(featuredCaseStudies => renderPage({
  component: 'Homepage', url: '/', version: 'build',
  props: { errors: {}, auth: { user: null }, featuredCaseStudies, caseStudiesByService: {}, newsletter: { subscriberCount: 2 } },
})));
const processor = new Beasties({
  path: 'public', publicPath: '/', pruneSource: false, preload: false,
  fonts: false, keyframes: 'all', logLevel: 'warn',
  // These Tailwind rules use nested child selectors; retain them even when
  // the static selector matcher cannot resolve the nesting parent.
  allowRules: [/space-[xy]-/, /divide-/, /marquee-track/],
});
const result = await processor.process(`<!doctype html><html><head><link rel="stylesheet" href="/build/${stylesheet}"></head><body class="font-sans antialiased">${pages.map(page => page.body).join('')}</body></html>`);
const css = [...result.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(match => match[1]).join('\n');
if (!css || /<\/style/i.test(css)) throw new Error('Invalid critical stylesheet');
await writeFile('public/build/homepage-styles.json', JSON.stringify({ stylesheet, css }));
console.log(`Homepage critical CSS: ${Buffer.byteLength(css)} bytes`);
