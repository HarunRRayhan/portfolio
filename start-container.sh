#!/bin/bash
set -euo pipefail

# Railway pre-deploy filesystem changes do not persist into this container.
# Refresh configuration from runtime variables; migrations stay in pre-deploy.
php artisan storage:link
php artisan optimize:clear
php artisan optimize

# Build and runtime use the same self-contained SSR bundle. If either process
# exits, restart the container rather than silently serving without SSR.
node bootstrap/ssr/ssr.js &
ssr_pid=$!

docker-php-entrypoint --config /Caddyfile --adapter caddyfile &
web_pid=$!

cleanup() {
    kill "$ssr_pid" "$web_pid" 2>/dev/null || true
    wait "$ssr_pid" "$web_pid" 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 0' TERM INT
wait -n "$ssr_pid" "$web_pid"
exit 1
