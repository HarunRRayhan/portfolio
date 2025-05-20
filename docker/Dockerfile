FROM webdevops/php-nginx:8.2-alpine

WORKDIR /var/www/html

# Copy application files (excluding storage)
COPY . /var/www/html/
RUN rm -rf /var/www/html/storage

# Create storage directory structure
RUN mkdir -p /var/www/html/storage/app/public     /var/www/html/storage/framework/cache/data     /var/www/html/storage/framework/sessions     /var/www/html/storage/framework/views     /var/www/html/storage/logs     /var/www/html/bootstrap/cache

# Set permissions
RUN chown -R application:application /var/www/html     && chmod -R 755 /var/www/html/storage     && chmod -R 755 /var/www/html/bootstrap/cache

# Create storage link
RUN php artisan storage:link

# Create Nginx configuration
COPY docker/nginx-blue-green.conf /opt/docker/etc/nginx/vhost.conf

EXPOSE 80

CMD ["supervisord"]
