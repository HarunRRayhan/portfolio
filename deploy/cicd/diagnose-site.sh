#!/bin/bash

# Site Diagnostic Script
# Run this script when Cloudflare shows a 521 error to diagnose connectivity issues

set -e

# Function to log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "========== SITE DIAGNOSTIC REPORT =========="
log "Running comprehensive diagnostics to identify why Cloudflare can't connect..."

# 1. Check server's public IP
log "\n=== SERVER IP ADDRESS ==="
PUBLIC_IP=$(curl -s https://api.ipify.org)
log "Server public IP: $PUBLIC_IP"
log "Verify this matches the A record in Cloudflare DNS settings"

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
fi

# 8. Provide quick fixes
log "\n=== RECOMMENDED ACTIONS ==="
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

log "2. If firewall is blocking, allow port 80:"
log "   sudo ufw allow 80/tcp"

log "3. Verify Cloudflare DNS settings point to: $PUBLIC_IP"

log "4. Run the deployment script again:"
log "   cd /opt/portfolio && ./deploy/cicd/ultra-simple-deploy.sh"

log "========== END OF DIAGNOSTIC REPORT =========="