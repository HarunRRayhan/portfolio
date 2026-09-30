#!/usr/bin/env bash
set -euo pipefail

# Allow web's preDeploy migration to finish before the scheduler rollout starts.
# Each tick is its own process, and a failed task never advances the heartbeat.
startup_deadline=$(( $(date +%s) + 300 ))
child_pid=''
stop() {
  if [[ -n "$child_pid" ]]; then
    kill -TERM "$child_pid" 2>/dev/null || true
    wait "$child_pid" 2>/dev/null || true
  fi
  exit 0
}
trap stop TERM INT
while true; do
  php artisan operations:scheduler-tick --no-interaction &
  child_pid=$!
  result=0
  wait "$child_pid" || result=$?
  child_pid=''
  if [[ "$result" -eq 75 && $(date +%s) -lt "$startup_deadline" ]]; then
    sleep 10 &
    child_pid=$!
    wait "$child_pid"
    child_pid=''
    continue
  fi
  [[ "$result" -eq 0 ]] || exit "$result"
  # Subsequent dependency failures must surface immediately, rather than retrying tasks.
  startup_deadline=0
  delay=$(( 60 - $(date +%s) % 60 ))
  sleep "$delay" &
  child_pid=$!
  wait "$child_pid"
  child_pid=''
done
