#!/usr/bin/env bash
# scripts/tailscale-dev/install-herdr-plugin.sh
# One-time, explicit, human-run step. Nothing else in this repo writes to
# ~/.herdr/ on its own.
#
# Registers the plugin via `herdr plugin link`, which creates the
# ~/.herdr/plugins/tailscale-portfolio symlink AND records it in herdr's own
# plugins.json. A hand-rolled symlink at that path is not enough -- herdr
# only loads plugins it has explicitly linked/installed, so a symlink herdr
# doesn't know about never fires worktree.created/worktree.removed.

set -uo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

SRC="$MAIN_REPO/scripts/tailscale-dev/herdr-plugin"
DEST="$HOME/.herdr/plugins/tailscale-portfolio"
PLUGIN_ID="tailscale-portfolio"

[[ -d "$SRC" ]] || { echo "tailscale-dev: plugin source not found at $SRC (is MAIN_REPO set correctly?)" >&2; exit 1; }
command -v herdr >/dev/null 2>&1 || { echo "tailscale-dev: 'herdr' not found on PATH" >&2; exit 1; }

if herdr plugin list 2>/dev/null | grep -qE "^- ${PLUGIN_ID} "; then
  echo "tailscale-dev: $PLUGIN_ID is already registered with herdr"
  exit 0
fi

# A prior version of this script hand-symlinked $DEST without ever calling
# `herdr plugin link`, so herdr never loaded it -- clear that out first so
# `herdr plugin link` doesn't trip over a path it doesn't own.
if [[ -L "$DEST" ]]; then
  current=$(readlink "$DEST")
  if [[ "$current" == "$SRC" || ! -e "$DEST" ]]; then
    echo "tailscale-dev: removing stale unregistered symlink at $DEST"
    rm -f "$DEST"
  else
    echo "tailscale-dev: $DEST is a symlink to something else ($current) -- refusing to touch it" >&2
    exit 1
  fi
elif [[ -e "$DEST" ]]; then
  echo "tailscale-dev: $DEST already exists and isn't a symlink -- refusing to overwrite" >&2
  exit 1
fi

herdr plugin link "$SRC" || { echo "tailscale-dev: 'herdr plugin link' failed" >&2; exit 1; }

if herdr plugin list 2>/dev/null | grep -qE "^- ${PLUGIN_ID} "; then
  echo "tailscale-dev: $PLUGIN_ID registered and enabled"
else
  echo "tailscale-dev: 'herdr plugin link' returned success but $PLUGIN_ID is still not in 'herdr plugin list' -- registration did not take" >&2
  exit 1
fi
