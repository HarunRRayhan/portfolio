# Tailscale Worktree Dev Routing — Design Spec

**Date:** 2026-08-18
**Status:** Approved — moving to implementation plan

## 1. Summary

Give every local checkout of this repo — the main working copy and every `herdr` git worktree — a stable, HTTPS URL reachable from any device on Harun's tailnet, without hand-provisioning ports, dependencies, or reverse-proxy config each time a worktree is created.

- Main branch: `https://mx.ewe-ulmer.ts.net/harun.dev`
- Each worktree: `https://mx.ewe-ulmer.ts.net/{slug}-harun.dev`, where `{slug}` is a 6-character alphanumeric id generated once per worktree and persisted alongside it.

`mx.ewe-ulmer.ts.net` is this machine's (`Haruns-M2Max`) MagicDNS name on Harun's tailnet — `{ts_device_domain}` in the original request.

Worktree lifecycle (creation and removal) is driven automatically by a new `herdr` plugin. Provisioning symlinks the gitignored, local-only parts of a worktree that are necessary but never committed (`node_modules`, `vendor`, `.env`, `.claude/settings.local.json`) back to the main checkout instead of reinstalling them, regenerates the parts that do vary by branch (`bootstrap/cache`), and starts the dev servers and Tailscale routes needed to serve that worktree independently.

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
  → https://mx.ewe-ulmer.ts.net/harun.dev            (main, app)
  → https://mx.ewe-ulmer.ts.net/{slug}-harun.dev      (worktree, app)
  → https://mx.ewe-ulmer.ts.net:{vite_port}           (that checkout's vite dev server)
        │
        ▼
  tailscale serve  (path-mounted app + port-mounted vite, native TLS on this device)
        │
        ├── /{slug}-harun.dev  → http://127.0.0.1:{backend_port}   (php artisan serve)
        └── :{vite_port}       → http://127.0.0.1:{vite_port}      (vite dev server)
        │
        ▼
  herdr (worktree.created / worktree.removed / startup events)
        │
        ▼
  scripts/tailscale-dev/{provision,teardown}.sh
        │
        ├── symlinks: node_modules, vendor, .env, .claude/settings.local.json → main checkout's copies
        ├── regenerates: bootstrap/cache/*.php     (php artisan package:discover)
        ├── allocates: backend_port, vite_port     (registry.json)
        └── launches: artisan serve / queue:listen / pail / vite, records PIDs
```

**Revision (post-implementation, final review finding — see §9):** the app backend is path-mounted (`--set-path`), but Vite's dev server gets its own **port**-mounted `tailscale serve --https=<port>` instead of a second path mount. The original two-path-mounts design (`/{slug}-harun.dev--vite`) was live-tested during the final whole-branch review and confirmed broken: `tailscale serve --set-path` strips the mount prefix before forwarding (correct, and necessary for the app backend), but Vite's own module graph resolves import specifiers as root-relative URLs against the *browser's origin*, not the mount path — so every module past the entry script 404s, and HMR's websocket targets the unmounted device root. A port mount sidesteps this: Vite gets a real, unprefixed origin (`https://mx.ewe-ulmer.ts.net:{vite_port}`), so its root-relative module graph resolves correctly with no prefix-stripping involved at all. This also matches a pattern already proven working on this machine (a sibling project's own Tailscale-exposed Vite dev server uses a port mount, not a path mount, for exactly this reason). The app itself stays path-mounted, matching the original request — only Vite's own internal, never-directly-visited dev-server URL changed shape. `vite_port` (already allocated per checkout, §4.1) is reused as both the external `tailscale serve --https=` port and Vite's own local bind port — no new port range needed.

## 4. Components

### 4.1 Slug + port registry

A single JSON file, `~/.config/herdr/plugins/config/tailscale-portfolio/registry.json`, is the source of truth for what's currently provisioned:

```json
{
  "/Users/rayhan/Code/haruns-portfolio": {
    "slug": "harun.dev",
    "backend_port": 8000,
    "vite_port": 5173,
    "pid": 1234
  },
  "/Users/rayhan/.herdr/worktrees/haruns-portfolio/setup-tailscale-with-worktress": {
    "slug": "a3f9k2-harun.dev",
    "backend_port": 8201,
    "vite_port": 5181,
    "pid": 2234
  }
}
```

`pid` is a single PID for the whole `concurrently`-grouped process (serve + queue:listen + pail + vite dev server run together as one group, the same tool and pattern `composer.json`'s own `dev` script already uses) — not four separate PIDs. `concurrently` forwards `SIGTERM` to all of its children by default, so killing that one PID (with a `pkill -P` fallback for stragglers, §4.3) tears down the whole group cleanly. This mirrors the proven pattern already in production use on this machine for a sibling project (`crontinel`'s `dev-tailscale-up.sh`/`dev-tailscale-down.sh`), which tracks one grouped PID per workspace the same way.

- Main is a fixed entry with fixed ports (8000/5173 — its existing defaults), always present.
- Worktree ports are allocated from fixed ranges (backend `8200–8299`, vite `5180–5279`) by scanning the registry for the first unused pair. Chosen clear of the ports already in live use on this machine by the sibling `personal-content`/`linkedin-posts` tailscale-serve setups (`8137`, `8140`, `9010`, the `550xx` range). 100 concurrent worktrees is far beyond realistic use. Allocation is a starting point, not a guarantee — see §6 for the bind-failure fallback.
- The registry is the only place port/slug/PID state lives outside the worktree itself — rebuilding it (e.g. after a crash) means re-running provisioning for every path still on disk.
- The generated slug is also written to a gitignored `.tailscale-slug` file inside the worktree, so re-running provisioning against an existing worktree is idempotent (reuses the slug instead of minting a new one).

### 4.2 Provisioning script — `scripts/tailscale-dev/provision.sh <worktree-path>`

If `<worktree-path>` is the main checkout itself (`/Users/rayhan/Code/haruns-portfolio`), steps 1–2 and 5 are skipped — main already owns its real `node_modules`/`vendor`/`.env`/`bootstrap/cache`, nothing to symlink or regenerate. It always uses the fixed `harun.dev` slug and 8000/5173 ports (§4.1) and only needs steps 3–8.

1. If `.tailscale-slug` doesn't exist in the worktree, generate a 6-char lowercase-alphanumeric id (retry on registry collision) and write it.
2. Symlink `node_modules`, `vendor`, `.env`, `.claude/settings.local.json` from the main checkout into the worktree, skipping any that are already correct symlinks. Refuse to clobber a real file/dir that isn't already our symlink (surface an error instead — this protects against overwriting someone's in-progress local install). General rule for adding to this list: gitignored, local-only files that a worktree genuinely needs but that don't meaningfully vary by branch. It excludes anything that legitimately should differ per checkout (`.tailscale-slug`, `public/hot`, `storage/`, `bootstrap/cache`) and anything deploy/production-credential-related (never symlinked, regardless of gitignore status).
3. Refuse to proceed unless `APP_ENV=local` in the `.env` this checkout now resolves to (for non-main, that means *after* step 2's symlink — checking beforehand would always fail, since the worktree has no `.env` yet; for main, its own real `.env` is already present, no ordering issue). This is the canary from §2.1 against ever running this against anything but a local dev checkout, and — per §9's final-review finding — it must check the checkout actually being provisioned, not always `$MAIN_REPO/.env` unconditionally, or it can never fail for the case it exists to catch.
4. Allocate `backend_port`/`vite_port` from the registry (skip if this path already has an entry). Before allocating a *new* pair, probe that the candidate port isn't already bound by something outside this tool's own tracking (§9) — the registry only knows about ports *it* handed out, not the rest of the system.
5. Run `php artisan package:discover --ansi` in the worktree to populate `bootstrap/cache/*.php` fresh. `storage/` needs no copying — git already ships the full directory skeleton per worktree (only contents are gitignored); it fills in naturally on first request.
6. Launch, in the background, with `APP_URL`/`ASSET_URL` exported to the Tailscale URL for this slug and `VITE_PUBLIC_ORIGIN` set to `https://<hostname>:$VITE_PORT` (§3's revision):
   - `php artisan serve --port=$BACKEND_PORT`
   - `php artisan queue:listen --tries=1`
   - `php artisan pail --timeout=0`
   - `npm run dev -- --port=$VITE_PORT`

   Run as one `npx concurrently` group (backgrounded, matching `composer.json`'s `dev` script) and record its single PID in the registry. Check the group actually started (§9) rather than trusting a bare background launch.
7. `tailscale serve --bg --set-path=/$SLUG http://127.0.0.1:$BACKEND_PORT` and `tailscale serve --bg --https=$VITE_PORT http://127.0.0.1:$VITE_PORT` — check both exit successfully (§9) rather than recording a registry entry for a mount that silently failed.
8. Print the final URL.

### 4.3 Teardown script — `scripts/tailscale-dev/teardown.sh <worktree-path>`

Reverse of provisioning: kill the recorded group PID and its **full descendant tree** (§9 — a single level of `pgrep -P` isn't enough; the real process tree is `concurrently` → four grouped processes → `php -S`/`node` grandchildren, and those grandchildren are the ones actually holding the ports), clear both `tailscale serve` mounts (`--set-path=/$SLUG off` and `--https=$VITE_PORT off`), remove the registry entry, and remove `$TARGET/public/hot` (§9 — Vite writes this file on start and it isn't reliably cleaned up by killing Vite via signal; left behind, it silently forces Laravel into "dev assets" mode against a server that no longer exists, breaking that checkout's *ordinary*, non-Tailscale local URL too). Leaves the symlinks and `.tailscale-slug` file in place — harmless, and `git worktree remove` deletes the whole directory anyway.

### 4.4 herdr plugin — `~/.herdr/plugins/tailscale-portfolio/`

Source lives in-repo at `scripts/tailscale-dev/herdr-plugin/` (version-controlled, reviewable in the same PRs as the scripts it drives) and gets symlinked into herdr's fixed plugin location by a one-time, explicitly-run `scripts/tailscale-dev/install-herdr-plugin.sh` — nothing else writes to `~/.herdr/` on its own.

New plugin, following the existing `guard-main` plugin's shape (`herdr-plugin.toml` + a shell script), but **diffing `git worktree list` against the registry rather than parsing `HERDR_PLUGIN_EVENT_JSON`.** `guard-main`'s own `worktree.created`/`worktree.removed` handlers don't trust the event payload for per-worktree detail either — they re-run a full relist (`label.sh all`, backed by `herdr workspace list`) rather than parse per-event fields, because the payload shape isn't guaranteed stable across event types. This design follows that same precedent, using `git worktree list --porcelain` (a stable, documented git command) as the source of truth instead:

```toml
[[startup]]
command = ["bash", "-c", "exec bash \"$HERDR_PLUGIN_ROOT/reconcile.sh\""]

[[events]]
on = "worktree.created"
command = ["bash", "-c", "exec bash \"$HERDR_PLUGIN_ROOT/reconcile.sh\""]

[[events]]
on = "worktree.removed"
command = ["bash", "-c", "exec bash \"$HERDR_PLUGIN_ROOT/reconcile.sh\""]
```

All three triggers (startup, and both events) run the same `reconcile.sh`:
1. `git -C <main-checkout> worktree list --porcelain` → the current, ground-truth set of checkout paths (main plus every live worktree).
2. Any path in that set missing from the registry → `provision.sh <path>`.
3. Any registry entry whose path is missing from that set → `teardown.sh <path>`.

This also covers machine reboot (step 1 above runs on startup too, and neither the background dev processes nor `tailscale serve` config survive one) and the case of a worktree removed without going through herdr (§6) — both are just "the registry doesn't match `git worktree list` anymore," handled by the same diff.

**This is the only automatic trigger, and it only exists if `herdr` is installed and running.** A worktree created with a plain `git worktree add`, or on a machine without this plugin installed, is never seen by `herdr` and so no event ever fires for it — nothing is auto-provisioned, and nothing breaks either, since `provision.sh`/`teardown.sh` don't assume herdr exists at runtime (they take a plain path argument). herdr is purely the trigger; anyone not using it can still call the scripts by hand (`scripts/tailscale-dev/provision.sh <path>`), or just not use this feature at all.

### 4.5 `vite.config.js` change

Small, backward-compatible addition — reads one optional env var and falls back to today's behavior when it's unset. No `base` path override needed: with the §3 revision, Vite's dev server is port-mounted, not path-mounted, so it always sees a real, unprefixed origin — only the *origin* Laravel injects into the HTML needs to change, which is the officially-documented laravel-vite-plugin mechanism for exposing a dev server through a tunnel (the same approach used for ngrok/similar). The `detectTls` override (added per §9) stops laravel-vite-plugin's Herd/Valet auto-detection from binding Vite as HTTPS on some machines/checkouts — its target here is always the plain-HTTP local port `provision.sh` itself binds and `tailscale serve --https=<port>` proxies to:

```js
server: process.env.VITE_PUBLIC_ORIGIN ? {
  origin: process.env.VITE_PUBLIC_ORIGIN,
  hmr: { protocol: 'wss', host: new URL(process.env.VITE_PUBLIC_ORIGIN).hostname, clientPort: 443 },
} : undefined,
```
and, in the `laravel()` plugin call:
```js
detectTls: process.env.VITE_PUBLIC_ORIGIN ? false : undefined,
```

Plain local dev (`composer run dev` outside of this tooling) is unaffected — both are no-ops when `VITE_PUBLIC_ORIGIN` is unset.

### 4.6 URL lookup — `scripts/tailscale-dev/url.sh [worktree-path]`

Read-only. Looks up `worktree-path` (defaults to `$PWD`) in the registry and prints its URL (`https://mx.ewe-ulmer.ts.net/<slug>` for the app, `https://mx.ewe-ulmer.ts.net:<vite_port>` for Vite, per the §3 revision) plus whether its recorded PID is still alive. No side effects — never provisions or recreates anything, just reports current state. Also exposed as a herdr `[[actions]]` entry (`herdr-plugin.toml`, same pattern as `guard-main`'s `new-worktree` action) so the URL can be pulled up from herdr's UI without a terminal.

### 4.7 Laravel env handling

No `.env` file edits, ever. `APP_URL` and `ASSET_URL` are exported as shell environment variables by the provisioning script before launching `php artisan serve`; both Laravel (via phpdotenv) and Vite (via `loadEnv`) let real process env vars take precedence over `.env` file contents, so the symlinked, shared `.env` stays untouched while each worktree's process sees its own URL.

## 5. Data flow: creating a worktree

```
herdr creates worktree
  → worktree.created event fires
  → reconcile.sh: git worktree list --porcelain, diff against registry
  → new path found → provision.sh <path>
      slug ← mint or reuse
      symlink node_modules, vendor, .env
      ports ← allocate from registry
      php artisan package:discover
      start backend/queue/pail/vite as one concurrently group, record its PID
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
- **Hardcoded root-relative links break out of the mount (confirmed, accepted).** Verified empirically: `tailscale serve --set-path=/foo` strips `/foo` before forwarding to the backend (a probe server behind the mount saw `/sub/page` for a request to `/foo/sub/page`), which is what makes the whole routing scheme work — but it also means the backend has no idea it's mounted under a path unless told (handled via `APP_URL`/`ASSET_URL`, §4.7). Anything driven by Laravel's `route()`/Ziggy respects that and resolves correctly. Literal hardcoded links in the React app — confirmed present in `resources/js/Pages/Bio.tsx`, `Products.tsx`, `Services.tsx` (e.g. `<Link href="/contact">`) — don't go through that mechanism, so clicking one navigates to `https://mx.ewe-ulmer.ts.net/contact`, outside any mount, and 404s. Affects main (mounted at `/harun.dev`, not `/`) too, not just worktrees. Direct URL loads, page refreshes, and route()-driven links are all unaffected. Decided: leave as-is — auditing/fixing every hardcoded link is a separate, unrelated frontend change, not part of this infra work.
- **Vite HMR through the path-mounted proxy — superseded, see §3 and §9.** The original plan here (a second `--set-path` mount for Vite) was implemented, then live-tested during the final whole-branch review, and found broken: Vite's module graph resolves as root-relative against the browser's origin, not the mount path, so imports past the entry script 404 and HMR's websocket targets the unmounted device root. Fixed by switching Vite to a port-mounted (`--https=<port>`) tailscale serve target instead of a path mount — full details in §3's revision and §9.

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
- `scripts/tailscale-dev/herdr-plugin/herdr-plugin.toml`, `reconcile.sh` — plugin source, version-controlled in-repo
- `scripts/tailscale-dev/install-herdr-plugin.sh` — symlinks the above into `~/.herdr/plugins/tailscale-portfolio/` (the fixed location herdr reads plugins from, same as `guard-main`); a one-time, explicit, human-run step, not something any other script runs on its own

Modified:
- `vite.config.js` (optional-env-var origin/HMR config, §4.5)
- `.gitignore` (add `.tailscale-slug`)

Untouched:
- `.env`, `docker-compose.dev.yml`, production Traefik/Railway config — none of this design touches deploy or production routing.

## 9. Post-implementation: final whole-branch review findings

All six tasks (§8's file inventory) were individually implemented and reviewed against this spec, each passing real end-to-end testing (real processes, real Tailscale mounts) — see the SDD ledger for the full history. A final whole-branch review, dispatched after all six tasks passed individually, went further: it actually fetched URLs from the live, running system rather than trusting `curl -sI` on the HTML entry point alone, and found the primary feature goal ("Live Vite HMR works through the Tailscale route") did not work despite every individual task passing its own tests. This section records what was found and the fix directive for each; §3, §4.2, §4.3, and §4.5 above already reflect the target state.

**Root cause of the headline break, and the fix (Critical):** the original two-path-mount design was live-tested and found broken — Vite's module graph and HMR websocket resolve as root-relative against the *browser's origin*, not the mount path, so everything past the entry script 404s regardless of how correctly the mount itself strips its prefix. Fixed by giving Vite its own port-mounted `tailscale serve --https=<port>` target instead of a second path mount (§3's revision) — confirmed to sidestep the failure class entirely rather than patch around it, and matches a pattern already proven working elsewhere on this machine. The app backend's path mount is untouched; only Vite's own internal, never-directly-visited URL changed shape.

**Main's `--vite` mount also 502'd (Critical), for a second, independent reason:** on some checkouts (dependent on the directory's basename matching a Laravel Herd/Valet TLS certificate), laravel-vite-plugin's TLS auto-detection binds Vite as HTTPS locally while `provision.sh` mounts it as an HTTP target — silently basename-dependent, would recur on any future worktree whose folder name happens to collide with a Herd cert. Fixed via `detectTls: false` in `vite.config.js`'s `laravel()` call, scoped to only when `VITE_PUBLIC_ORIGIN` is set (§4.5).

**Other Important findings, all fixed as part of the same pass:**
- `teardown.sh` didn't remove `public/hot` — left behind, it silently forces Laravel into "dev assets" mode against a dead server, breaking that checkout's *ordinary* non-Tailscale local URL too. Now removed in teardown (§4.3).
- `reconcile.sh` only reconciled against *presence* in the registry, not liveness — a dead process (crash, `--kill-others` taking a group down) left a registry entry with a dead PID that nothing ever re-provisioned, and a full reboot (registry survives, everything else doesn't) was a no-op instead of the recovery path §6 already claimed it was. Fixed: the provision loop in `reconcile.sh` now also re-provisions any registered path whose recorded PID fails `kill -0`, not just paths missing from the registry entirely.
- `reconcile.sh` didn't check `git worktree list`'s exit status — a transient git failure read as "every registered checkout is gone" and tore all of them down, on every herdr startup and worktree event. Fixed: abort with an error instead of proceeding on an empty/failed listing.
- `proc::kill_group` (`lib.sh`) only reached one level of children via `pgrep -P`. The real process tree is four levels deep (`concurrently` → four grouped processes → the `php -S`/`node` grandchildren that actually hold the ports), so a slow signal handoff could leave orphaned processes squatting on ports after teardown. Fixed: walk and capture the full descendant tree before signaling anything (not just direct children), same reparenting-safety principle as before, one level deeper.
- Port allocation (`registry::alloc_port`) only checked the registry, never the actual system — a stale orphan (or any unrelated process) holding an allocated port made provisioning "succeed" silently against the wrong service. Fixed: probe the candidate port for an existing listener before allocating it.
- `provision.sh` didn't check the exit status of `tailscale serve --bg` or the `ln -s` symlink calls (no script in this feature uses `set -e`) — a failed mount or symlink fell through to a registry entry claiming success. Fixed: both are now checked, aborting provisioning with a clear error on failure.
- `guard::require_local_env` always read `$MAIN_REPO/.env`, regardless of which path was being provisioned — so it could never actually fail for the case §2.1 describes (pointing this at something that isn't a local dev checkout), because it never looked at the target. Fixed: re-pointed at the checkout actually being provisioned, after the symlink step for non-main targets (§4.2 step 3).
- `install-herdr-plugin.sh` treated a *dangling* symlink (e.g. after this worktree is removed post-merge) the same as a symlink pointing somewhere else — refusing to reinstall rather than offering to replace it, which is exactly the state a normal "merge, then delete this worktree" flow leaves the plugin in. Fixed: detect a dangling symlink specifically and replace it rather than refusing.

**Two rulings made during implementation, reassessed by the final review and left standing:**
- `/Users/rayhan/Code/haruns-portfolio/.env`'s `APP_ENV` was permanently changed from `production` to `local` (Task 2), with explicit confirmation from the human partner, asked twice — once before the change and again after `project_local_verification_workflow.md` surfaced context that this repo's normal workflow deliberately never touches `APP_ENV`. The final review assessed the change itself as defensible (a laptop dev checkout labeled `production` was the real anomaly) but noted it was solving a symptom of the `guard::require_local_env` bug fixed above — pointing the guard at the right file would have unblocked provisioning without touching main's `.env` at all. Left standing (reverting now would just re-block for no gain); the guard fix above is the substantive correction.
- `scripts/tailscale-dev/url.sh` (Task 4, already individually approved) was modified again during Task 6 to fix a real bash bug (logical `cd ..` doesn't resolve symlinks) reachable only through Task 6's own new plugin-symlink invocation path. The final review independently re-verified the diagnosis and fix and confirmed this was the correct scope call — the bug's surface didn't exist until Task 6 introduced it, so escalating instead of fixing directly would have added latency with no risk reduction.

**Deferred, accepted as-is (not fixed):**
- No locking on the registry file — three herdr triggers can all invoke `reconcile.sh`; overlapping runs could theoretically race on a read-modify-write. Low risk for solo single-user use; not worth the complexity of a lock file for this tool's actual usage pattern.
- Every checkout's path mounts share one Tailscale device origin alongside pre-existing, unrelated personal-tool mounts (already true before this feature). Acceptable for a single-user tailnet; would need reconsideration if this device's tailnet were ever shared more broadly.
- Minor stylistic/robustness notes (log rotation, a couple of untested trivial helper functions, inconsistent `cd -P`/`pwd -P` idiom choice between two scripts doing the same fix) — recorded in the SDD ledger, not repeated here; none block correctness.
