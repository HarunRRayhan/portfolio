#!/bin/bash

# Script to fix database connection issues in the Laravel application

set -e

# Function to log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "========== DATABASE CONNECTION FIX =========="

# Get the latest container ID
CONTAINER_ID=$(docker ps -q --filter "name=portfolio-app" | head -n 1)

if [ -z "$CONTAINER_ID" ]; then
  log "No running portfolio container found!"
  exit 1
fi

log "Working with container: $CONTAINER_ID"

# Update the .env file with correct database settings
log "Updating .env file with correct database settings..."
cat > /opt/portfolio/.env << EOF
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
EOF

log "Updated .env file"

# Check if PostgreSQL is installed and running
log "Checking PostgreSQL status..."
if ! command -v psql &> /dev/null; then
  log "PostgreSQL client not installed. Installing..."
  apt-get update && apt-get install -y postgresql-client
fi

# Check if PostgreSQL server is running
if systemctl is-active --quiet postgresql; then
  log "PostgreSQL server is running"
else
  log "PostgreSQL server is not running. Starting..."
  systemctl start postgresql
fi

# Create database and user if they don't exist
log "Setting up PostgreSQL database and user..."
sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname = 'portfolio'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE portfolio;"
sudo -u postgres psql -c "SELECT 1 FROM pg_roles WHERE rolname = 'portfolio'" | grep -q 1 || sudo -u postgres psql -c "CREATE USER portfolio WITH ENCRYPTED PASSWORD 'CO601jkELC5h0pDlqVNbSQ==';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE portfolio TO portfolio;"

log "Database and user setup complete"

# Restart the container
log "Restarting container..."
docker restart $CONTAINER_ID

# Wait for container to restart
log "Waiting for container to restart..."
sleep 5

# Fix permissions inside the container
log "Fixing permissions inside the container..."
docker exec $CONTAINER_ID sh -c 'mkdir -p /var/www/html/storage/framework/{sessions,views,cache,cache/data} /var/www/html/bootstrap/cache && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache'

# Clear Laravel cache
log "Clearing Laravel cache..."
docker exec $CONTAINER_ID sh -c 'cd /var/www/html && php artisan cache:clear && php artisan config:clear && php artisan view:clear && php artisan route:clear' || log "Failed to clear Laravel cache"

# Run Laravel migrations
log "Running Laravel migrations..."
docker exec $CONTAINER_ID sh -c 'cd /var/www/html && php artisan migrate --force' || log "Failed to run migrations"

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

log "========== FIX COMPLETE =========="
