#!/usr/bin/env bash
# scripts/tailscale-dev/herdr-plugin/reconcile.sh
# Runs on herdr startup and on worktree.created/worktree.removed. Diffs
# `git worktree list` against the registry rather than trusting
# HERDR_PLUGIN_EVENT_JSON's shape -- see the design spec §4.4 for why.

set -uo pipefail

# -P (physical) resolves the symlink herdr installs this plugin as
# (~/.herdr/plugins/tailscale-portfolio -> .../scripts/tailscale-dev/herdr-plugin)
# before we append "..": bash's logical `cd` treats ".." as a textual strip
# off $PWD rather than resolving symlinks first, so `cd "$SYMLINK/.."` lands
# in the symlink's own apparent parent directory, not the real repo root.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd -P)"
REPO_SCRIPTS_DIR="$(cd -- "$SCRIPT_DIR/.." &>/dev/null && pwd)"
# shellcheck source=../lib.sh
source "$REPO_SCRIPTS_DIR/lib.sh"

worktree_list=$(git -C "$MAIN_REPO" worktree list --porcelain)
if [[ $? -ne 0 ]]; then
  echo "tailscale-dev: git worktree list --porcelain failed -- aborting reconcile (refusing to treat this as \"nothing is checked out\")" >&2
  exit 1
fi
current_paths=$(awk '/^worktree /{print substr($0, 10)}' <<<"$worktree_list")
registered_paths=$(registry::all_paths)

while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  if ! grep -qxF "$path" <<<"$registered_paths"; then
    echo "tailscale-dev: provisioning $path (not yet registered)"
    "$REPO_SCRIPTS_DIR/provision.sh" "$path" || echo "tailscale-dev: provisioning $path failed" >&2
    continue
  fi
  pid=$(registry::get "$path" | jq -r '.pid // empty')
  if [[ -n "$pid" ]] && ! kill -0 "$pid" 2>/dev/null; then
    echo "tailscale-dev: re-provisioning $path (registered pid $pid is dead)"
    "$REPO_SCRIPTS_DIR/provision.sh" "$path" || echo "tailscale-dev: re-provisioning $path failed" >&2
  fi
done <<<"$current_paths"

while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  if ! grep -qxF "$path" <<<"$current_paths"; then
    echo "tailscale-dev: tearing down $path"
    "$REPO_SCRIPTS_DIR/teardown.sh" "$path" || echo "tailscale-dev: teardown of $path failed" >&2
  fi
done <<<"$registered_paths"
