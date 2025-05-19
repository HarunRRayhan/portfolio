#!/bin/bash

# Cloudflare 521 Error Fix Script
# This script specifically addresses the Cloudflare 521 "Web server is down" error

set -e

# Function to log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "========== CLOUDFLARE 521 ERROR FIX =========="
log "Running fixes for Cloudflare 521 'Web server is down' error..."

# Get absolute path to script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$DEPLOY_DIR")"

# Load environment variables if running locally
if [ -f "$DEPLOY_DIR/.env.deploy" ]; then
  set -a
  . "$DEPLOY_DIR/.env.deploy"
  set +a
fi

APP_DIR="${APP_DIR:-/opt/portfolio}"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
CONTAINER_NAME="portfolio-app-${TIMESTAMP}"

# 1. Check server's public IP
log "\n=== SERVER IP ADDRESS ==="
PUBLIC_IP=$(curl -s https://api.ipify.org)
log "Server public IP: $PUBLIC_IP"

# 2. Verify Cloudflare IP ranges
log "\n=== VERIFYING CLOUDFLARE IP RANGES ==="
log "Downloading current Cloudflare IP ranges..."
CF_IPV4=$(curl -s https://www.cloudflare.com/ips-v4)
CF_IPV6=$(curl -s https://www.cloudflare.com/ips-v6)

log "Ensuring firewall allows Cloudflare IPs..."
if command -v ufw &> /dev/null; then
  for ip in $CF_IPV4; do
    log "Allowing Cloudflare IP range: $ip"
    sudo ufw allow from $ip to any port 80 proto tcp comment 'Cloudflare IPv4' || log "Failed to add firewall rule for $ip"
    sudo ufw allow from $ip to any port 443 proto tcp comment 'Cloudflare IPv4' || log "Failed to add firewall rule for $ip"
  done
  
  log "Reloading firewall rules..."
  sudo ufw reload || log "Failed to reload firewall rules"
else
  log "UFW not installed, skipping firewall configuration"
fi

# 3. Check if Docker is running
log "\n=== DOCKER STATUS ==="
if command -v docker &> /dev/null; then
  log "Docker is installed"
  if systemctl is-active --quiet docker; then
    log "Docker service is running"
  else
    log "Starting Docker service..."
    sudo systemctl start docker
  fi
else
  log "Docker is not installed. Please install Docker first."
  exit 1
fi

# 4. Stop any existing containers
log "\n=== STOPPING EXISTING CONTAINERS ==="
RUNNING_CONTAINERS=$(docker ps -q --filter "name=portfolio-app-")
if [ ! -z "$RUNNING_CONTAINERS" ]; then
  log "Stopping existing portfolio containers..."
  docker stop $RUNNING_CONTAINERS || log "Failed to stop containers"
  docker rm $RUNNING_CONTAINERS || log "Failed to remove containers"
else
  log "No existing portfolio containers running"
fi

# 5. Ensure port 80 is free
log "\n=== FREEING PORT 80 ==="
PORT_80_PID=$(sudo lsof -t -i:80 || echo "")
if [ ! -z "$PORT_80_PID" ]; then
  log "Killing process using port 80 (PID: $PORT_80_PID)..."
  sudo kill -9 $PORT_80_PID || log "Failed to kill process"
else
  log "Port 80 is free"
fi

# 6. Create .env file with correct settings
log "\n=== CREATING LARAVEL .ENV FILE ==="
cat > ${APP_DIR}/.env << EOF
APP_NAME=Portfolio
APP_ENV=production
APP_KEY=${APP_KEY:-base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx}
APP_DEBUG=false
APP_URL=https://harun.dev

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=pgsql
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}
DB_DATABASE=${DB_DATABASE:-portfolio}
DB_USERNAME=${DB_USERNAME:-portfolio}
DB_PASSWORD=${DB_PASSWORD:-password}

SESSION_DRIVER=file
SESSION_LIFETIME=120

CACHE_DRIVER=file
EOF

log "Created .env file at ${APP_DIR}/.env"

# 7. Fix Laravel permissions
log "\n=== FIXING LARAVEL PERMISSIONS ==="
sudo mkdir -p ${APP_DIR}/storage/framework/{sessions,views,cache,cache/data} ${APP_DIR}/bootstrap/cache
sudo chown -R www-data:www-data ${APP_DIR}/storage ${APP_DIR}/bootstrap/cache
sudo chmod -R 775 ${APP_DIR}/storage ${APP_DIR}/bootstrap/cache

# 8. Start a new container with proper port mapping
log "\n=== STARTING NEW CONTAINER ==="
log "Starting container: ${CONTAINER_NAME}..."
docker run -d --name ${CONTAINER_NAME} \
  -p 80:80 \
  -p 443:443 \
  -v ${APP_DIR}:/var/www/html \
  -e WEB_DOCUMENT_ROOT=/var/www/html/public \
  -e PHP_MAX_EXECUTION_TIME=300 \
  -e PHP_POST_MAX_SIZE=50M \
  -e PHP_UPLOAD_MAX_FILESIZE=50M \
  --restart unless-stopped \
  webdevops/php-nginx:8.2-alpine

# 9. Wait for container to start
log "Waiting for container to start..."
sleep 5

# 10. Fix permissions inside the container
log "\n=== FIXING CONTAINER PERMISSIONS ==="
docker exec ${CONTAINER_NAME} sh -c 'mkdir -p /var/www/html/storage/framework/{sessions,views,cache,cache/data} /var/www/html/bootstrap/cache && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache'

# 11. Clear Laravel cache
log "\n=== CLEARING LARAVEL CACHE ==="
docker exec ${CONTAINER_NAME} sh -c 'cd /var/www/html && php artisan cache:clear && php artisan config:clear && php artisan view:clear && php artisan route:clear' || log "Failed to clear Laravel cache"

# 12. Test local connectivity
log "\n=== TESTING LOCAL CONNECTIVITY ==="
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 || echo "Connection failed")
log "HTTP status on localhost:80: $HTTP_STATUS"

if [[ "$HTTP_STATUS" == "Connection failed" || "$HTTP_STATUS" == "000" ]]; then
  log "⚠️ Cannot connect to localhost:80"
elif [[ "$HTTP_STATUS" == "200" ]]; then
  log "✅ Successfully connected to localhost:80"
else
  log "⚠️ Received HTTP status $HTTP_STATUS from localhost:80"
fi

# 13. Verify container is running
log "\n=== VERIFYING CONTAINER STATUS ==="
CONTAINER_STATUS=$(docker ps -f "name=${CONTAINER_NAME}" --format "{{.Status}}" || echo "Failed to get status")
log "Container status: $CONTAINER_STATUS"

# 14. Final instructions
log "\n=== NEXT STEPS ==="
log "1. Verify Cloudflare DNS settings:"
log "   - Ensure your A record points to: $PUBLIC_IP"
log "   - SSL/TLS encryption mode should be set to 'Full' or 'Full (Strict)'"
log "   - Disable any page rules that might interfere with the connection"

log "2. Test your site directly using the server IP (bypassing Cloudflare):"
log "   curl -v http://$PUBLIC_IP"

log "3. If the site works directly but not through Cloudflare, check Cloudflare settings:"
log "   - Development Mode: Try enabling it temporarily"
log "   - Always Online: Ensure it's enabled"
log "   - Cache Level: Set to 'Standard'"

log "4. If issues persist, contact Cloudflare support with the following information:"
log "   - Your domain: harun.dev"
log "   - Your server IP: $PUBLIC_IP"
log "   - The error: 521 Web server is down"
log "   - The steps you've taken to troubleshoot"

log "========== FIX COMPLETE =========="
