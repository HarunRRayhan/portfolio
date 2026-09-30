import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync, existsSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:net'

process.chdir(fileURLToPath(new URL('..', import.meta.url)))
const temporary = mkdtempSync(join(tmpdir(), 'harundev-browser-'))
const database = join(temporary, 'database.sqlite')
const reservation = createServer()
await new Promise((resolve, reject) => {
  reservation.once('error', reject)
  reservation.listen(0, '127.0.0.1', resolve)
})
const port = reservation.address().port
await new Promise(resolve => reservation.close(resolve))
const baseURL = `http://127.0.0.1:${port}`
const env = {
  ...process.env,
  APP_ENV: 'local', APP_URL: baseURL, APP_DEBUG: 'false',
  APP_KEY: 'base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  APP_CONFIG_CACHE: join(temporary, 'config.php'),
  APP_ROUTES_CACHE: join(temporary, 'routes.php'),
  DB_CONNECTION: 'sqlite', DB_DATABASE: database, DB_URL: '',
  CACHE_STORE: 'array', SESSION_DRIVER: 'database', SESSION_DOMAIN: '',
  SESSION_SECURE_COOKIE: 'false', SESSION_COOKIE: 'browser_test_session',
  MAIL_MAILER: 'array', QUEUE_CONNECTION: 'sync', INERTIA_SSR_ENABLED: 'false',
  ASSET_URL: '', GA4_MEASUREMENT_ID: '',
  STRIPE_KEY: '', STRIPE_SECRET: '', STRIPE_WEBHOOK_SECRET: '', STRIPE_SPONSOR_SECRET: '',
  GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '',
  GITHUB_CLIENT_ID: '', GITHUB_CLIENT_SECRET: '',
  CONSULTATION_GOOGLE_CLIENT_ID: '', CONSULTATION_GOOGLE_CLIENT_SECRET: '',
  SKALEAGENTS_BOOKING_HANDOFF_ENABLED: 'false',
  BROWSER_TEST_RUN: '1', BROWSER_TEST_BASE_URL: baseURL,
}
delete env.NO_COLOR
let server
let tests
let cleaned = false
function cleanup() {
  if (cleaned) return
  cleaned = true
  tests?.kill('SIGTERM')
  server?.kill('SIGTERM')
  rmSync(temporary, { recursive: true, force: true })
}
process.on('exit', cleanup)
process.on('SIGINT', () => process.exit(130))
process.on('SIGTERM', () => process.exit(143))

function run(command, args) {
  const result = spawnSync(command, args, { env, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

try {
  // Copy a local fixture when present; otherwise migrations create a fresh database.
  if (existsSync('database/database.sqlite')) copyFileSync('database/database.sqlite', database)
  else writeFileSync(database, '')
  run('php', ['artisan', 'migrate', '--force'])
  run('php', ['tests/browser/seed.php'])
  // Direct PHP server keeps the listener in the owned child process for cleanup.
  server = spawn('php', ['-S', `127.0.0.1:${port}`, '../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php'], {
    env, cwd: 'public', stdio: 'ignore',
  })
  let started = false
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (server.exitCode !== null) throw new Error('Local browser server could not start.')
    try {
      const response = await fetch(`${baseURL}/up`)
      if (response.ok) { started = true; break }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  if (!started) throw new Error('Local browser server did not become ready.')
  tests = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--config', 'tests/browser/playwright.config.ts', ...process.argv.slice(2)], {
    env, stdio: 'inherit',
  })
  process.exitCode = await new Promise((resolve, reject) => {
    tests.on('error', reject)
    tests.on('exit', code => resolve(code ?? 1))
  })
} finally {
  cleanup()
}
