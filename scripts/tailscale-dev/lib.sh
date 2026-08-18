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
