#!/bin/bash

# Script to fix missing build assets for Laravel application

set -e

# Function to log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "========== FIXING MISSING BUILD ASSETS =========="

# Get the latest container ID
CONTAINER_ID=$(docker ps -q --filter "name=portfolio-app" | head -n 1)

if [ -z "$CONTAINER_ID" ]; then
  log "No running portfolio container found!"
  exit 1
fi

log "Working with container: $CONTAINER_ID"

# Install Node.js and npm in the container if needed
log "Installing Node.js and npm if needed..."
docker exec $CONTAINER_ID sh -c 'if ! command -v npm &> /dev/null; then apk add --no-cache nodejs npm; fi'

# Install dependencies
log "Installing npm dependencies..."
docker exec $CONTAINER_ID sh -c 'cd /var/www/html && npm install'

# Build assets
log "Building assets..."
docker exec $CONTAINER_ID sh -c 'cd /var/www/html && npm run build'

# Fix permissions on the built assets
log "Fixing permissions on built assets..."
docker exec $CONTAINER_ID sh -c 'chown -R www-data:www-data /var/www/html/public'

# Clear Laravel cache
log "Clearing Laravel cache..."
docker exec $CONTAINER_ID sh -c 'cd /var/www/html && php artisan view:clear && php artisan route:clear && php artisan config:clear'

# Restart the container
log "Restarting container..."
docker restart $CONTAINER_ID

# Wait for container to restart
log "Waiting for container to restart..."
sleep 5

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

log "========== BUILD ASSETS FIX COMPLETE =========="
