#!/bin/sh
set -e

# Create Laravel storage directories
mkdir -p /var/www/html/storage/framework/{sessions,views,cache,cache/data}
chmod -R 777 /var/www/html/storage

# Install Composer dependencies if they don't exist
if [ ! -f /var/www/html/vendor/autoload.php ]; then
    echo "Installing Composer dependencies..."
    cd /var/www/html
    composer install --no-dev --optimize-autoloader --no-interaction
    echo "Composer dependencies installed successfully"
fi

# First argument is the command to run
exec "$@"