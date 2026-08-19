# Tailscale Worktree Dev Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the main `haruns-portfolio` checkout and every `herdr` git worktree of it a stable HTTPS URL on Harun's tailnet (`https://mx.ewe-ulmer.ts.net/harun.dev` for main, `https://mx.ewe-ulmer.ts.net/{slug}-harun.dev` per worktree), auto-provisioned by a herdr plugin, with `node_modules`/`vendor`/`.env` symlinked from main instead of reinstalled per worktree.

**Architecture:** A shared bash library (`lib.sh`) provides registry/slug/port/process helpers on top of a single JSON registry file. `provision.sh`/`teardown.sh` are the only scripts with side effects — they symlink deps, allocate ports, launch the four dev processes as one `concurrently` group (mirroring `composer.json`'s own `dev` script), and register two `tailscale serve --set-path` mounts per checkout (one for the Laravel backend, one for Vite's dev server, so Vite's HMR/asset origin has somewhere stable to point). A herdr plugin (`reconcile.sh`, installed via symlink from in-repo source) diffs `git worktree list` against the registry on startup and on `worktree.created`/`worktree.removed`, calling `provision.sh`/`teardown.sh` for whatever changed — deliberately not parsing herdr's event payload, following the precedent already set by this machine's `guard-main` plugin.

**Tech Stack:** bash (macOS system `/bin/bash` 3.2, confirmed `/dev/tcp` works), `jq` (confirmed installed, 1.8.2), `tailscale` CLI (confirmed installed, 1.102.2, `tailscale serve --set-path` supported), `concurrently@9` (already a project devDependency), Laravel 13 / Vite (`laravel-vite-plugin`), `herdr` plugin TOML.

**Spec:** `docs/superpowers/specs/2026-08-18-tailscale-worktree-dev-routing-design.md`

## Global Constraints

- Development-only. `provision.sh`/`teardown.sh` refuse to run unless `/Users/rayhan/Code/haruns-portfolio/.env` has `APP_ENV=local`. Nothing in this plan touches `deploy/`, `docker/`, CI, or any production path.
- Automatic triggering is `herdr`-only by design — a worktree made without herdr never gets auto-provisioned, and that's correct, not a bug. The scripts themselves take a plain path argument and work standalone regardless of herdr.
- No `.env` file is ever edited. Per-worktree `APP_URL`/`ASSET_URL`/`VITE_PUBLIC_ORIGIN` are exported as process env vars (which both Laravel/phpdotenv and Vite's `loadEnv` let take precedence over `.env` file contents), never written to disk.
- `MAIN_REPO` is a hardcoded constant: `/Users/rayhan/Code/haruns-portfolio`. This is personal tooling for one machine, not a portable/generic tool — hardcoding is correct here, not a shortcut to fix later.
- Worktree ports: backend `8200–8299`, vite `5180–5279` (verified clear of ports already in live use on this machine by sibling `personal-content`/`linkedin-posts` tailscale-serve setups). Main is fixed at `8000`/`5173` (its existing defaults). Main's slug is fixed as `harun.dev`; worktree slugs are `{6-char lowercase alnum}-harun.dev`.
- Registry file: `~/.config/herdr/plugins/config/tailscale-portfolio/registry.json`, overridable via `TAILSCALE_DEV_REGISTRY` env var (tests use this to avoid touching the real registry).
- Every script sources `scripts/tailscale-dev/lib.sh` and starts with `set -uo pipefail`.

---

## Task 1: Shared helper library

**Files:**
- Create: `scripts/tailscale-dev/lib.sh`
- Create: `scripts/tailscale-dev/test-lib.sh`

**Interfaces:**
- Produces (used by every later task):
  - `registry::file()` → echoes registry path, creates parent dir + `{}` file if missing
  - `registry::get(path)` → echoes the JSON object for `path`, or empty string
  - `registry::set(path, json)` → merges `json` into the registry under key `path`
  - `registry::remove(path)` → deletes the entry for `path`
  - `registry::all_paths()` → newline-separated list of registered paths
  - `registry::alloc_port(start, end, field)` → echoes first port in `[start, end]` not already used for `field` across all entries; returns 1 if none free
  - `slug::generate()` → echoes a 6-char lowercase-alnum id
  - `slug::for_path(path)` → echoes the full slug for `path` (`"harun.dev"` for `$MAIN_REPO`; for anything else, reads/creates `<path>/.tailscale-slug` and echoes `"{id}-harun.dev"`, idempotent)
  - `ts::hostname()` → echoes this machine's Tailscale MagicDNS hostname (no trailing dot)
  - `ts::url_for_slug(slug)` → echoes `https://<hostname>/<slug>`
  - `ts::vite_url_for_slug(slug)` → echoes `https://<hostname>/<slug>--vite`
  - `env::read_var(file, name)` → echoes the value of the last `name=` line in `file`, empty if absent
  - `guard::require_local_env()` → exits 1 with a message unless `$MAIN_REPO/.env` has `APP_ENV=local`
  - `net::wait_for_port(port, timeout_secs)` → returns 0 once `127.0.0.1:port` accepts a TCP connection, 1 on timeout
  - `proc::kill_group(pid)` → terminates `pid` and its direct children (captured before signaling, so it's correct even if `pid`'s own process dies/reparents its children before they're reaped)
  - Constants: `MAIN_REPO`, `MAIN_SLUG`, `MAIN_BACKEND_PORT`, `MAIN_VITE_PORT`, `BACKEND_PORT_START`, `BACKEND_PORT_END`, `VITE_PORT_START`, `VITE_PORT_END`

- [ ] **Step 1: Write `lib.sh`**

```bash
#!/usr/bin/env bash
# scripts/tailscale-dev/lib.sh
# Shared helpers for tailscale-dev provisioning scripts. Source, don't execute.
# Development-only tooling — see docs/superpowers/specs/2026-08-18-tailscale-worktree-dev-routing-design.md

set -uo pipefail

: "${MAIN_REPO:=/Users/rayhan/Code/haruns-portfolio}"
: "${TAILSCALE_DEV_REGISTRY:=$HOME/.config/herdr/plugins/config/tailscale-portfolio/registry.json}"

MAIN_SLUG="harun.dev"
MAIN_BACKEND_PORT=8000
MAIN_VITE_PORT=5173
BACKEND_PORT_START=8200
BACKEND_PORT_END=8299
VITE_PORT_START=5180
VITE_PORT_END=5279

for bin in jq git tailscale; do
  command -v "$bin" >/dev/null 2>&1 || { echo "tailscale-dev: '$bin' not found on PATH" >&2; exit 1; }
done

# --- registry ---------------------------------------------------------

registry::file() {
  mkdir -p "$(dirname "$TAILSCALE_DEV_REGISTRY")"
  [[ -f "$TAILSCALE_DEV_REGISTRY" ]] || echo '{}' > "$TAILSCALE_DEV_REGISTRY"
  echo "$TAILSCALE_DEV_REGISTRY"
}

registry::get() {
  local path="$1" file
  file=$(registry::file)
  jq -r --arg p "$path" '.[$p] // empty' "$file"
}

registry::set() {
  local path="$1" json="$2" file tmp
  file=$(registry::file)
  tmp=$(mktemp)
  jq --arg p "$path" --argjson v "$json" '.[$p] = $v' "$file" > "$tmp" && mv "$tmp" "$file"
}

registry::remove() {
  local path="$1" file tmp
  file=$(registry::file)
  tmp=$(mktemp)
  jq --arg p "$path" 'del(.[$p])' "$file" > "$tmp" && mv "$tmp" "$file"
}

registry::all_paths() {
  local file
  file=$(registry::file)
  jq -r 'keys[]' "$file"
}

registry::alloc_port() {
  local start="$1" end="$2" field="$3" file used p
  file=$(registry::file)
  used=$(jq -r --arg f "$field" '[.[][$f]] | .[]' "$file")
  for ((p = start; p <= end; p++)); do
    if ! grep -qx "$p" <<<"$used"; then
      echo "$p"
      return 0
    fi
  done
  return 1
}

# --- slugs --------------------------------------------------------------

slug::generate() {
  LC_ALL=C tr -dc 'a-z0-9' < /dev/urandom | head -c 6
}

slug::for_path() {
  local path="$1"
  if [[ "$path" == "$MAIN_REPO" ]]; then
    echo "$MAIN_SLUG"
    return 0
  fi
  local slug_file="$path/.tailscale-slug" id existing
  if [[ -f "$slug_file" ]]; then
    id=$(<"$slug_file")
  else
    existing=$(registry::all_paths | while read -r p; do registry::get "$p" | jq -r '.slug // empty'; done)
    while :; do
      id=$(slug::generate)
      grep -qx "${id}-harun.dev" <<<"$existing" || break
    done
    echo "$id" > "$slug_file"
  fi
  echo "${id}-harun.dev"
}

# --- tailscale ------------------------------------------------------------

ts::hostname() {
  tailscale status --json | jq -r '.Self.DNSName' | sed 's/\.$//'
}

ts::url_for_slug() {
  echo "https://$(ts::hostname)/${1}"
}

ts::vite_url_for_slug() {
  echo "https://$(ts::hostname)/${1}--vite"
}

# --- env ------------------------------------------------------------------

env::read_var() {
  local file="$1" name="$2"
  [[ -f "$file" ]] || return 1
  grep -E "^${name}=" "$file" | tail -n1 | cut -d= -f2-
}

guard::require_local_env() {
  local app_env
  app_env=$(env::read_var "$MAIN_REPO/.env" "APP_ENV" || true)
  if [[ "$app_env" != "local" ]]; then
    echo "tailscale-dev: refusing to run — $MAIN_REPO/.env has APP_ENV='$app_env', not 'local'" >&2
    exit 1
  fi
}

# --- net / process --------------------------------------------------------

net::wait_for_port() {
  local port="$1" timeout="${2:-20}" waited=0
  while (( waited < timeout )); do
    if (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; then
      exec 3<&- 3>&-
      return 0
    fi
    sleep 1
    waited=$((waited + 1))
  done
  return 1
}

proc::kill_group() {
  local pid="$1"
  [[ -z "$pid" ]] && return 0
  local children
  children=$(pgrep -P "$pid" 2>/dev/null || true)
  kill -TERM "$pid" 2>/dev/null || true
  [[ -n "$children" ]] && kill -TERM $children 2>/dev/null
  local waited=0
  while (( waited < 10 )); do
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.5
    waited=$((waited + 1))
  done
  [[ -n "$children" ]] && kill -9 $children 2>/dev/null
  kill -9 "$pid" 2>/dev/null || true
  return 0
}
```

- [ ] **Step 2: Make it executable-safe and syntax-check it**

Run: `bash -n scripts/tailscale-dev/lib.sh`
Expected: no output, exit code 0.

- [ ] **Step 3: Write `test-lib.sh`**

```bash
#!/usr/bin/env bash
# scripts/tailscale-dev/test-lib.sh
set -uo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'
FAILURES=0

pass() { echo -e "${GREEN}PASS${NC}: $1"; }
fail() { echo -e "${RED}FAIL${NC}: $1"; FAILURES=$((FAILURES + 1)); }
assert_eq() {
  if [[ "$1" == "$2" ]]; then pass "$3"; else fail "$3 (expected '$2', got '$1')"; fi
}

TMP_ROOT=$(mktemp -d)
trap 'rm -rf "$TMP_ROOT"' EXIT

export MAIN_REPO="$TMP_ROOT/main"
export TAILSCALE_DEV_REGISTRY="$TMP_ROOT/registry.json"
mkdir -p "$MAIN_REPO"

# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

echo "--- registry ---"
registry::set "/a" '{"slug":"a-harun.dev","backend_port":8200,"vite_port":5180,"pid":111}'
got=$(registry::get "/a" | jq -r '.slug')
assert_eq "$got" "a-harun.dev" "registry::set/get round-trips"

registry::set "/b" '{"slug":"b-harun.dev","backend_port":8201,"vite_port":5181,"pid":222}'
paths=$(registry::all_paths | sort | tr '\n' ',')
assert_eq "$paths" "/a,/b," "registry::all_paths lists both entries"

echo "--- port allocation ---"
p=$(registry::alloc_port 8200 8299 backend_port)
assert_eq "$p" "8202" "registry::alloc_port skips ports already in use (8200, 8201 taken)"

registry::remove "/a"
got=$(registry::get "/a")
assert_eq "$got" "" "registry::remove deletes the entry"
registry::remove "/b"

echo "--- slug ---"
id=$(slug::generate)
len=${#id}
assert_eq "$len" "6" "slug::generate produces a 6-char id"
if [[ "$id" =~ ^[a-z0-9]{6}$ ]]; then pass "slug::generate is lowercase alnum"; else fail "slug::generate charset: got '$id'"; fi

main_slug=$(slug::for_path "$MAIN_REPO")
assert_eq "$main_slug" "harun.dev" "slug::for_path returns the fixed slug for MAIN_REPO"

WT="$TMP_ROOT/worktree"
mkdir -p "$WT"
wt_slug1=$(slug::for_path "$WT")
wt_slug2=$(slug::for_path "$WT")
assert_eq "$wt_slug1" "$wt_slug2" "slug::for_path is idempotent for the same worktree"
if [[ "$wt_slug1" =~ ^[a-z0-9]{6}-harun\.dev$ ]]; then pass "slug::for_path worktree slug has the expected shape"; else fail "slug::for_path shape: got '$wt_slug1'"; fi
if [[ -f "$WT/.tailscale-slug" ]]; then pass "slug::for_path persists .tailscale-slug"; else fail "slug::for_path did not write .tailscale-slug"; fi

echo "--- env guard ---"
echo "APP_ENV=local" > "$MAIN_REPO/.env"
val=$(env::read_var "$MAIN_REPO/.env" "APP_ENV")
assert_eq "$val" "local" "env::read_var reads APP_ENV"

if (guard::require_local_env) 2>/dev/null; then pass "guard::require_local_env passes when APP_ENV=local"; else fail "guard::require_local_env should have passed"; fi

echo "APP_ENV=production" > "$MAIN_REPO/.env"
if (guard::require_local_env) 2>/dev/null; then fail "guard::require_local_env should have refused APP_ENV=production"; else pass "guard::require_local_env refuses APP_ENV=production"; fi
echo "APP_ENV=local" > "$MAIN_REPO/.env"

echo "--- net::wait_for_port ---"
python3 -c "
import http.server
http.server.HTTPServer(('127.0.0.1', 58433), http.server.BaseHTTPRequestHandler).serve_forever()
" &
PROBE_PID=$!
sleep 1
if net::wait_for_port 58433 5; then pass "net::wait_for_port succeeds once a port is listening"; else fail "net::wait_for_port timed out on a live port"; fi
kill "$PROBE_PID" 2>/dev/null
wait "$PROBE_PID" 2>/dev/null

if net::wait_for_port 58999 2; then fail "net::wait_for_port should have timed out on a dead port"; else pass "net::wait_for_port times out on a port nobody is listening on"; fi

echo "--- proc::kill_group ---"
( sleep 60 & sleep 60 & wait ) &
GROUP_PID=$!
sleep 1
child_count_before=$(pgrep -P "$GROUP_PID" | wc -l | tr -d ' ')
assert_eq "$child_count_before" "2" "proc test setup has two sleep children"
proc::kill_group "$GROUP_PID"
sleep 1
if kill -0 "$GROUP_PID" 2>/dev/null; then fail "proc::kill_group left the group PID alive"; else pass "proc::kill_group killed the group PID"; fi
if pgrep -P "$GROUP_PID" >/dev/null 2>&1; then fail "proc::kill_group left orphaned children"; else pass "proc::kill_group killed the children too"; fi

echo "--- tailscale hostname (real, needs tailscaled running) ---"
host=$(ts::hostname)
if [[ "$host" == *.ts.net ]]; then pass "ts::hostname returns a *.ts.net MagicDNS name (got '$host')"; else fail "ts::hostname: got '$host'"; fi

echo
if (( FAILURES > 0 )); then
  echo -e "${RED}${FAILURES} check(s) failed${NC}"
  exit 1
fi
echo -e "${GREEN}All lib.sh checks passed${NC}"
```

- [ ] **Step 4: Run it, expect it to fail (lib.sh has bugs to shake out on first run — that's the point of running before trusting it)**

Run: `chmod +x scripts/tailscale-dev/*.sh && bash scripts/tailscale-dev/test-lib.sh`
Expected: runs to completion (all functions exist, so this isn't a "not defined" failure like typical TDD red — it's a real behavioral check). If any assertion prints `FAIL`, read the message, fix the corresponding function in `lib.sh`, and re-run. Do not proceed until output ends with `All lib.sh checks passed`.

- [ ] **Step 5: Run it again to confirm a clean pass**

Run: `bash scripts/tailscale-dev/test-lib.sh`
Expected: every line prefixed `PASS`, final line `All lib.sh checks passed`, exit code 0.

- [ ] **Step 6: Commit**

```bash
git add scripts/tailscale-dev/lib.sh scripts/tailscale-dev/test-lib.sh
git commit -m "$(cat <<'EOF'
feat: add tailscale-dev shared library (registry, slug, port, process helpers)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `provision.sh`

**Files:**
- Create: `scripts/tailscale-dev/provision.sh`
- Modify: `.gitignore` (add `.tailscale-slug`)

**Interfaces:**
- Consumes: everything from Task 1's `lib.sh` (`guard::require_local_env`, `slug::for_path`, `registry::get/set/alloc_port`, `ts::url_for_slug`, `ts::vite_url_for_slug`, `net::wait_for_port`, `proc::kill_group`, `MAIN_REPO`, `MAIN_SLUG`, `MAIN_BACKEND_PORT`, `MAIN_VITE_PORT`, `BACKEND_PORT_START/END`, `VITE_PORT_START/END`)
- Produces: `scripts/tailscale-dev/provision.sh <path>` — idempotent; on success prints the checkout's URL on stdout and exits 0; leaves a `pid`/`slug`/`backend_port`/`vite_port` registry entry for `<path>` that Tasks 3–4 consume.

- [ ] **Step 1: Add `.tailscale-slug` to `.gitignore`**

Add this line under the existing `/vendor` entry in `.gitignore`:

```
.tailscale-slug
```

- [ ] **Step 2: Write `provision.sh`**

```bash
#!/usr/bin/env bash
# scripts/tailscale-dev/provision.sh
# Development-only. See docs/superpowers/specs/2026-08-18-tailscale-worktree-dev-routing-design.md

set -uo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

usage() { echo "Usage: $(basename "$0") <worktree-path>" >&2; exit 1; }
[[ $# -eq 1 ]] || usage

TARGET=$(cd "$1" 2>/dev/null && pwd) || { echo "tailscale-dev: no such directory: $1" >&2; exit 1; }

guard::require_local_env

IS_MAIN=false
[[ "$TARGET" == "$MAIN_REPO" ]] && IS_MAIN=true

if [[ "$IS_MAIN" == false ]]; then
  for item in node_modules vendor .env; do
    src="$MAIN_REPO/$item"
    dst="$TARGET/$item"
    if [[ -L "$dst" ]]; then
      : # already our symlink, idempotent no-op
    elif [[ -e "$dst" ]]; then
      echo "tailscale-dev: refusing to clobber existing $dst (not a symlink we own)" >&2
      exit 1
    else
      ln -s "$src" "$dst"
    fi
  done
fi

SLUG=$(slug::for_path "$TARGET")

if [[ "$IS_MAIN" == true ]]; then
  BACKEND_PORT=$MAIN_BACKEND_PORT
  VITE_PORT=$MAIN_VITE_PORT
else
  existing=$(registry::get "$TARGET")
  if [[ -n "$existing" ]]; then
    BACKEND_PORT=$(jq -r '.backend_port' <<<"$existing")
    VITE_PORT=$(jq -r '.vite_port' <<<"$existing")
  else
    BACKEND_PORT=$(registry::alloc_port "$BACKEND_PORT_START" "$BACKEND_PORT_END" backend_port) \
      || { echo "tailscale-dev: no free backend port in range" >&2; exit 1; }
    VITE_PORT=$(registry::alloc_port "$VITE_PORT_START" "$VITE_PORT_END" vite_port) \
      || { echo "tailscale-dev: no free vite port in range" >&2; exit 1; }
  fi
  (cd "$TARGET" && php artisan package:discover --ansi) || {
    echo "tailscale-dev: php artisan package:discover failed in $TARGET" >&2
    exit 1
  }
fi

APP_URL=$(ts::url_for_slug "$SLUG")
VITE_PUBLIC_ORIGIN=$(ts::vite_url_for_slug "$SLUG")

# Defensive: clear any mount/process left over from a run that ended without
# going through teardown.sh — tailscale serve state and the registry both
# persist independently of whether the process that set them is still alive.
tailscale serve --set-path="/$SLUG" off >/dev/null 2>&1 || true
tailscale serve --set-path="/${SLUG}--vite" off >/dev/null 2>&1 || true
prior_pid=$(registry::get "$TARGET" | jq -r '.pid // empty')
[[ -n "$prior_pid" ]] && proc::kill_group "$prior_pid"

# Bind the ports before registering them with tailscale serve. Registering
# first reserves the port for tailscale and makes the dev server's own
# bind() fail with EADDRINUSE.
(
  cd "$TARGET" && \
  APP_URL="$APP_URL" ASSET_URL="$APP_URL" VITE_PUBLIC_ORIGIN="$VITE_PUBLIC_ORIGIN" \
  exec npx --yes concurrently@9 \
    --names server,queue,logs,vite \
    --kill-others \
    "php artisan serve --port=$BACKEND_PORT" \
    "php artisan queue:listen --tries=1" \
    "php artisan pail --timeout=0" \
    "npm run dev -- --port=$VITE_PORT"
) &
GROUP_PID=$!
disown

if ! net::wait_for_port "$BACKEND_PORT" 30; then
  echo "tailscale-dev: backend port $BACKEND_PORT did not come up in time" >&2
  proc::kill_group "$GROUP_PID"
  exit 1
fi
if ! net::wait_for_port "$VITE_PORT" 30; then
  echo "tailscale-dev: vite port $VITE_PORT did not come up in time" >&2
  proc::kill_group "$GROUP_PID"
  exit 1
fi

tailscale serve --bg --set-path="/$SLUG" "http://127.0.0.1:$BACKEND_PORT" >/dev/null
tailscale serve --bg --set-path="/${SLUG}--vite" "http://127.0.0.1:$VITE_PORT" >/dev/null

registry::set "$TARGET" "$(jq -n \
  --arg slug "$SLUG" \
  --argjson backend_port "$BACKEND_PORT" \
  --argjson vite_port "$VITE_PORT" \
  --argjson pid "$GROUP_PID" \
  '{slug: $slug, backend_port: $backend_port, vite_port: $vite_port, pid: $pid}')"

echo "$APP_URL"
```

- [ ] **Step 3: Syntax-check and make executable**

Run: `chmod +x scripts/tailscale-dev/provision.sh && bash -n scripts/tailscale-dev/provision.sh`
Expected: no output, exit code 0.

- [ ] **Step 4: Fixture test — the symlink-clobber guard refuses to overwrite a real file**

This runs against a throwaway scratch fixture, not the real repo, so it can be checked before risking anything real:

```bash
FIXTURE=$(mktemp -d)
mkdir -p "$FIXTURE/main" "$FIXTURE/worktree/node_modules"
echo "APP_ENV=local" > "$FIXTURE/main/.env"
touch "$FIXTURE/main/vendor" "$FIXTURE/main/node_modules" # placeholders, not read this far
MAIN_REPO="$FIXTURE/main" TAILSCALE_DEV_REGISTRY="$FIXTURE/registry.json" \
  scripts/tailscale-dev/provision.sh "$FIXTURE/worktree"
echo "exit code: $?"
rm -rf "$FIXTURE"
```

Expected: exits non-zero, stderr contains `refusing to clobber existing .../worktree/node_modules`, because `$FIXTURE/worktree/node_modules` is a real directory, not a symlink. If it doesn't print that and exit non-zero, fix the symlink-guard branch in `provision.sh` before continuing.

- [ ] **Step 5: Real end-to-end test — provision this actual worktree**

This worktree (`setup-tailscale-with-worktress`) currently has no `vendor`/`node_modules`/`.env` — the exact scenario this script exists for.

```bash
scripts/tailscale-dev/provision.sh "$PWD"
echo "exit code: $?"
```

Expected: prints a URL like `https://mx.ewe-ulmer.ts.net/xxxxxx-harun.dev`, exit code 0.

Then verify each piece:

```bash
ls -la node_modules vendor .env   # all three should show as -> /Users/rayhan/Code/haruns-portfolio/...
cat .tailscale-slug                # 6-char lowercase alnum
ls bootstrap/cache/*.php           # packages.php, services.php present and NOT symlinks
jq . "$HOME/.config/herdr/plugins/config/tailscale-portfolio/registry.json"  # entry for $PWD present
tailscale serve status | grep -- "-harun.dev"   # both mounts present
curl -sI "$(scripts/tailscale-dev/provision.sh "$PWD")" | head -1   # re-run is idempotent; re-verify same URL responds
```

Expected: symlinks point at the main checkout; `.tailscale-slug` is 6 lowercase alnum chars; `bootstrap/cache/packages.php`/`services.php` exist and are real files (`file` or `ls -la` shows no `->`); the registry has an entry for this worktree's path; `tailscale serve status` lists both the backend and `--vite` mounts for this worktree's slug; the re-run prints the *same* URL as the first run (idempotency) and `curl -sI` on it returns `HTTP/2 200`.

- [ ] **Step 6: Clean up the real-worktree test state**

Task 3 builds `teardown.sh` properly — for now, tear down by hand so this worktree is back to a clean slate:

```bash
entry=$(jq -r --arg p "$PWD" '.[$p]' "$HOME/.config/herdr/plugins/config/tailscale-portfolio/registry.json")
slug=$(jq -r '.slug' <<<"$entry")
pid=$(jq -r '.pid' <<<"$entry")
kill "$pid" 2>/dev/null; sleep 2; pkill -9 -P "$pid" 2>/dev/null; kill -9 "$pid" 2>/dev/null
tailscale serve --set-path="/$slug" off
tailscale serve --set-path="/${slug}--vite" off
tmp=$(mktemp); jq --arg p "$PWD" 'del(.[$p])' "$HOME/.config/herdr/plugins/config/tailscale-portfolio/registry.json" > "$tmp"
mv "$tmp" "$HOME/.config/herdr/plugins/config/tailscale-portfolio/registry.json"
tailscale serve status | grep -- "-harun.dev" || echo "clean: no worktree mounts left"
```

Expected: final line prints `clean: no worktree mounts left`. Leave the symlinks and `.tailscale-slug` in place (matches the design — teardown never removes those).

- [ ] **Step 7: Commit**

```bash
git add scripts/tailscale-dev/provision.sh .gitignore
git commit -m "$(cat <<'EOF'
feat: add tailscale-dev provision.sh

Symlinks node_modules/vendor/.env from main, allocates ports, launches
serve/queue/pail/vite as one concurrently group, and mounts two
tailscale serve --set-path routes (backend + vite) per checkout.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `teardown.sh`

**Files:**
- Create: `scripts/tailscale-dev/teardown.sh`

**Interfaces:**
- Consumes: `lib.sh`'s `registry::get/remove`, `proc::kill_group`
- Produces: `scripts/tailscale-dev/teardown.sh <path>` — idempotent (no-op with exit 0 if `<path>` has no registry entry); tears down what Task 2's `provision.sh` stood up.

- [ ] **Step 1: Write `teardown.sh`**

```bash
#!/usr/bin/env bash
# scripts/tailscale-dev/teardown.sh
# Development-only. See docs/superpowers/specs/2026-08-18-tailscale-worktree-dev-routing-design.md

set -uo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

usage() { echo "Usage: $(basename "$0") <worktree-path>" >&2; exit 1; }
[[ $# -eq 1 ]] || usage

# The directory may already be gone (e.g. `git worktree remove` ran first),
# so fall back to the raw argument if we can't cd into it.
TARGET=$(cd "$1" 2>/dev/null && pwd) || TARGET="$1"

entry=$(registry::get "$TARGET")
if [[ -z "$entry" ]]; then
  echo "tailscale-dev: no registry entry for $TARGET, nothing to tear down"
  exit 0
fi

SLUG=$(jq -r '.slug' <<<"$entry")
PID=$(jq -r '.pid' <<<"$entry")

proc::kill_group "$PID"
tailscale serve --set-path="/$SLUG" off >/dev/null 2>&1 || true
tailscale serve --set-path="/${SLUG}--vite" off >/dev/null 2>&1 || true
registry::remove "$TARGET"

echo "tailscale-dev: torn down $SLUG ($TARGET)"
```

- [ ] **Step 2: Syntax-check and make executable**

Run: `chmod +x scripts/tailscale-dev/teardown.sh && bash -n scripts/tailscale-dev/teardown.sh`
Expected: no output, exit 0.

- [ ] **Step 3: Test the no-op path first (expected "fail" — proves it doesn't error on an unprovisioned path)**

```bash
scripts/tailscale-dev/teardown.sh /tmp/definitely-not-provisioned-anywhere
echo "exit code: $?"
```

Expected: prints `tailscale-dev: no registry entry for /tmp/definitely-not-provisioned-anywhere, nothing to tear down`, exit code 0.

- [ ] **Step 4: Real end-to-end test — provision, then tear down, this worktree**

```bash
url=$(scripts/tailscale-dev/provision.sh "$PWD")
echo "provisioned: $url"
pid_before=$(jq -r --arg p "$PWD" '.[$p].pid' "$HOME/.config/herdr/plugins/config/tailscale-portfolio/registry.json")
kill -0 "$pid_before" && echo "process is running before teardown"

scripts/tailscale-dev/teardown.sh "$PWD"
echo "exit code: $?"

sleep 1
kill -0 "$pid_before" 2>/dev/null && echo "STILL RUNNING (bug)" || echo "process is gone"
tailscale serve status | grep -- "-harun.dev" && echo "STILL MOUNTED (bug)" || echo "no mounts left"
jq -r --arg p "$PWD" '.[$p] // "absent"' "$HOME/.config/herdr/plugins/config/tailscale-portfolio/registry.json"
```

Expected: `process is gone`, `no mounts left`, and the final `jq` line prints `absent`.

- [ ] **Step 5: Commit**

```bash
git add scripts/tailscale-dev/teardown.sh
git commit -m "$(cat <<'EOF'
feat: add tailscale-dev teardown.sh

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `url.sh`

**Files:**
- Create: `scripts/tailscale-dev/url.sh`

**Interfaces:**
- Consumes: `lib.sh`'s `registry::get/all_paths`, `ts::url_for_slug`, `ts::vite_url_for_slug`
- Produces: `scripts/tailscale-dev/url.sh [path]` (defaults to `$PWD`) and `scripts/tailscale-dev/url.sh --all`. Read-only — never provisions, never modifies the registry or tailscale state.

- [ ] **Step 1: Write `url.sh`**

```bash
#!/usr/bin/env bash
# scripts/tailscale-dev/url.sh
# Read-only lookup. Development-only, see docs/superpowers/specs/2026-08-18-tailscale-worktree-dev-routing-design.md

set -uo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

print_entry() {
  local path="$1" entry slug pid status
  entry=$(registry::get "$path")
  [[ -z "$entry" ]] && return 1
  slug=$(jq -r '.slug' <<<"$entry")
  pid=$(jq -r '.pid' <<<"$entry")
  if kill -0 "$pid" 2>/dev/null; then
    status="running (pid $pid)"
  else
    status="registered but not running (pid $pid is dead) -- try re-provisioning"
  fi
  echo "$path"
  echo "  $(ts::url_for_slug "$slug")"
  echo "  $(ts::vite_url_for_slug "$slug") (vite)"
  echo "  status: $status"
}

if [[ "${1:-}" == "--all" ]]; then
  found=false
  while IFS= read -r path; do
    [[ -z "$path" ]] && continue
    print_entry "$path"
    found=true
  done < <(registry::all_paths)
  "$found" || echo "tailscale-dev: nothing provisioned yet"
  exit 0
fi

TARGET="${1:-$PWD}"
TARGET=$(cd "$TARGET" 2>/dev/null && pwd) || { echo "tailscale-dev: no such directory: $TARGET" >&2; exit 1; }
print_entry "$TARGET" || { echo "tailscale-dev: $TARGET is not provisioned" >&2; exit 1; }
```

- [ ] **Step 2: Syntax-check and make executable**

Run: `chmod +x scripts/tailscale-dev/url.sh && bash -n scripts/tailscale-dev/url.sh`
Expected: no output, exit 0.

- [ ] **Step 3: Test the not-provisioned path first**

```bash
scripts/tailscale-dev/url.sh /tmp/definitely-not-provisioned-anywhere
echo "exit code: $?"
```

Expected: stderr `tailscale-dev: /tmp/definitely-not-provisioned-anywhere is not provisioned`, exit code 1.

- [ ] **Step 4: Real end-to-end test — provision, check both lookup modes, tear down**

```bash
url=$(scripts/tailscale-dev/provision.sh "$PWD")
echo "provisioned: $url"

echo "--- url.sh (default, no args) ---"
scripts/tailscale-dev/url.sh

echo "--- url.sh --all ---"
scripts/tailscale-dev/url.sh --all

scripts/tailscale-dev/teardown.sh "$PWD"
```

Expected: the no-args form prints the same URL from `provision.sh`'s stdout plus a `--vite` line and `status: running (pid ...)`; `--all` shows at least this worktree's entry in the same format. After teardown, the registry is empty again (verify with `jq . "$HOME/.config/herdr/plugins/config/tailscale-portfolio/registry.json"` → `{}`).

- [ ] **Step 5: Commit**

```bash
git add scripts/tailscale-dev/url.sh
git commit -m "$(cat <<'EOF'
feat: add tailscale-dev url.sh lookup command

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: `vite.config.js` — dev-server origin/HMR through the Tailscale mount

**Files:**
- Modify: `vite.config.js`

**Interfaces:**
- Consumes: `VITE_PUBLIC_ORIGIN` env var, set by `provision.sh` (Task 2)
- Produces: no new exports — this changes the *behavior* of the existing default-exported Vite config object, adding a `server` key only when `VITE_PUBLIC_ORIGIN` is set.

This task depends on Task 2 having run at least once in this worktree, since it symlinked `node_modules` here (needed to `import 'vite'` for the test below).

- [ ] **Step 1: Confirm the dependency is in place**

Run: `ls -la node_modules | head -3`
Expected: shows `node_modules -> /Users/rayhan/Code/haruns-portfolio/node_modules` (from Task 2). If this worktree's `node_modules` isn't a symlink yet, run `scripts/tailscale-dev/provision.sh "$PWD"` once first (then tear down again afterward per Task 2 Step 6's cleanup, so this worktree isn't left running mid-plan).

- [ ] **Step 2: Write a throwaway assertion script to pin the "before" behavior**

```bash
node -e "
import('./vite.config.js').then(m => {
  const c = m.default;
  if (c.server !== undefined) { console.error('FAIL: expected server to be undefined before the change, got', c.server); process.exit(1); }
  console.log('PASS: server is undefined (current behavior, no VITE_PUBLIC_ORIGIN support yet)');
}).catch(e => { console.error('ERROR:', e.message); process.exit(1); });
"
```

Expected: `PASS: server is undefined (current behavior, no VITE_PUBLIC_ORIGIN support yet)`.

- [ ] **Step 3: Edit `vite.config.js`**

Current content:

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    define: {
        'import.meta.env.VITE_ASSET_BASE_URL': JSON.stringify(process.env.VITE_ASSET_BASE_URL),
    },
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
});
```

New content:

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    define: {
        'import.meta.env.VITE_ASSET_BASE_URL': JSON.stringify(process.env.VITE_ASSET_BASE_URL),
    },
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
    server: process.env.VITE_PUBLIC_ORIGIN ? {
        origin: process.env.VITE_PUBLIC_ORIGIN,
        hmr: {
            protocol: 'wss',
            host: new URL(process.env.VITE_PUBLIC_ORIGIN).hostname,
            clientPort: 443,
        },
    } : undefined,
});
```

- [ ] **Step 4: Verify both branches of the new behavior**

```bash
echo "--- unset (today's behavior, must be unchanged) ---"
node -e "
import('./vite.config.js').then(m => {
  if (m.default.server !== undefined) { console.error('FAIL: server should stay undefined when VITE_PUBLIC_ORIGIN is unset, got', m.default.server); process.exit(1); }
  console.log('PASS: server stays undefined when VITE_PUBLIC_ORIGIN is unset');
});
"

echo "--- set ---"
VITE_PUBLIC_ORIGIN="https://mx.ewe-ulmer.ts.net/abc123-harun.dev--vite" node -e "
import('./vite.config.js').then(m => {
  const s = m.default.server;
  if (!s || s.origin !== process.env.VITE_PUBLIC_ORIGIN) { console.error('FAIL: origin mismatch', s); process.exit(1); }
  if (s.hmr.protocol !== 'wss') { console.error('FAIL: hmr.protocol', s.hmr); process.exit(1); }
  if (s.hmr.host !== 'mx.ewe-ulmer.ts.net') { console.error('FAIL: hmr.host', s.hmr); process.exit(1); }
  if (s.hmr.clientPort !== 443) { console.error('FAIL: hmr.clientPort', s.hmr); process.exit(1); }
  console.log('PASS: server.origin/hmr resolve correctly when VITE_PUBLIC_ORIGIN is set');
});
"
```

Expected: both `PASS` lines print, no `FAIL`/`ERROR`.

- [ ] **Step 5: Commit**

```bash
git add vite.config.js
git commit -m "$(cat <<'EOF'
feat: make vite dev-server origin/HMR configurable via VITE_PUBLIC_ORIGIN

Backward-compatible: behavior is unchanged when the env var is unset.
Lets Vite's dev server be reverse-proxied under a Tailscale mount --
the same server.origin mechanism laravel-vite-plugin documents for
ngrok/tunnel setups.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: herdr plugin + install script

**Files:**
- Create: `scripts/tailscale-dev/herdr-plugin/herdr-plugin.toml`
- Create: `scripts/tailscale-dev/herdr-plugin/reconcile.sh`
- Create: `scripts/tailscale-dev/install-herdr-plugin.sh`

**Interfaces:**
- Consumes: `scripts/tailscale-dev/provision.sh`, `teardown.sh`, `url.sh` (Tasks 2–4); `lib.sh`'s `MAIN_REPO`, `registry::all_paths`
- Produces: `~/.herdr/plugins/tailscale-portfolio` → symlink to `scripts/tailscale-dev/herdr-plugin/`, installed by running `install-herdr-plugin.sh` once.

- [ ] **Step 1: Write `reconcile.sh`**

```bash
#!/usr/bin/env bash
# scripts/tailscale-dev/herdr-plugin/reconcile.sh
# Runs on herdr startup and on worktree.created/worktree.removed. Diffs
# `git worktree list` against the registry rather than trusting
# HERDR_PLUGIN_EVENT_JSON's shape -- see the design spec §4.4 for why.

set -uo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
REPO_SCRIPTS_DIR="$(cd -- "$SCRIPT_DIR/.." &>/dev/null && pwd)"
# shellcheck source=../lib.sh
source "$REPO_SCRIPTS_DIR/lib.sh"

current_paths=$(git -C "$MAIN_REPO" worktree list --porcelain | awk '/^worktree /{print substr($0, 10)}')
registered_paths=$(registry::all_paths)

while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  if ! grep -qxF "$path" <<<"$registered_paths"; then
    echo "tailscale-dev: provisioning $path"
    "$REPO_SCRIPTS_DIR/provision.sh" "$path" || echo "tailscale-dev: provisioning $path failed" >&2
  fi
done <<<"$current_paths"

while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  if ! grep -qxF "$path" <<<"$current_paths"; then
    echo "tailscale-dev: tearing down $path"
    "$REPO_SCRIPTS_DIR/teardown.sh" "$path" || echo "tailscale-dev: teardown of $path failed" >&2
  fi
done <<<"$registered_paths"
```

- [ ] **Step 2: Write `herdr-plugin.toml`**

```toml
id = "tailscale-portfolio"
name = "Tailscale Portfolio Dev Routing"
version = "0.1.0"
min_herdr_version = "0.7.0"
description = "Exposes haruns-portfolio main + worktrees over Tailscale, symlinking shared deps and allocating per-worktree ports"
platforms = ["macos"]

[[startup]]
command = ["bash", "-c", "exec bash \"$HERDR_PLUGIN_ROOT/reconcile.sh\""]

[[events]]
on = "worktree.created"
command = ["bash", "-c", "exec bash \"$HERDR_PLUGIN_ROOT/reconcile.sh\""]

[[events]]
on = "worktree.removed"
command = ["bash", "-c", "exec bash \"$HERDR_PLUGIN_ROOT/reconcile.sh\""]

[[actions]]
id = "show-urls"
title = "haruns-portfolio: show Tailscale URLs"
contexts = ["workspace"]
command = ["bash", "-c", "exec bash \"$HERDR_PLUGIN_ROOT/../url.sh\" --all"]
```

- [ ] **Step 3: Write `install-herdr-plugin.sh`**

```bash
#!/usr/bin/env bash
# scripts/tailscale-dev/install-herdr-plugin.sh
# One-time, explicit, human-run step. Nothing else in this repo writes to
# ~/.herdr/ on its own.

set -uo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
SRC="$SCRIPT_DIR/herdr-plugin"
DEST="$HOME/.herdr/plugins/tailscale-portfolio"

if [[ -L "$DEST" ]]; then
  current=$(readlink "$DEST")
  if [[ "$current" == "$SRC" ]]; then
    echo "tailscale-dev: already installed at $DEST -> $SRC"
    exit 0
  fi
  echo "tailscale-dev: $DEST is a symlink to something else ($current) -- refusing to overwrite" >&2
  exit 1
elif [[ -e "$DEST" ]]; then
  echo "tailscale-dev: $DEST already exists and isn't a symlink -- refusing to overwrite" >&2
  exit 1
fi

mkdir -p "$(dirname "$DEST")"
ln -s "$SRC" "$DEST"
echo "tailscale-dev: installed $DEST -> $SRC"
echo "tailscale-dev: run 'herdr server reload-config' (or restart herdr) to pick it up"
```

- [ ] **Step 4: Syntax-check, validate the TOML, make scripts executable**

```bash
chmod +x scripts/tailscale-dev/herdr-plugin/reconcile.sh scripts/tailscale-dev/install-herdr-plugin.sh
bash -n scripts/tailscale-dev/herdr-plugin/reconcile.sh
bash -n scripts/tailscale-dev/install-herdr-plugin.sh
python3 -c "import tomllib; tomllib.load(open('scripts/tailscale-dev/herdr-plugin/herdr-plugin.toml','rb')); print('valid TOML')"
```

Expected: no output from the two `bash -n` calls, then `valid TOML`.

- [ ] **Step 5: Install the plugin**

```bash
scripts/tailscale-dev/install-herdr-plugin.sh
readlink "$HOME/.herdr/plugins/tailscale-portfolio"
```

Expected: `tailscale-dev: installed ... -> .../scripts/tailscale-dev/herdr-plugin`, and `readlink` prints this repo's `scripts/tailscale-dev/herdr-plugin` path.

- [ ] **Step 6: Re-run the installer to confirm it's idempotent**

Run: `scripts/tailscale-dev/install-herdr-plugin.sh`
Expected: `tailscale-dev: already installed at ... -> ...`, exit code 0.

- [ ] **Step 7: Real end-to-end test — run `reconcile.sh` directly (simulating what herdr's startup/event hook does) and confirm it provisions every live checkout**

`git -C /Users/rayhan/Code/haruns-portfolio worktree list` currently shows three checkouts: main, this worktree, and a pre-existing `.claude/worktrees/railway-migration` worktree (unrelated to this feature, from an earlier session). None of the three are in the registry at this point, so `reconcile.sh` should provision all three — this is correct, intended behavior (every live git worktree gets a URL), not a bug specific to this test.

```bash
bash "$HOME/.herdr/plugins/tailscale-portfolio/reconcile.sh"
```

Expected: prints three `tailscale-dev: provisioning ...` lines, one per checkout path (order depends on `git worktree list`'s output order). If `railway-migration` fails to provision (e.g. its own `npm run dev`/`php artisan package:discover` errors for reasons unrelated to this plan — divergent dependencies, per the dependency-drift non-goal in the spec), `reconcile.sh` prints `tailscale-dev: provisioning <path> failed` for that one path and continues — that's the designed per-path failure isolation (§ note below), not a reason to stop. Main and this worktree succeeding is what matters for this plan.

- [ ] **Step 8: Verify the full system is up**

```bash
scripts/tailscale-dev/url.sh --all
tailscale serve status
curl -sI "https://mx.ewe-ulmer.ts.net/harun.dev" | head -1
curl -sI "https://mx.ewe-ulmer.ts.net/$(cat .tailscale-slug)-harun.dev" | head -1
```

Expected: `url.sh --all` lists main and this worktree (and `railway-migration`, if Step 7 provisioned it successfully) as `running`; `tailscale serve status` shows a backend + `--vite` mount pair for each successfully-provisioned checkout; both `curl -sI` calls (main and this worktree specifically) return `HTTP/2 200`. If `railway-migration`'s dev servers aren't wanted running long-term, it can be torn down independently at any point with `scripts/tailscale-dev/teardown.sh /Users/rayhan/Code/haruns-portfolio/.claude/worktrees/railway-migration` — that has no effect on main or this worktree.

- [ ] **Step 9: Re-run `reconcile.sh` once more to confirm it's a no-op now that everything is registered**

Run: `bash "$HOME/.herdr/plugins/tailscale-portfolio/reconcile.sh"`
Expected: no `provisioning`/`tearing down` lines print for any successfully-provisioned path from Step 7 (each is already in the registry and still exists on disk). If `railway-migration` failed to provision in Step 7, it's also not in the registry, so it's correctly retried here too — that's expected, not a hang or a bug.

- [ ] **Step 10: Commit**

```bash
git add scripts/tailscale-dev/herdr-plugin scripts/tailscale-dev/install-herdr-plugin.sh
git commit -m "$(cat <<'EOF'
feat: add tailscale-dev herdr plugin (reconcile via git worktree list diff)

Installed via scripts/tailscale-dev/install-herdr-plugin.sh, which
symlinks the in-repo plugin source into ~/.herdr/plugins/tailscale-portfolio/
so it's the same version-controlled, reviewable source as the scripts
it drives. Diffs `git worktree list --porcelain` against the registry on
startup and on worktree.created/worktree.removed, rather than parsing
HERDR_PLUGIN_EVENT_JSON -- guard-main's own worktree hooks use the same
relist-rather-than-trust-the-payload approach.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Final state after this task:** main and this worktree are both live and running on their Tailscale URLs — this is the intended end state, not something to tear down. Leave it running; that's the feature working.

---

## Self-Review Notes

- **Spec coverage:** §4.1 registry → Task 1. §4.2 provisioning steps 0–7 → Task 2 (main-checkout skip logic included). §4.3 teardown → Task 3. §4.4 herdr plugin (git-worktree-list diff, in-repo source + install script) → Task 6. §4.5 vite.config.js → Task 5. §4.6 url lookup (+ `--all` addition for the herdr action) → Task 4. §4.7 env handling → threaded through Task 2 (`APP_URL`/`ASSET_URL`/`VITE_PUBLIC_ORIGIN` exports, no `.env` writes). §6 error handling: port retry (registry-based allocation + bind-then-register ordering in Task 2), symlink-clobber guard (Task 2 Step 4), reboot/orphan recovery (Task 6's `reconcile.sh`), dependency drift (documented non-goal, no code needed), hardcoded-link limitation (documented non-goal, no code needed — user decision recorded in spec §6). §2.1 dev-only guard → `guard::require_local_env` (Task 1) wired into `provision.sh`/`teardown.sh`'s shared `lib.sh` import (Task 2/3 both source it; `teardown.sh` doesn't call the guard directly since tearing down is always safe — see note below).
- **Placeholder scan:** no TBD/TODO; every step has real, complete code; no "similar to Task N" cross-references without inline code.
- **One intentional deviation from a literal reading of the spec:** `teardown.sh` does not call `guard::require_local_env`. Reasoning: the guard exists to stop provisioning from ever running against a non-local checkout; tearing down an already-provisioned entry is safe and desirable regardless of `APP_ENV`, and gating teardown on it would risk leaving orphaned processes/mounts undeletable if `.env` ever ends up in an unexpected state. `provision.sh` (the only script with the risky, non-idempotent side effect) does call it.
- **Type/name consistency check:** `registry::get/set/remove/all_paths/alloc_port`, `slug::generate/for_path`, `ts::hostname/url_for_slug/vite_url_for_slug`, `env::read_var`, `guard::require_local_env`, `net::wait_for_port`, `proc::kill_group` — same names and argument order used identically in Task 1's definitions and every later task's usage. Registry JSON shape (`slug`, `backend_port`, `vite_port`, `pid`) matches between `provision.sh`'s `registry::set` call, `teardown.sh`/`url.sh`'s `jq -r '.slug'`/`.pid'` reads, and the spec's §4.1 example.
