import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

// Local covers only: builds never download arbitrary frontmatter URLs.
export async function generateBlogCoverVariants(root) {
  const output = join(root, 'card-variants')
  await mkdir(output, { recursive: true })
  const manifest = {}
  for (const directory of (await readdir(root, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!directory.isDirectory() || directory.name === 'card-variants') continue
    for (const file of await readdir(join(root, directory.name), { withFileTypes: true })) {
      if (!file.isFile() || !/^cover(?:-[a-z0-9]+)*\.(jpe?g|png|webp)$/i.test(file.name)) continue
      const source = await readFile(join(root, directory.name, file.name))
      const hash = createHash('sha256').update(source).digest('hex').slice(0, 12)
      const metadata = await sharp(source).metadata()
      const orientedWidth = metadata.autoOrient.width
      if (!orientedWidth) continue
      const widths = [...new Set([480, 960].map(width => Math.min(width, orientedWidth)))]
      const variants = []
      for (const width of widths) {
        const name = `${directory.name}-${hash}-${width}.webp`
        await sharp(source).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(join(output, name))
        variants.push({ path: `/blog-assets/card-variants/${name}`, width })
      }
      manifest[`/blog-assets/${directory.name}/${file.name}`] = variants
    }
  }
  await writeFile(join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  return manifest
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = await generateBlogCoverVariants(fileURLToPath(new URL('../public/blog-assets', import.meta.url)))
  console.log(`Generated responsive variants for ${Object.keys(manifest).length} local blog covers.`)
}
