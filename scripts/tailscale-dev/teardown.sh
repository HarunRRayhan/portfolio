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
VITE_PORT=$(jq -r '.vite_port' <<<"$entry")

proc::kill_group "$PID"
tailscale serve --set-path="/$SLUG" off >/dev/null 2>&1 || true
tailscale serve --https="$VITE_PORT" off >/dev/null 2>&1 || true
rm -f "$TARGET/public/hot"
registry::remove "$TARGET"

echo "tailscale-dev: torn down $SLUG ($TARGET)"
