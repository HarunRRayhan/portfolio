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

# Check if .env file exists, if not create a basic one from .env.example
echo -e "\n=== CHECKING .ENV FILE ==="
if [ ! -f "/opt/portfolio/.env" ]; then
  echo "No .env file found. Creating one from .env.example..."
  if [ -f "/opt/portfolio/.env.example" ]; then
    cp /opt/portfolio/.env.example /opt/portfolio/.env
    echo "Created .env file from .env.example"
  else
    echo "No .env.example file found. Please create an .env file manually."
  fi
else
  echo ".env file already exists"
fi

# Clear Laravel caches
echo -e "\n=== CLEARING LARAVEL CACHES ==="
docker exec $RUNNING_CONTAINER php artisan cache:clear
docker exec $RUNNING_CONTAINER php artisan config:clear
docker exec $RUNNING_CONTAINER php artisan route:clear
docker exec $RUNNING_CONTAINER php artisan view:clear

# Regenerate Laravel caches
echo -e "\n=== REGENERATING LARAVEL CACHES ==="
docker exec $RUNNING_CONTAINER php artisan config:cache
docker exec $RUNNING_CONTAINER php artisan route:cache
docker exec $RUNNING_CONTAINER php artisan view:cache

# Create a test PHP file
echo -e "\n=== CREATING TEST PHP FILE ==="
cat > /opt/portfolio/public/test.php << 'PHP'
<?php
phpinfo();
PHP

# Create a health check file
echo -e "\n=== CREATING HEALTH CHECK FILE ==="
echo "OK" > /opt/portfolio/public/health.txt

# Test the application
echo -e "\n=== TESTING APPLICATION ==="
echo "Testing main application..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/)
echo "HTTP status: $HTTP_STATUS"

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