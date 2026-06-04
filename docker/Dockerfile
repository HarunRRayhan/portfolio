# syntax=docker/dockerfile:1.7

# Builder stage
FROM php:8.4-fpm-alpine AS builder

# Install build dependencies
RUN apk add --no-cache $PHPIZE_DEPS postgresql-dev libzip-dev zip unzip git \
    && docker-php-ext-install pdo pdo_pgsql

WORKDIR /app

# Copy only composer metadata first so dependency installation can be cached
COPY composer.json composer.lock ./

# Install Composer dependencies without app-source-sensitive scripts
RUN --mount=type=cache,target=/tmp/composer-cache \
    wget https://getcomposer.org/composer-stable.phar -O composer.phar \
    && COMPOSER_CACHE_DIR=/tmp/composer-cache php composer.phar install --no-dev --optimize-autoloader --no-interaction --no-scripts \
    && rm composer.phar

# Copy application source after vendor install so code-only changes don't invalidate the dependency layer
COPY app ./app
COPY bootstrap ./bootstrap
COPY config ./config
COPY database ./database
COPY resources ./resources
COPY routes ./routes
COPY artisan ./

# Remove any stale cached manifests before rebuilding package discovery
RUN rm -f bootstrap/cache/*.php

# Rebuild package discovery now that the app source exists
RUN php artisan package:discover --ansi

# Production image
FROM php:8.4-fpm-alpine AS php-fpm

# Install runtime and build dependencies only
RUN apk add --no-cache postgresql-libs postgresql-dev libzip openssl \
    && docker-php-ext-install pdo pdo_pgsql

# Hide PHP version/header disclosure
RUN echo "expose_php = Off" > /usr/local/etc/php/conf.d/99-hide-x-powered-by.ini

WORKDIR /var/www/html

# Copy stable application layers first so deploy-specific files don't invalidate the cache early
COPY composer.json ./
COPY --from=builder /app/vendor ./vendor
COPY --from=builder /app/app ./app
COPY --from=builder /app/bootstrap ./bootstrap
COPY --from=builder /app/config ./config
COPY --from=builder /app/database ./database
COPY --from=builder /app/resources ./resources
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/artisan ./

# Copy runtime helpers before the frequently changing deploy assets/env
COPY docker/wait-for-db.sh ./wait-for-db.sh
COPY docker/entrypoint-php.sh /entrypoint-php.sh

# Deploy-specific content copied last to preserve cache reuse
COPY public ./public
RUN mkdir -p /var/www/html/public && echo 'OK' > /var/www/html/public/health.txt
COPY public/build/manifest.json ./public/build/manifest.json
COPY .env ./


# Ensure required directories exist
RUN mkdir -p /var/www/html/storage/framework/cache \
    /var/www/html/storage/framework/cache/data \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/framework/testing \
    /var/www/html/storage/framework/logs \
    /var/www/html/bootstrap/cache \
    && touch /var/www/html/resources/views/.placeholder

# Set permissions for writable runtime paths only
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache \
    && chmod -R 755 /var/www/html/public/build

# Debug: list resources and config
RUN ls -l /var/www/html/resources && ls -l /var/www/html/resources/views && ls -l /var/www/html/config

# Note: Laravel commands (storage:link, config:cache, route:cache, view:cache) 
# are now handled by the deployment script after container startup
# to ensure proper database connectivity and environment configuration

# Ensure required Laravel directories exist and are writable
RUN mkdir -p /var/www/html/storage/framework/cache \
    /var/www/html/storage/framework/cache/data \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/framework/testing \
    /var/www/html/storage/framework/logs \
    /var/www/html/bootstrap/cache \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

RUN chmod +x /entrypoint-php.sh
ENTRYPOINT ["/entrypoint-php.sh"]

EXPOSE 9000

CMD ["php-fpm"]

# Nginx image for blue/green
FROM nginx:1.27.5-alpine AS nginx-app

# Copy built Laravel app from PHP image
COPY --from=php-fpm /var/www/html/public /var/www/html/public
COPY --from=php-fpm /var/www/html/vendor /var/www/html/vendor
COPY --from=php-fpm /var/www/html/bootstrap /var/www/html/bootstrap
COPY --from=php-fpm /var/www/html/config /var/www/html/config
COPY --from=php-fpm /var/www/html/resources /var/www/html/resources
COPY --from=php-fpm /var/www/html/routes /var/www/html/routes
COPY --from=php-fpm /var/www/html/database /var/www/html/database
COPY --from=php-fpm /var/www/html/app /var/www/html/app
COPY --from=php-fpm /var/www/html/artisan /var/www/html/artisan
COPY --from=php-fpm --chown=nginx:nginx /var/www/html/storage /var/www/html/storage
COPY --from=php-fpm --chown=nginx:nginx /var/www/html/bootstrap/cache /var/www/html/bootstrap/cache

# Copy entrypoint script
COPY docker/entrypoint-nginx.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Ensure writable runtime directories exist with the right permissions
RUN mkdir -p /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

WORKDIR /var/www/html
USER nginx

ENTRYPOINT ["/entrypoint.sh"]
EXPOSE 80 