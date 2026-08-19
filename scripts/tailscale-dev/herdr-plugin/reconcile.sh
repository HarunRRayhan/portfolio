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
