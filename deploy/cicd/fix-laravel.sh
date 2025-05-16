#!/bin/bash

# Laravel Application Fix Script
# This script fixes common Laravel application issues that cause 500 errors

set -e

# Load environment variables
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$DEPLOY_DIR/.env.deploy" ]; then
  set -a
  . "$DEPLOY_DIR/.env.deploy"
  set +a
fi

# Check if required variables are set
if [ -z "$REMOTE_USER" ] || [ -z "$REMOTE_HOST" ] || [ -z "$SSH_KEY" ]; then
  echo "Error: Missing required variables in .env.deploy"
  echo "Required: REMOTE_USER, REMOTE_HOST, SSH_KEY"
  exit 1
fi

# Ensure SSH_KEY is relative to the deploy directory
if [ -n "$SSH_KEY" ] && [[ "$SSH_KEY" != /* ]]; then
  SSH_KEY="$DEPLOY_DIR/$SSH_KEY"
fi

echo "Using SSH key: $SSH_KEY"
echo "Connecting to: $REMOTE_USER@$REMOTE_HOST"

# Create remote fix commands
REMOTE_COMMANDS=$(cat << 'EOF'
echo "========== LARAVEL APPLICATION FIX =========="

# Get the running container
RUNNING_CONTAINER=$(docker ps --format "{{.Names}}" | grep portfolio-app | head -n 1)
if [[ -z "$RUNNING_CONTAINER" ]]; then
  echo "No running container found. Exiting."
  exit 1
fi

echo "Working with container: $RUNNING_CONTAINER"

# Fix file permissions
echo -e "\n=== FIXING FILE PERMISSIONS ==="
sudo chown -R ubuntu:ubuntu /opt/portfolio
sudo find /opt/portfolio -type d -exec chmod 755 {} \;
sudo find /opt/portfolio -type f -exec chmod 644 {} \;
sudo chmod -R 777 /opt/portfolio/storage
sudo chmod -R 777 /opt/portfolio/bootstrap/cache

# Create a proper .env file
echo -e "\n=== CREATING PROPER .ENV FILE ==="
cat > /opt/portfolio/.env << 'ENVFILE'
APP_NAME="Harun R Rayhan"
APP_ENV=production
APP_KEY=base64:yUwtWgRbG5jszbGwJhcERDfBkDPpECD+IURBjl8uAW0=
APP_DEBUG=true
APP_URL=https://harun.dev

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=portfolio
DB_USERNAME=portfolio
DB_PASSWORD=CO601jkELC5h0pDlqVNbSQ==

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=mt1

VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="${PUSHER_HOST}"
VITE_PUSHER_PORT="${PUSHER_PORT}"
VITE_PUSHER_SCHEME="${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"

ASSET_URL=https://cdn.harun.dev
VITE_ASSET_BASE_URL=https://cdn.harun.dev
ENVFILE

# Fix storage directory structure
echo -e "\n=== FIXING STORAGE DIRECTORY STRUCTURE ==="
mkdir -p /opt/portfolio/storage/framework/{sessions,views,cache,cache/data}
mkdir -p /opt/portfolio/storage/logs
touch /opt/portfolio/storage/logs/laravel.log
chmod -R 777 /opt/portfolio/storage

# Run Laravel artisan commands inside the container
echo -e "\n=== RUNNING LARAVEL ARTISAN COMMANDS ==="
echo "Clearing cache..."
docker exec $RUNNING_CONTAINER php /var/www/html/artisan cache:clear
docker exec $RUNNING_CONTAINER php /var/www/html/artisan config:clear
docker exec $RUNNING_CONTAINER php /var/www/html/artisan view:clear
docker exec $RUNNING_CONTAINER php /var/www/html/artisan route:clear

echo "Optimizing application..."
docker exec $RUNNING_CONTAINER php /var/www/html/artisan optimize:clear
docker exec $RUNNING_CONTAINER php /var/www/html/artisan optimize

# Check Laravel logs for errors
echo -e "\n=== CHECKING LARAVEL LOGS ==="
if [ -f /opt/portfolio/storage/logs/laravel.log ]; then
  echo "Last 20 lines of Laravel log:"
  tail -n 20 /opt/portfolio/storage/logs/laravel.log
else
  echo "Laravel log file not found."
fi

# Create a simple test PHP file to verify PHP is working
echo -e "\n=== CREATING TEST PHP FILE ==="
cat > /opt/portfolio/public/test.php << 'PHPFILE'
<?php
phpinfo();
PHPFILE
chmod 644 /opt/portfolio/public/test.php

# Create a simple index.php file as a fallback
echo -e "\n=== CREATING FALLBACK INDEX.PHP ==="
cat > /opt/portfolio/public/index-fallback.php << 'INDEXFILE'
<?php
echo "Harun R Rayhan's Portfolio - Fallback Page";
echo "<br><br>";
echo "If you're seeing this page, the main Laravel application is experiencing issues.";
echo "<br>";
echo "Please check the server logs for more information.";
INDEXFILE
chmod 644 /opt/portfolio/public/index-fallback.php

# Restart the container
echo -e "\n=== RESTARTING CONTAINER ==="
docker restart $RUNNING_CONTAINER
echo "Container restarted."

# Wait for container to initialize
echo "Waiting for container to initialize..."
sleep 10

# Test the application
echo -e "\n=== TESTING APPLICATION ==="
echo "Testing main application..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/)
echo "HTTP status for main application: $HTTP_STATUS"

echo "Testing PHP test file..."
PHP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/test.php)
echo "HTTP status for PHP test file: $PHP_STATUS"

echo "Testing health check..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/health.txt)
echo "HTTP status for health check: $HEALTH_STATUS"

# If main application still returns 500, use the fallback
if [ "$HTTP_STATUS" == "500" ]; then
  echo -e "\n=== APPLYING FALLBACK SOLUTION ==="
  echo "Main application still returning 500, applying fallback solution..."
  
  # Create a custom Nginx configuration that serves the fallback page
  docker exec $RUNNING_CONTAINER bash -c 'cat > /opt/docker/etc/nginx/vhost.conf << "EOF"
server {
    listen 80;
    server_name localhost;
    root /var/www/html/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    index index-fallback.php index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index-fallback.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index-fallback.php;

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
EOF'

  # Reload Nginx configuration
  docker exec $RUNNING_CONTAINER nginx -s reload
  
  echo "Fallback solution applied. Testing again..."
  sleep 5
  
  FALLBACK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/)
  echo "HTTP status after fallback solution: $FALLBACK_STATUS"
fi

echo -e "\n========== LARAVEL APPLICATION FIX COMPLETED =========="
EOF
)

# Run the remote commands
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "$REMOTE_COMMANDS"

echo "Laravel application fix completed."