#!/bin/sh
set -e

echo "[entrypoint-php.sh] Starting PHP-FPM setup as $(whoami)"

# Ensure Laravel directories exist with proper permissions
mkdir -p /var/www/html/storage/framework/{cache,sessions,views,testing,logs,cache/data} \
         /var/www/html/bootstrap/cache

# Set proper ownership and permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Clear and rebuild Laravel caches
php artisan config:clear || true
php artisan view:clear || true
php artisan route:clear || true

echo "[entrypoint-php.sh] Laravel setup complete, starting PHP-FPM"

# Start PHP-FPM
exec "$@" 