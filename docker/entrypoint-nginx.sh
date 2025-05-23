#!/bin/sh
set -e

echo "[entrypoint-nginx.sh] Starting as $(whoami)"

# Ensure required directories exist
mkdir -p storage bootstrap/cache

# No chown for nginx
chmod -R 775 storage bootstrap/cache

exec nginx -g 'daemon off;' 