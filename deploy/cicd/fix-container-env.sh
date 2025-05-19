#!/bin/bash

# Script to fix container environment variables and database connection

set -e

# Function to log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "========== FIXING CONTAINER ENVIRONMENT =========="

# Get the latest container ID
CONTAINER_ID=$(docker ps -q --filter "name=portfolio-app" | head -n 1)

if [ -z "$CONTAINER_ID" ]; then
  log "No running portfolio container found!"
  exit 1
fi

log "Working with container: $CONTAINER_ID"

# Stop the current container
log "Stopping current container..."
docker stop $CONTAINER_ID
docker rm $CONTAINER_ID

# Create a new container with the correct environment variables
log "Creating new container with correct environment variables..."
TIMESTAMP=$(date +%Y%m%d%H%M%S)
CONTAINER_NAME="portfolio-app-${TIMESTAMP}"

log "Starting container: ${CONTAINER_NAME}..."
docker run -d --name ${CONTAINER_NAME} \
  -p 80:80 \
  -p 443:443 \
  -v /opt/portfolio:/var/www/html \
  -e WEB_DOCUMENT_ROOT=/var/www/html/public \
  -e PHP_MAX_EXECUTION_TIME=300 \
  -e PHP_POST_MAX_SIZE=50M \
  -e PHP_UPLOAD_MAX_FILESIZE=50M \
  -e DB_CONNECTION=pgsql \
  -e DB_HOST=localhost \
  -e DB_PORT=5432 \
  -e DB_DATABASE=portfolio \
  -e DB_USERNAME=portfolio \
  -e DB_PASSWORD=CO601jkELC5h0pDlqVNbSQ== \
  --restart unless-stopped \
  --network=host \
  webdevops/php-nginx:8.2-alpine

# Wait for container to start
log "Waiting for container to start..."
sleep 5

# Fix permissions inside the container
log "Fixing permissions inside the container..."
docker exec ${CONTAINER_NAME} sh -c 'mkdir -p /var/www/html/storage/framework/{sessions,views,cache,cache/data} /var/www/html/bootstrap/cache && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache'

# Create .env file inside the container
log "Creating .env file inside the container..."
docker exec ${CONTAINER_NAME} sh -c 'cat > /var/www/html/.env << EOF
APP_NAME=Portfolio
APP_ENV=production
APP_KEY=base64:yUwtWgRbG5jszbGwJhcERDfBkDPpECD+IURBjl8uAW0=
APP_DEBUG=false
APP_URL=https://harun.dev

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=portfolio
DB_USERNAME=portfolio
DB_PASSWORD=CO601jkELC5h0pDlqVNbSQ==

SESSION_DRIVER=file
SESSION_LIFETIME=120

CACHE_DRIVER=file
QUEUE_CONNECTION=sync

ASSET_URL=https://cdn.harun.dev
EOF'

# Clear Laravel cache
log "Clearing Laravel cache..."
docker exec ${CONTAINER_NAME} sh -c 'cd /var/www/html && php artisan cache:clear && php artisan config:clear && php artisan view:clear && php artisan route:clear' || log "Failed to clear Laravel cache"

# Run Laravel migrations
log "Running Laravel migrations..."
docker exec ${CONTAINER_NAME} sh -c 'cd /var/www/html && php artisan migrate --force' || log "Failed to run migrations"

# Test local connectivity
log "Testing local connectivity..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 || echo "Connection failed")
log "HTTP status on localhost:80: $HTTP_STATUS"

if [[ "$HTTP_STATUS" == "Connection failed" || "$HTTP_STATUS" == "000" ]]; then
  log "⚠️ Cannot connect to localhost:80"
elif [[ "$HTTP_STATUS" == "200" ]]; then
  log "✅ Successfully connected to localhost:80"
else
  log "⚠️ Received HTTP status $HTTP_STATUS from localhost:80"
fi

log "========== CONTAINER ENVIRONMENT FIX COMPLETE =========="
