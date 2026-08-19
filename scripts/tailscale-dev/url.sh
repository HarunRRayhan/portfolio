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

TARGET_ARG="${1:-$PWD}"
TARGET=$(cd "$TARGET_ARG" 2>/dev/null && pwd) || TARGET="$TARGET_ARG"
print_entry "$TARGET" || { echo "tailscale-dev: $TARGET is not provisioned" >&2; exit 1; }
