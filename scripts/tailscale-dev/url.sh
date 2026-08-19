#!/usr/bin/env bash
# scripts/tailscale-dev/url.sh
# Read-only lookup. Development-only, see docs/superpowers/specs/2026-08-18-tailscale-worktree-dev-routing-design.md

set -uo pipefail

# -P (physical) matters here: the herdr plugin action invokes this script as
# "$HERDR_PLUGIN_ROOT/../url.sh", and $HERDR_PLUGIN_ROOT is itself the
# ~/.herdr/plugins/tailscale-portfolio symlink installed by
# install-herdr-plugin.sh. Bash's logical `cd` strips ".." textually rather
# than resolving symlinks first, so a plain `cd .../tailscale-portfolio/..`
# lands in the symlink's own apparent parent (~/.herdr/plugins) instead of
# this repo's scripts/tailscale-dev, and lib.sh fails to source.
SCRIPT_DIR="$(cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

print_entry() {
  local path="$1" entry slug pid vite_port status
  entry=$(registry::get "$path")
  [[ -z "$entry" ]] && return 1
  slug=$(jq -r '.slug' <<<"$entry")
  pid=$(jq -r '.pid' <<<"$entry")
  vite_port=$(jq -r '.vite_port' <<<"$entry")
  if kill -0 "$pid" 2>/dev/null; then
    status="running (pid $pid)"
  else
    status="registered but not running (pid $pid is dead) -- try re-provisioning"
  fi
  echo "$path"
  echo "  $(ts::url_for_slug "$slug")"
  echo "  $(ts::vite_url_for_port "$vite_port") (vite)"
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

TARGET_ARG="${1:-$PWD}"
TARGET=$(cd "$TARGET_ARG" 2>/dev/null && pwd) || TARGET="$TARGET_ARG"
print_entry "$TARGET" || { echo "tailscale-dev: $TARGET is not provisioned" >&2; exit 1; }
