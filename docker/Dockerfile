FROM php:8.2-fpm-alpine

# Install dependencies
RUN apk add --no-cache \
    curl \
    zip \
    unzip \
    libzip-dev \
    libpng-dev \
    libpq-dev \
    postgresql-dev \
    oniguruma-dev \
    supervisor

# Install PHP extensions
RUN docker-php-ext-install \
    pdo_pgsql \
    pgsql \
    bcmath \
    zip \
    gd \
    opcache \
    mbstring

# Set recommended PHP.ini settings
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

WORKDIR /var/www/html

# Create Laravel application structure
RUN mkdir -p /var/www/html

# Copy application files - this assumes files are copied during deployment
# The repository should be cloned on the host and mounted or copied to the container

# Create storage directory structure
RUN mkdir -p /var/www/html/storage/app/public \
    /var/www/html/storage/framework/cache/data \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/logs \
    /var/www/html/bootstrap/cache

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Verify application directory structure is correct
RUN ls -la /var/www/html && \
    test -f /var/www/html/artisan && \
    echo "Artisan exists" || echo "Warning: artisan not found"

# Add a simple health check file
RUN echo 'OK' > /var/www/html/public/health.txt

# Configure Supervisor
RUN mkdir -p /etc/supervisor.d
RUN echo '[supervisord] \
nodaemon=true \
user=root \
[program:php-fpm] \
command=php-fpm -F \
stdout_logfile=/dev/stdout \
stdout_logfile_maxbytes=0 \
stderr_logfile=/dev/stderr \
stderr_logfile_maxbytes=0' > /etc/supervisor.d/supervisord.conf

EXPOSE 80

CMD ["supervisord", "-c", "/etc/supervisor.d/supervisord.conf"]