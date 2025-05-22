# Builder stage
FROM php:8.2-fpm-alpine AS builder

# Install build dependencies
RUN apk add --no-cache $PHPIZE_DEPS postgresql-dev libzip-dev zip unzip git \
    && docker-php-ext-install pdo pdo_pgsql

WORKDIR /app

# Copy composer files and source
COPY composer.json composer.lock ./
COPY app ./app
COPY bootstrap ./bootstrap
COPY config ./config
COPY database ./database
COPY resources ./resources
COPY routes ./routes
COPY artisan ./

# Install Composer
RUN wget https://getcomposer.org/composer-stable.phar -O composer.phar \
    && php composer.phar install --no-dev --optimize-autoloader \
    && rm composer.phar

# Production image
FROM php:8.2-fpm-alpine AS php-fpm

# Install runtime and build dependencies only
RUN apk add --no-cache postgresql-libs postgresql-dev libzip openssl \
    && docker-php-ext-install pdo pdo_pgsql

WORKDIR /var/www/html

COPY public ./public
RUN mkdir -p /var/www/html/public && echo 'OK' > /var/www/html/public/health.txt

# Only copy manifest.json from public/build
COPY public/build/manifest.json ./public/build/manifest.json

# Copy other necessary files
COPY composer.json ./
COPY --from=builder /app/vendor ./vendor
COPY --from=builder /app/app ./app
COPY --from=builder /app/bootstrap ./bootstrap
COPY --from=builder /app/config ./config
COPY --from=builder /app/database ./database
COPY --from=builder /app/resources ./resources
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/artisan ./
COPY .env ./
COPY ../docker/wait-for-db.sh ./wait-for-db.sh
COPY docker/entrypoint.sh /entrypoint.sh

# Ensure required directories exist
RUN mkdir -p /var/www/html/storage/framework/{cache,sessions,views,testing,logs,cache/data} \
    /var/www/html/bootstrap/cache \
    && touch /var/www/html/resources/views/.placeholder

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache \
    && chmod -R 755 /var/www/html/public/build

# Debug: list resources and config before artisan commands
RUN ls -l /var/www/html/resources && ls -l /var/www/html/resources/views && ls -l /var/www/html/config

# Create storage link
RUN php artisan storage:link

# Clear and cache configuration
RUN php artisan config:clear \
    && php artisan config:cache \
    && php artisan route:clear \
    && php artisan route:cache

# Ensure required Laravel directories exist and are writable
RUN mkdir -p /var/www/html/storage/framework/{cache,sessions,views,testing,logs,cache/data} \
    /var/www/html/bootstrap/cache \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

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

# Copy custom Nginx config (to be specified in compose) 