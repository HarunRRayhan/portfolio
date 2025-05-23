#!/bin/sh
set -e

echo "[entrypoint-nginx.sh] Starting as $(whoami)"

# No chown for nginx
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

exec "$@" 