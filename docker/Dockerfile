# Builder stage
FROM php:8.2-fpm-alpine AS builder

# Install build dependencies
RUN apk add --no-cache $PHPIZE_DEPS postgresql-dev libzip-dev zip unzip git

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
FROM php:8.2-fpm-alpine

# Install runtime dependencies only
RUN apk add --no-cache postgresql-libs libzip openssl

WORKDIR /var/www/html

# Copy built assets and production files
COPY public ./public
COPY --from=builder /app/vendor ./vendor
COPY --from=builder /app/app ./app
COPY --from=builder /app/bootstrap ./bootstrap
COPY --from=builder /app/config ./config
COPY --from=builder /app/database ./database
COPY --from=builder /app/resources ./resources
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/artisan ./
COPY .env ./

# Ensure required directories exist
RUN mkdir -p /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/public/build /var/www/html/resources/views \
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

EXPOSE 9000

CMD ["php-fpm"] 