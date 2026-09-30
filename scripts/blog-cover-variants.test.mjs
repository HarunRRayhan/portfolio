import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, copyFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { generateBlogCoverVariants } from './build-blog-cover-variants.mjs'

test('generates bounded responsive covers with content hashes and skips unrelated files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cover-variants-'))
  try {
    await mkdir(join(root, 'example'))
    await sharp({ create: { width: 1600, height: 840, channels: 3, background: '#123456' } }).jpeg().toFile(join(root, 'example/cover.jpg'))
    await copyFile(join(root, 'example/cover.jpg'), join(root, 'example/cover-v3.jpg'))
    const manifest = await generateBlogCoverVariants(root)
    assert.ok(manifest['/blog-assets/example/cover-v3.jpg'], 'versioned covers receive variants too')
    const variants = manifest['/blog-assets/example/cover.jpg']
    assert.deepEqual(variants.map(item => item.width), [480, 960])
    for (const item of variants) {
      const image = await sharp(join(root, item.path.replace('/blog-assets/', ''))).metadata()
      assert.equal(image.width, item.width)
      assert.equal(image.format, 'webp')
    }
    assert.deepEqual(JSON.parse(await readFile(join(root, 'card-variants/manifest.json'), 'utf8')), manifest)
    await sharp({ create: { width: 200, height: 100, channels: 3, background: '#abcdef' } }).jpeg().toFile(join(root, 'example/cover.jpg'))
    const next = await generateBlogCoverVariants(root)
    assert.deepEqual(next['/blog-assets/example/cover.jpg'].map(item => item.width), [200])
    assert.notEqual(next['/blog-assets/example/cover.jpg'][0].path, variants[0].path)
    await sharp({ create: { width: 1600, height: 200, channels: 3, background: '#123456' } }).withMetadata({ orientation: 6 }).jpeg().toFile(join(root, 'example/cover.jpg'))
    const rotated = await generateBlogCoverVariants(root)
    assert.deepEqual(rotated['/blog-assets/example/cover.jpg'].map(item => item.width), [200])
  } finally { await rm(root, { recursive: true, force: true }) }
})
