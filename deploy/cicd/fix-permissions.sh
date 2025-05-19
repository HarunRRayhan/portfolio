#!/bin/bash

# Script to fix Laravel storage permissions

set -e

# Function to log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "========== FIXING LARAVEL PERMISSIONS =========="

# Get the latest container ID
CONTAINER_ID=$(docker ps -q --filter "name=portfolio-app" | head -n 1)

if [ -z "$CONTAINER_ID" ]; then
  log "No running portfolio container found!"
  exit 1
fi

log "Working with container: $CONTAINER_ID"

# Fix permissions on the host
log "Fixing permissions on the host..."
chown -R 1000:1000 /opt/portfolio
chmod -R 775 /opt/portfolio

# Ensure storage directories exist with proper permissions
log "Creating storage directories..."
mkdir -p /opt/portfolio/storage/logs
mkdir -p /opt/portfolio/storage/framework/sessions
mkdir -p /opt/portfolio/storage/framework/views
mkdir -p /opt/portfolio/storage/framework/cache
mkdir -p /opt/portfolio/storage/framework/cache/data
mkdir -p /opt/portfolio/bootstrap/cache

# Set proper permissions
log "Setting proper permissions..."
chmod -R 777 /opt/portfolio/storage
chmod -R 777 /opt/portfolio/bootstrap/cache

# Fix permissions inside the container
log "Fixing permissions inside the container..."
docker exec $CONTAINER_ID sh -c 'chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache'

# Create an empty log file with proper permissions
log "Creating empty log file..."
touch /opt/portfolio/storage/logs/laravel.log
chmod 666 /opt/portfolio/storage/logs/laravel.log
chown 1000:1000 /opt/portfolio/storage/logs/laravel.log

# Create an empty log file inside the container
log "Creating empty log file inside container..."
docker exec $CONTAINER_ID sh -c 'touch /var/www/html/storage/logs/laravel.log && chmod 666 /var/www/html/storage/logs/laravel.log && chown www-data:www-data /var/www/html/storage/logs/laravel.log'

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

log "========== LARAVEL PERMISSIONS FIX COMPLETE =========="
