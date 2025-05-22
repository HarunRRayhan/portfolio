#!/bin/sh
set -e

mkdir -p \
  /var/www/html/storage/framework/cache \
  /var/www/html/storage/framework/sessions \
  /var/www/html/storage/framework/views \
  /var/www/html/storage/framework/testing \
  /var/www/html/storage/framework/logs \
  /var/www/html/storage/framework/cache/data \
  /var/www/html/bootstrap/cache \
  /var/www/html/storage/logs \
  /var/www/html/storage/app/public

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

exec "$@" 