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
  if [[ ! -e "$DEST" ]]; then
    # Dangling symlink (its target no longer exists on disk, e.g. a worktree
    # removed after merge) -- safely replaceable, not "points somewhere else".
    echo "tailscale-dev: $DEST is a dangling symlink (-> $current, target missing) -- replacing it"
    rm -f "$DEST"
  else
    echo "tailscale-dev: $DEST is a symlink to something else ($current) -- refusing to overwrite" >&2
    exit 1
  fi
elif [[ -e "$DEST" ]]; then
  echo "tailscale-dev: $DEST already exists and isn't a symlink -- refusing to overwrite" >&2
  exit 1
fi

mkdir -p "$(dirname "$DEST")"
ln -s "$SRC" "$DEST" || { echo "tailscale-dev: failed to symlink $DEST -> $SRC" >&2; exit 1; }
echo "tailscale-dev: installed $DEST -> $SRC"
echo "tailscale-dev: run 'herdr server reload-config' (or restart herdr) to pick it up"
