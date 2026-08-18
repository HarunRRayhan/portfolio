# Tailscale Worktree Dev Routing — Design Spec

**Date:** 2026-08-18
**Status:** Approved — moving to implementation plan

## 1. Summary

Give every local checkout of this repo — the main working copy and every `herdr` git worktree — a stable, HTTPS URL reachable from any device on Harun's tailnet, without hand-provisioning ports, dependencies, or reverse-proxy config each time a worktree is created.

- Main branch: `https://mx.ewe-ulmer.ts.net/harun.dev`
- Each worktree: `https://mx.ewe-ulmer.ts.net/{slug}-harun.dev`, where `{slug}` is a 6-character alphanumeric id generated once per worktree and persisted alongside it.

`mx.ewe-ulmer.ts.net` is this machine's (`Haruns-M2Max`) MagicDNS name on Harun's tailnet — `{ts_device_domain}` in the original request.

Worktree lifecycle (creation and removal) is driven automatically by a new `herdr` plugin. Provisioning symlinks the parts of a worktree that don't meaningfully vary by branch (`node_modules`, `vendor`, `.env`) back to the main checkout instead of reinstalling them, regenerates the parts that do vary by branch (`bootstrap/cache`), and starts the dev servers and Tailscale routes needed to serve that worktree independently.

## 2. Goals / Non-Goals

**Goals**
- One URL per checkout, stable across restarts, reachable from phone/other laptops on the tailnet.
- New worktrees are fully browsable within seconds of creation, no manual steps.
- Removing a worktree fully tears down its processes and routes — nothing leaks.
- Don't reinstall `node_modules`/`vendor` per worktree when the dependency tree hasn't diverged from main.
- Live Vite HMR works through the Tailscale route, not just a static build.

**Non-goals**
- Solving cross-worktree DB isolation. All worktrees share main's Postgres dev database (a consequence of symlinking `.env`); a migration run in one worktree affects all of them. Acceptable for solo local dev; not addressed further here.
- Handling worktrees whose branch has diverged `package.json`/`composer.json` from main. The symlink will point at dependencies that don't match; the escape hatch is manually breaking the symlink and installing locally in that one worktree.
- Production routing/deployment — this is local-machine dev tooling only, unrelated to `docker/traefik-dynamic.yml` or the Railway deploy path.
- Working for anyone not using `herdr`. Automatic provisioning is wired into `herdr`'s plugin events on purpose (§4.4) — it is not a general "any git worktree" solution. See §4.4.

## 2.1 Scope: development-only, herdr-only

Everything in this design lives under `scripts/tailscale-dev/` and `~/.herdr/plugins/tailscale-portfolio/` — entirely separate from `deploy/`, `docker/`, and CI, and never touched by them. `provision.sh`/`teardown.sh` refuse to run unless the target's `.env` resolves `APP_ENV=local`, as a canary against ever pointing this at anything but a local dev checkout. Nothing here is invoked by a deploy, a GitHub Action, or any production path.

Automatic triggering is `herdr`-only by design (§4.4) — this is dev-environment convenience tooling built around the worktree manager Harun actually uses, not a generic git-worktree feature.

## 3. Architecture

```
Any tailnet device (phone, other laptop)
  → https://mx.ewe-ulmer.ts.net/harun.dev            (main)
  → https://mx.ewe-ulmer.ts.net/{slug}-harun.dev      (worktree)
        │
        ▼
  tailscale serve  (path-mounted reverse proxy, native TLS on this device)
        │
        ├── /{slug}-harun.dev            → http://127.0.0.1:{backend_port}   (php artisan serve)
        └── /{slug}-harun.dev--vite      → http://127.0.0.1:{vite_port}      (vite dev server)
        │
        ▼
  herdr (worktree.created / worktree.removed / startup events)
        │
        ▼
  scripts/tailscale-dev/{provision,teardown}.sh
        │
        ├── symlinks: node_modules, vendor, .env  → main checkout's copies
        ├── regenerates: bootstrap/cache/*.php     (php artisan package:discover)
        ├── allocates: backend_port, vite_port     (registry.json)
        └── launches: artisan serve / queue:listen / pail / vite, records PIDs
```

Two `tailscale serve` mounts per checkout, not one, because Vite's dev server needs its own origin for asset/HMR URLs to resolve correctly — trying to serve both app and Vite assets under a single path is what breaks HMR in most reverse-proxied Vite setups. `/{slug}-harun.dev--vite` exists purely so Vite's `server.origin` and HMR client can point somewhere that survives the proxy hop.

## 4. Components

### 4.1 Slug + port registry

A single JSON file, `~/.config/herdr/plugins/config/tailscale-portfolio/registry.json`, is the source of truth for what's currently provisioned:

```json
{
  "/Users/rayhan/Code/haruns-portfolio": {
    "slug": "harun.dev",
    "backend_port": 8000,
    "vite_port": 5173,
    "pids": { "serve": 1234, "queue": 1235, "pail": 1236, "vite": 1237 }
  },
  "/Users/rayhan/.herdr/worktrees/haruns-portfolio/setup-tailscale-with-worktress": {
    "slug": "a3f9k2-harun.dev",
    "backend_port": 8101,
    "vite_port": 5181,
    "pids": { "serve": 2234, "queue": 2235, "pail": 2236, "vite": 2237 }
  }
}
```

- Main is a fixed entry with fixed ports (8000/5173 — its existing defaults), always present.
- Worktree ports are allocated from fixed ranges (backend `8100–8199`, vite `5180–5279`) by scanning the registry for the first unused pair. 100 concurrent worktrees is far beyond realistic use.
- The registry is the only place port/slug/PID state lives outside the worktree itself — rebuilding it (e.g. after a crash) means re-running provisioning for every path still on disk.
- The generated slug is also written to a gitignored `.tailscale-slug` file inside the worktree, so re-running provisioning against an existing worktree is idempotent (reuses the slug instead of minting a new one).

### 4.2 Provisioning script — `scripts/tailscale-dev/provision.sh <worktree-path>`

If `<worktree-path>` is the main checkout itself (`/Users/rayhan/Code/haruns-portfolio`), steps 1–2 and 4 are skipped — main already owns its real `node_modules`/`vendor`/`.env`/`bootstrap/cache`, nothing to symlink or regenerate. It always uses the fixed `harun.dev` slug and 8000/5173 ports (§4.1) and only needs steps 0, 3, 5, 6, 7.

0. Refuse to proceed unless `APP_ENV=local` in the (symlinked or real) `.env` this checkout resolves to — the canary from §2.1 against ever running this against anything but a local dev checkout.
1. If `.tailscale-slug` doesn't exist in the worktree, generate a 6-char lowercase-alphanumeric id (retry on registry collision) and write it.
2. Symlink `node_modules`, `vendor`, `.env` from the main checkout into the worktree, skipping any that are already correct symlinks. Refuse to clobber a real file/dir that isn't already our symlink (surface an error instead — this protects against overwriting someone's in-progress local install).
3. Allocate `backend_port`/`vite_port` from the registry (skip if this path already has an entry).
4. Run `php artisan package:discover --ansi` in the worktree to populate `bootstrap/cache/*.php` fresh. `storage/` needs no copying — git already ships the full directory skeleton per worktree (only contents are gitignored); it fills in naturally on first request.
5. Launch, in the background, with `APP_URL`/`ASSET_URL` exported to the Tailscale URL for this slug and `PORT`/`VITE_BASE_PATH`/Vite origin env vars set accordingly:
   - `php artisan serve --port=$BACKEND_PORT`
   - `php artisan queue:listen --tries=1`
   - `php artisan pail --timeout=0`
   - `npm run dev -- --port=$VITE_PORT`

   Record each PID in the registry.
6. `tailscale serve --bg --set-path=/$SLUG http://127.0.0.1:$BACKEND_PORT` and `--set-path=/$SLUG--vite http://127.0.0.1:$VITE_PORT`.
7. Print the final URL.

### 4.3 Teardown script — `scripts/tailscale-dev/teardown.sh <worktree-path>`

Reverse of provisioning: kill the recorded PIDs (process-group kill, not just the parent, so `npm run dev`'s child esbuild/vite processes don't linger), clear both `tailscale serve` mounts for the slug, remove the registry entry. Leaves the symlinks and `.tailscale-slug` file in place — harmless, and `git worktree remove` deletes the whole directory anyway.

### 4.4 herdr plugin — `~/.herdr/plugins/tailscale-portfolio/`

New plugin, following the existing `guard-main` plugin's shape (`herdr-plugin.toml` + shell scripts reading `HERDR_PLUGIN_EVENT_JSON`):

```toml
[[startup]]
command = ["bash", "-c", "exec bash \"$HERDR_PLUGIN_ROOT/reconcile.sh\""]

[[events]]
on = "worktree.created"
command = ["bash", "-c", "exec bash \"$HERDR_PLUGIN_ROOT/on-created.sh\""]

[[events]]
on = "worktree.removed"
command = ["bash", "-c", "exec bash \"$HERDR_PLUGIN_ROOT/on-removed.sh\""]
```

- `on-created.sh` / `on-removed.sh` extract the worktree path from `HERDR_PLUGIN_EVENT_JSON` and call `provision.sh` / `teardown.sh`.
- `reconcile.sh` runs on herdr startup (covers machine reboot, since neither the background dev processes nor `tailscale serve` config survive one): ensures main is provisioned, and re-provisions every path still recorded in the registry that still exists on disk; prunes registry entries whose path no longer exists.

**This is the only automatic trigger, and it only exists if `herdr` is installed and running.** A worktree created with a plain `git worktree add`, or on a machine without this plugin installed, is never seen by `herdr` and so no event ever fires for it — nothing is auto-provisioned, and nothing breaks either, since `provision.sh`/`teardown.sh` don't assume herdr exists at runtime (they take a plain path argument). herdr is purely the trigger; anyone not using it can still call the scripts by hand (`scripts/tailscale-dev/provision.sh <path>`), or just not use this feature at all.

### 4.5 `vite.config.js` change

Small, backward-compatible addition — reads optional env vars and falls back to today's behavior when they're unset:

```js
base: process.env.VITE_BASE_PATH || '/',
server: process.env.VITE_PUBLIC_ORIGIN ? {
  origin: process.env.VITE_PUBLIC_ORIGIN,
  hmr: { protocol: 'wss', host: new URL(process.env.VITE_PUBLIC_ORIGIN).host, clientPort: 443 },
} : undefined,
```

Plain local dev (`composer run dev` outside of this tooling) is unaffected.

### 4.6 URL lookup — `scripts/tailscale-dev/url.sh [worktree-path]`

Read-only. Looks up `worktree-path` (defaults to `$PWD`) in the registry and prints its URL (`https://mx.ewe-ulmer.ts.net/<slug>` and the `--vite` variant) plus whether its recorded PIDs are still alive. No side effects — never provisions or recreates anything, just reports current state. Also exposed as a herdr `[[actions]]` entry (`herdr-plugin.toml`, same pattern as `guard-main`'s `new-worktree` action) so the URL can be pulled up from herdr's UI without a terminal.

### 4.7 Laravel env handling

No `.env` file edits, ever. `APP_URL` and `ASSET_URL` are exported as shell environment variables by the provisioning script before launching `php artisan serve`; both Laravel (via phpdotenv) and Vite (via `loadEnv`) let real process env vars take precedence over `.env` file contents, so the symlinked, shared `.env` stays untouched while each worktree's process sees its own URL.

## 5. Data flow: creating a worktree

```
herdr creates worktree
  → worktree.created event fires
  → on-created.sh reads path from HERDR_PLUGIN_EVENT_JSON
  → provision.sh <path>
      slug ← mint or reuse
      symlink node_modules, vendor, .env
      ports ← allocate from registry
      php artisan package:discover
      start backend/queue/pail/vite, record PIDs
      tailscale serve --set-path=/<slug> ...
      tailscale serve --set-path=/<slug>--vite ...
  → URL printed / available immediately
```

## 6. Error handling & edge cases

- **Port already in use** (stale process holding a port outside our tracking): provisioning attempts the bind, and on failure retries the next port in range rather than failing outright.
- **Symlink target already a real file/dir**: abort with a clear error rather than deleting someone's local work; this only happens if provisioning is run against a worktree that already has its own real `node_modules`/`vendor`/`.env`.
- **Reboot**: `tailscale serve` config and background processes don't survive it. `reconcile.sh` on herdr startup re-provisions everything still in the registry.
- **Worktree removed without going through herdr** (e.g. manual `git worktree remove`): the registry entry and Tailscale mount would leak until the next `reconcile.sh` run, which prunes entries whose path no longer exists on disk.
- **Dependency drift**: documented non-goal (§2) — symlinked deps silently go stale if a worktree's branch changes `package.json`/`composer.json`. No automated detection; the fix is manual.
- **Vite HMR through the path-mounted proxy**: the one technically unverified piece of this design — whether `tailscale serve`'s reverse proxy forwards the WebSocket upgrade cleanly through a `--set-path` mount. Will be smoke-tested early in implementation. If it doesn't work cleanly, the fallback for that path is serving Vite's production build output instead of the dev server (loses live HMR for that worktree only; doesn't change the rest of the design).

## 7. Testing / validation plan

Manual, since this is machine-local dev tooling with no CI surface:

1. Provision main: confirm `https://mx.ewe-ulmer.ts.net/harun.dev` loads the app from another tailnet device (phone), Inertia navigation works, and editing a React file hot-reloads.
2. Create a throwaway `herdr` worktree: confirm the plugin fires, the new URL comes up unattended within a few seconds, `node_modules`/`vendor`/`.env` are symlinks pointing at main, and `bootstrap/cache` is populated but is a real (non-symlinked) directory. Confirm `scripts/tailscale-dev/url.sh` (run from inside the worktree, no args) prints the same URL without provisioning anything new.
3. Edit a file in the worktree, confirm HMR reflects it at the worktree's URL without touching main's.
4. Remove the worktree: confirm its `tailscale serve status` mounts disappear, its background processes are gone (`ps` check), and the registry entry is pruned.
5. Restart `herdr` (simulating a reboot): confirm main and any still-existing worktrees come back up automatically via `reconcile.sh`.

## 8. File inventory

New:
- `scripts/tailscale-dev/provision.sh`
- `scripts/tailscale-dev/teardown.sh`
- `scripts/tailscale-dev/url.sh`
- `scripts/tailscale-dev/lib.sh` (shared slug/port/registry helpers)
- `~/.herdr/plugins/tailscale-portfolio/herdr-plugin.toml`, `reconcile.sh`, `on-created.sh`, `on-removed.sh`

Modified:
- `vite.config.js` (optional-env-var base/origin/HMR config, §4.5)
- `.gitignore` (add `.tailscale-slug`)

Untouched:
- `.env`, `docker-compose.dev.yml`, production Traefik/Railway config — none of this design touches deploy or production routing.
