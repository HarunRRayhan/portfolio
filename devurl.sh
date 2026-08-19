#!/usr/bin/env bash
# devurl.sh — shortcut for scripts/tailscale-dev/url.sh
# Usage: ./devurl.sh [path] | ./devurl.sh --all

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
exec bash "$SCRIPT_DIR/scripts/tailscale-dev/url.sh" "$@"
