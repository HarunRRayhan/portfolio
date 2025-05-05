FROM composer:latest AS composer
WORKDIR /app
COPY . .
RUN composer install --no-dev --optimize-autoloader

FROM php:8.2-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    linux-headers \
    $PHPIZE_DEPS \
    postgresql-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    nginx \
    supervisor \
    openssl

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy built assets and source code (assume built locally)
COPY public/build ./public/build
COPY public ./public
COPY bootstrap ./bootstrap
COPY config ./config
COPY database ./database
COPY resources ./resources
COPY routes ./routes
COPY storage ./storage
COPY app ./app
COPY vendor ./vendor
COPY composer.json ./
COPY composer.lock ./
COPY package.json ./
COPY package-lock.json ./
COPY artisan ./
COPY .env ./

# Copy Nginx configuration
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache \
    && chmod -R 755 /var/www/html/public/build \
    && chmod -R 755 /etc/nginx/ssl

# Generate application key if not set
RUN php artisan key:generate --force

# Create storage link
RUN php artisan storage:link

# Clear and cache configuration
RUN php artisan config:clear \
    && php artisan config:cache \
    && php artisan route:clear \
    && php artisan route:cache \
    && php artisan view:clear \
    && php artisan view:cache \
    && php artisan optimize

# Create supervisor configuration
RUN echo "[supervisord]" > /etc/supervisord.conf \
    && echo "nodaemon=true" >> /etc/supervisord.conf \
    && echo "user=root" >> /etc/supervisord.conf \
    && echo "logfile=/var/log/supervisord.log" >> /etc/supervisord.conf \
    && echo "pidfile=/var/run/supervisord.pid" >> /etc/supervisord.conf \
    && echo "" >> /etc/supervisord.conf \
    && echo "[program:php-fpm]" >> /etc/supervisord.conf \
    && echo "command=php-fpm" >> /etc/supervisord.conf \
    && echo "" >> /etc/supervisord.conf \
    && echo "[program:nginx]" >> /etc/supervisord.conf \
    && echo "command=nginx -g 'daemon off;'" >> /etc/supervisord.conf

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Expose the ports
EXPOSE 80 443

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"] 