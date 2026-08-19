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

IS_MAIN=false
[[ "$TARGET" == "$MAIN_REPO" ]] && IS_MAIN=true

if [[ "$IS_MAIN" == false ]]; then
  for item in node_modules vendor .env .claude/settings.local.json; do
    src="$MAIN_REPO/$item"
    dst="$TARGET/$item"
    if [[ -L "$dst" ]]; then
      : # already our symlink, idempotent no-op
    elif [[ -e "$dst" ]]; then
      echo "tailscale-dev: refusing to clobber existing $dst (not a symlink we own)" >&2
      exit 1
    else
      ln -s "$src" "$dst" || { echo "tailscale-dev: failed to symlink $dst -> $src" >&2; exit 1; }
    fi
  done
fi

# Checked after the symlink step above: a non-main worktree has no .env of
# its own until node_modules/vendor/.env are symlinked in; checking before
# that would always fail. Main's own .env is already present either way.
guard::require_local_env "$TARGET"

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
  # Redirect stdout only (stderr stays visible for real failures) — the
  # interface contract is "prints the checkout's URL on stdout", and this
  # command's own --ansi banner would otherwise land on stdout ahead of it
  # on every run, breaking any caller that does APP_URL=$(provision.sh ...).
  (cd "$TARGET" && php artisan package:discover --ansi >/dev/null) || {
    echo "tailscale-dev: php artisan package:discover failed in $TARGET" >&2
    exit 1
  }
fi

APP_URL=$(ts::url_for_slug "$SLUG")
VITE_PUBLIC_ORIGIN=$(ts::vite_url_for_port "$VITE_PORT")

# Defensive: clear any mount/process left over from a run that ended without
# going through teardown.sh — tailscale serve state and the registry both
# persist independently of whether the process that set them is still alive.
tailscale serve --set-path="/$SLUG" off >/dev/null 2>&1 || true
tailscale serve --https="$VITE_PORT" off >/dev/null 2>&1 || true
prior_pid=$(registry::get "$TARGET" | jq -r '.pid // empty')
[[ -n "$prior_pid" ]] && proc::kill_group "$prior_pid"

# Bind the ports before registering them with tailscale serve. Registering
# first reserves the port for tailscale and makes the dev server's own
# bind() fail with EADDRINUSE.
#
# stdout/stderr are redirected to a log file, not inherited from this script:
# any backgrounded grandchild that keeps our stdout fd open (which all four
# of these do, since none of them exit on their own) would otherwise make a
# caller's `$(provision.sh ...)` command substitution block forever waiting
# for that fd to close, even though this script itself returns immediately.
mkdir -p "$TARGET/storage/logs"
(
  cd "$TARGET" && \
  APP_URL="$APP_URL" ASSET_URL="$APP_URL" VITE_PUBLIC_ORIGIN="$VITE_PUBLIC_ORIGIN" \
  exec npx --yes concurrently@9 \
    --names server,queue,logs,vite \
    --kill-others \
    "php artisan serve --port=$BACKEND_PORT" \
    "php artisan queue:listen --tries=1" \
    "php artisan pail --timeout=0" \
    "npm run dev -- --port=$VITE_PORT --host=127.0.0.1 --strictPort"
) >>"$TARGET/storage/logs/tailscale-dev.log" 2>&1 &
GROUP_PID=$!
disown

LOG_FILE="$TARGET/storage/logs/tailscale-dev.log"

# Catch an immediate failure (e.g. npx/concurrently not found) rather than
# waiting the full port timeout for something that already died.
sleep 0.5
if ! kill -0 "$GROUP_PID" 2>/dev/null; then
  echo "tailscale-dev: dev server group died immediately after launch -- see $LOG_FILE" >&2
  exit 1
fi

if ! net::wait_for_port "$BACKEND_PORT" 30; then
  echo "tailscale-dev: backend port $BACKEND_PORT did not come up in time -- see $LOG_FILE" >&2
  proc::kill_group "$GROUP_PID"
  exit 1
fi
if ! net::wait_for_port "$VITE_PORT" 30; then
  echo "tailscale-dev: vite port $VITE_PORT did not come up in time -- see $LOG_FILE" >&2
  proc::kill_group "$GROUP_PID"
  exit 1
fi

if ! tailscale serve --bg --set-path="/$SLUG" "http://127.0.0.1:$BACKEND_PORT" >/dev/null; then
  echo "tailscale-dev: failed to mount app at /$SLUG" >&2
  proc::kill_group "$GROUP_PID"
  exit 1
fi
if ! tailscale serve --bg --https="$VITE_PORT" "http://127.0.0.1:$VITE_PORT" >/dev/null; then
  echo "tailscale-dev: failed to mount vite at :$VITE_PORT" >&2
  tailscale serve --set-path="/$SLUG" off >/dev/null 2>&1 || true
  proc::kill_group "$GROUP_PID"
  exit 1
fi

registry::set "$TARGET" "$(jq -n \
  --arg slug "$SLUG" \
  --argjson backend_port "$BACKEND_PORT" \
  --argjson vite_port "$VITE_PORT" \
  --argjson pid "$GROUP_PID" \
  '{slug: $slug, backend_port: $backend_port, vite_port: $vite_port, pid: $pid}')"

echo "$APP_URL"
