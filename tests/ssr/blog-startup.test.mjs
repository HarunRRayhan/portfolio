import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const manifest = JSON.parse(await readFile('public/build/manifest.json', 'utf8'))
function staticFiles(key, seen = new Set()) {
  if (seen.has(key)) return seen
  seen.add(key)
  for (const dependency of manifest[key]?.imports ?? []) staticFiles(dependency, seen)
  return seen
}
for (const page of ['resources/js/Pages/Blog/Index.tsx', 'resources/js/Pages/Blog/Post.tsx']) {
  const dependencies = staticFiles(page)
  staticFiles('resources/js/app.tsx', dependencies)
  const startup = (await Promise.all([...dependencies].map(key => readFile(`public/build/${manifest[key].file}`, 'utf8')))).join('')
  assert.ok(!startup.includes('Share link'), `${page} eagerly includes the share dialog`)
}
console.log('Blog startup: share dialog excluded from static dependency closures')
