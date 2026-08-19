#!/usr/bin/env bash
# scripts/tailscale-dev/test-lib.sh
set -uo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'
FAILURES=0

pass() { echo -e "${GREEN}PASS${NC}: $1"; }
fail() { echo -e "${RED}FAIL${NC}: $1"; FAILURES=$((FAILURES + 1)); }
assert_eq() {
  if [[ "$1" == "$2" ]]; then pass "$3"; else fail "$3 (expected '$2', got '$1')"; fi
}

TMP_ROOT=$(mktemp -d)
trap 'rm -rf "$TMP_ROOT"' EXIT

export MAIN_REPO="$TMP_ROOT/main"
export TAILSCALE_DEV_REGISTRY="$TMP_ROOT/registry.json"
mkdir -p "$MAIN_REPO"

# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

echo "--- registry ---"
registry::set "/a" '{"slug":"a-harun.dev","backend_port":8200,"vite_port":5180,"pid":111}'
got=$(registry::get "/a" | jq -r '.slug')
assert_eq "$got" "a-harun.dev" "registry::set/get round-trips"

registry::set "/b" '{"slug":"b-harun.dev","backend_port":8201,"vite_port":5181,"pid":222}'
paths=$(registry::all_paths | sort | tr '\n' ',')
assert_eq "$paths" "/a,/b," "registry::all_paths lists both entries"

echo "--- port allocation ---"
p=$(registry::alloc_port 8200 8299 backend_port)
assert_eq "$p" "8202" "registry::alloc_port skips ports already in use (8200, 8201 taken)"

registry::remove "/a"
got=$(registry::get "/a")
assert_eq "$got" "" "registry::remove deletes the entry"
registry::remove "/b"

echo "--- slug ---"
id=$(slug::generate)
len=${#id}
assert_eq "$len" "6" "slug::generate produces a 6-char id"
if [[ "$id" =~ ^[a-z0-9]{6}$ ]]; then pass "slug::generate is lowercase alnum"; else fail "slug::generate charset: got '$id'"; fi

main_slug=$(slug::for_path "$MAIN_REPO")
assert_eq "$main_slug" "harun.dev" "slug::for_path returns the fixed slug for MAIN_REPO"

WT="$TMP_ROOT/worktree"
mkdir -p "$WT"
wt_slug1=$(slug::for_path "$WT")
wt_slug2=$(slug::for_path "$WT")
assert_eq "$wt_slug1" "$wt_slug2" "slug::for_path is idempotent for the same worktree"
if [[ "$wt_slug1" =~ ^[a-z0-9]{6}-harun\.dev$ ]]; then pass "slug::for_path worktree slug has the expected shape"; else fail "slug::for_path shape: got '$wt_slug1'"; fi
if [[ -f "$WT/.tailscale-slug" ]]; then pass "slug::for_path persists .tailscale-slug"; else fail "slug::for_path did not write .tailscale-slug"; fi

echo "--- env guard ---"
echo "APP_ENV=local" > "$MAIN_REPO/.env"
val=$(env::read_var "$MAIN_REPO/.env" "APP_ENV")
assert_eq "$val" "local" "env::read_var reads APP_ENV"

if (guard::require_local_env "$MAIN_REPO") 2>/dev/null; then pass "guard::require_local_env passes when APP_ENV=local"; else fail "guard::require_local_env should have passed"; fi

echo "APP_ENV=production" > "$MAIN_REPO/.env"
if (guard::require_local_env "$MAIN_REPO") 2>/dev/null; then fail "guard::require_local_env should have refused APP_ENV=production"; else pass "guard::require_local_env refuses APP_ENV=production"; fi
echo "APP_ENV=local" > "$MAIN_REPO/.env"

echo "--- net::wait_for_port ---"
python3 -c "
import http.server
http.server.HTTPServer(('127.0.0.1', 58433), http.server.BaseHTTPRequestHandler).serve_forever()
" &
PROBE_PID=$!
sleep 1
if net::wait_for_port 58433 5; then pass "net::wait_for_port succeeds once a port is listening"; else fail "net::wait_for_port timed out on a live port"; fi
kill "$PROBE_PID" 2>/dev/null
wait "$PROBE_PID" 2>/dev/null

if net::wait_for_port 58999 2; then fail "net::wait_for_port should have timed out on a dead port"; else pass "net::wait_for_port times out on a port nobody is listening on"; fi

echo "--- proc::kill_group ---"
# 4-level-deep tree (GROUP_PID -> branch -> sub-subshell -> sleep), mirroring
# the real concurrently -> grouped-process -> php-S/node grandchild shape.
(
  (
    ( sleep 60 & sleep 60 & wait ) &
    wait
  ) &
  (
    ( sleep 60 & sleep 60 & wait ) &
    wait
  ) &
  wait
) &
GROUP_PID=$!
sleep 1
descendants_before=()
while IFS= read -r d; do
  [[ -n "$d" ]] && descendants_before+=("$d")
done < <(proc::descendants "$GROUP_PID")
assert_eq "${#descendants_before[@]}" "8" "proc test setup has a 4-level-deep tree (8 descendants)"
proc::kill_group "$GROUP_PID"
sleep 1
if kill -0 "$GROUP_PID" 2>/dev/null; then fail "proc::kill_group left the group PID alive"; else pass "proc::kill_group killed the group PID"; fi
still_alive=0
for d in "${descendants_before[@]}"; do
  kill -0 "$d" 2>/dev/null && still_alive=$((still_alive + 1))
done
if (( still_alive == 0 )); then pass "proc::kill_group killed the full 4-level descendant tree"; else fail "proc::kill_group left $still_alive descendant(s) from the deep tree alive"; fi

echo "--- tailscale hostname (real, needs tailscaled running) ---"
host=$(ts::hostname)
if [[ "$host" == *.ts.net ]]; then pass "ts::hostname returns a *.ts.net MagicDNS name (got '$host')"; else fail "ts::hostname: got '$host'"; fi

echo
if (( FAILURES > 0 )); then
  echo -e "${RED}${FAILURES} check(s) failed${NC}"
  exit 1
fi
echo -e "${GREEN}All lib.sh checks passed${NC}"
