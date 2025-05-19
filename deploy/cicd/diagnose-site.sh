#!/bin/bash

# Enhanced Site Diagnostic Script
# Run this script when the site isn't loading or Cloudflare shows a 521 error

set -e

# Function to log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if a command exists
command_exists() {
  command -v "$1" &> /dev/null
}

# Function to run a command on the Docker container if it's running
run_in_container() {
  local container="$1"
  local cmd="$2"
  
  if [[ -n "$container" && "$container" != "No running portfolio container" ]]; then
    docker exec "$container" sh -c "$cmd" 2>&1 || echo "Failed to execute command in container"
  else
    echo "No running container to execute command in"
  fi
}

log "========== ENHANCED SITE DIAGNOSTIC REPORT =========="
log "Running comprehensive diagnostics to identify why the site isn't loading..."

# 1. Check server's public IP and Cloudflare connectivity
log "\n=== SERVER IP AND CLOUDFLARE CONNECTIVITY ==="
PUBLIC_IP=$(curl -s https://api.ipify.org)
log "Server public IP: $PUBLIC_IP"
log "Verify this matches the A record in Cloudflare DNS settings"

# Check if we can connect to Cloudflare
if command_exists curl; then
  log "Testing connection to Cloudflare API..."
  CF_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://api.cloudflare.com/client/v4/user/tokens/verify || echo "Connection failed")
  if [[ "$CF_TEST" == "200" ]]; then
    log "✅ Successfully connected to Cloudflare API"
  else
    log "⚠️ Could not connect to Cloudflare API: $CF_TEST"
  fi
fi

# 2. Check if Docker is running
log "\n=== DOCKER STATUS ==="
if command -v docker &> /dev/null; then
  log "Docker is installed"
  if systemctl is-active --quiet docker; then
    log "Docker service is running"
  else
    log "⚠️ Docker service is NOT running"
    log "Run: sudo systemctl start docker"
  fi
else
  log "⚠️ Docker is NOT installed"
fi

# 3. Check Docker containers
log "\n=== DOCKER CONTAINERS ==="
CONTAINERS=$(docker ps -a --format "{{.Names}}: {{.Status}}" | grep portfolio-app || echo "No portfolio containers found")
log "$CONTAINERS"

RUNNING_CONTAINER=$(docker ps --format "{{.Names}}" | grep portfolio-app || echo "No running portfolio container")
if [[ "$RUNNING_CONTAINER" == "No running portfolio container" ]]; then
  log "⚠️ No running portfolio container found"
  LATEST_CONTAINER=$(docker ps -a --format "{{.Names}}" | grep portfolio-app | head -n 1)
  if [[ -n "$LATEST_CONTAINER" ]]; then
    log "Latest container: $LATEST_CONTAINER (not running)"
    log "To start it: docker start $LATEST_CONTAINER"
  fi
else
  log "Running container: $RUNNING_CONTAINER"
fi

# 4. Check port bindings
log "\n=== PORT BINDINGS ==="
PORT_80=$(netstat -tuln | grep ":80 " || echo "Port 80 not in use")
log "Port 80 status: $PORT_80"

if [[ "$PORT_80" == "Port 80 not in use" ]]; then
  log "⚠️ Port 80 is not in use - this is why Cloudflare can't connect"
  log "Check if the container is configured to use port 80"
fi

# 5. Check firewall status
log "\n=== FIREWALL STATUS ==="
if command -v ufw &> /dev/null; then
  UFW_STATUS=$(ufw status | grep "Status: " || echo "UFW not configured")
  log "UFW status: $UFW_STATUS"
  
  PORT_80_ALLOWED=$(ufw status | grep "80/tcp" || echo "Port 80 not explicitly allowed")
  log "Port 80 firewall rule: $PORT_80_ALLOWED"
else
  log "UFW not installed"
fi

# 6. Test local connectivity
log "\n=== LOCAL CONNECTIVITY TESTS ==="
if command -v curl &> /dev/null; then
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 || echo "Connection failed")
  log "HTTP status on localhost:80: $HTTP_STATUS"
  
  if [[ "$HTTP_STATUS" == "Connection failed" || "$HTTP_STATUS" == "000" ]]; then
    log "⚠️ Cannot connect to localhost:80"
  elif [[ "$HTTP_STATUS" == "200" ]]; then
    log "✅ Successfully connected to localhost:80"
  else
    log "⚠️ Received HTTP status $HTTP_STATUS from localhost:80"
  fi
else
  log "Curl not installed, skipping connectivity test"
fi

# 7. Check logs
log "\n=== RECENT LOGS ==="
if [[ -n "$RUNNING_CONTAINER" && "$RUNNING_CONTAINER" != "No running portfolio container" ]]; then
  log "Last 10 log lines from container:"
  docker logs --tail 10 $RUNNING_CONTAINER 2>&1 || log "Failed to get container logs"
  
  # Check Nginx logs
  log "\n=== NGINX LOGS ==="
  log "Last 10 lines of Nginx error log:"
  run_in_container "$RUNNING_CONTAINER" "tail -n 10 /var/log/nginx/error.log 2>/dev/null || echo 'No Nginx error logs found'"
  
  # Check Laravel logs
  log "\n=== LARAVEL LOGS ==="
  log "Last 10 lines of Laravel log:"
  run_in_container "$RUNNING_CONTAINER" "tail -n 10 /var/www/html/storage/logs/laravel.log 2>/dev/null || echo 'No Laravel logs found'"
fi

# 8. Check Laravel environment and configuration
log "\n=== LARAVEL ENVIRONMENT ==="
if [[ -n "$RUNNING_CONTAINER" && "$RUNNING_CONTAINER" != "No running portfolio container" ]]; then
  # Check .env file
  log "Checking Laravel .env file:"
  ENV_FILE=$(run_in_container "$RUNNING_CONTAINER" "cat /var/www/html/.env 2>/dev/null | grep -v 'PASSWORD\|SECRET\|KEY' || echo '.env file not found'")
  if [[ "$ENV_FILE" == ".env file not found" ]]; then
    log "⚠️ Laravel .env file is missing"
  else
    log "✅ Laravel .env file exists"
    APP_URL=$(run_in_container "$RUNNING_CONTAINER" "grep APP_URL /var/www/html/.env | cut -d '=' -f2" | tr -d '\r')
    log "APP_URL setting: $APP_URL"
    APP_ENV=$(run_in_container "$RUNNING_CONTAINER" "grep APP_ENV /var/www/html/.env | cut -d '=' -f2" | tr -d '\r')
    log "APP_ENV setting: $APP_ENV"
  fi
  
  # Check storage directory permissions
  log "\nChecking Laravel storage directory permissions:"
  STORAGE_PERMS=$(run_in_container "$RUNNING_CONTAINER" "ls -la /var/www/html/storage | head -n 2")
  log "$STORAGE_PERMS"
  
  # Check if storage is writable
  STORAGE_WRITABLE=$(run_in_container "$RUNNING_CONTAINER" "touch /var/www/html/storage/test_file 2>&1 && echo 'Storage is writable' || echo 'Storage is not writable'")
  log "$STORAGE_WRITABLE"
  run_in_container "$RUNNING_CONTAINER" "rm -f /var/www/html/storage/test_file 2>/dev/null"
  
  # Check Laravel cache
  log "\nChecking Laravel cache status:"
  CACHE_STATUS=$(run_in_container "$RUNNING_CONTAINER" "cd /var/www/html && php artisan config:cache 2>&1 || echo 'Failed to run Artisan command'")
  log "$CACHE_STATUS"
fi

# 9. Provide comprehensive fixes
log "\n=== RECOMMENDED ACTIONS ==="

# Docker container issues
if [[ "$PORT_80" == "Port 80 not in use" ]]; then
  log "1. Start the container with port 80 mapping:"
  log "   docker run -d -p 80:80 -v /opt/portfolio:/var/www/html --name portfolio-app-$(date +%Y%m%d%H%M%S) webdevops/php-nginx:8.2-alpine"
elif [[ "$RUNNING_CONTAINER" == "No running portfolio container" ]]; then
  log "1. Start the most recent container:"
  log "   docker start $LATEST_CONTAINER"
else
  log "1. Restart the current container:"
  log "   docker restart $RUNNING_CONTAINER"
fi

# Network issues
log "\n2. If firewall is blocking, allow port 80:"
log "   sudo ufw allow 80/tcp"

log "3. Verify Cloudflare DNS settings point to: $PUBLIC_IP"

# Laravel-specific fixes
log "\n4. Fix Laravel permissions:"
log "   docker exec $RUNNING_CONTAINER sh -c 'chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache'"

log "5. Clear Laravel cache:"
log "   docker exec $RUNNING_CONTAINER sh -c 'cd /var/www/html && php artisan cache:clear && php artisan config:clear && php artisan view:clear && php artisan route:clear'"

log "6. Check Laravel logs for specific errors:"
log "   docker exec $RUNNING_CONTAINER sh -c 'cat /var/www/html/storage/logs/laravel.log | tail -n 50'"

log "7. Verify .env file exists and has correct settings:"
log "   docker exec $RUNNING_CONTAINER sh -c 'cat /var/www/html/.env | grep -v PASSWORD | grep -v SECRET | grep -v KEY'"

log "8. Run the deployment script again if needed:"
log "   cd /opt/portfolio && ./deploy/cicd/ultra-simple-deploy.sh"

log "9. Test the site directly on the server (bypassing Cloudflare):"
log "   curl -v http://localhost:80"

log "========== END OF ENHANCED DIAGNOSTIC REPORT =========="