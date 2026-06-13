#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const args = process.argv.slice(2)
const clean = args.includes('--clean')
const positionalArgs = args.filter((arg) => !arg.startsWith('--'))

const defaultSourceDir = path.join(os.homedir(), 'Code', 'blog-writer', 'output')
const defaultTargetDir = path.join(process.cwd(), 'resources', 'blog', 'posts')

const sourceDir = path.resolve(positionalArgs[0] ?? defaultSourceDir)
const targetDir = path.resolve(positionalArgs[1] ?? defaultTargetDir)

async function pathExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function main() {
  if (!(await pathExists(sourceDir))) {
    throw new Error(`Source directory not found: ${sourceDir}`)
  }

  await fs.mkdir(targetDir, { recursive: true })

  const entries = await fs.readdir(sourceDir, { withFileTypes: true })
  const synced = []
  const sourceSlugs = new Set()

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const slug = entry.name
    const sourcePostPath = path.join(sourceDir, slug, 'post.md')
    if (!(await pathExists(sourcePostPath))) continue

    const targetPostPath = path.join(targetDir, `${slug}.md`)
    const contents = await fs.readFile(sourcePostPath, 'utf8')
    await fs.writeFile(targetPostPath, contents)

    sourceSlugs.add(slug)
    synced.push(slug)
  }

  let removed = []
  if (clean) {
    const existing = await fs.readdir(targetDir)
    for (const fileName of existing) {
      if (!fileName.endsWith('.md')) continue
      const slug = path.basename(fileName, '.md')
      if (!sourceSlugs.has(slug)) {
        await fs.unlink(path.join(targetDir, fileName))
        removed.push(slug)
      }
    }
  }

  console.log(`Synced ${synced.length} post(s) from ${sourceDir} -> ${targetDir}`)
  if (removed.length > 0) {
    console.log(`Removed ${removed.length} stale post(s): ${removed.join(', ')}`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
