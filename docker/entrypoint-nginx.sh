#!/bin/sh
set -e

echo "[entrypoint-nginx.sh] Starting nginx as $(whoami)"

# Ensure nginx can write to its required directories
mkdir -p /tmp/nginx /var/cache/nginx || true

# Start nginx in foreground
exec nginx -g 'daemon off;' 