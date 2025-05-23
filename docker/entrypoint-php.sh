#!/bin/sh
set -e

echo "[entrypoint-php.sh] Starting as $(whoami)"

# Ensure correct permissions for Laravel
if id www-data >/dev/null 2>&1; then
  chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache || true
else
  echo "www-data user does not exist, skipping chown" >&2
fi
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

exec "$@" 