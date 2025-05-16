#!/bin/bash

# Cloudflare Connection Check Script
# This script helps diagnose and fix Cloudflare 521 errors

set -e

# Get absolute path to script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
APP_DIR="${APP_DIR:-/opt/portfolio}"

# Function to execute commands via SSH if needed
execute_ssh() {
  local command="$1"
  if [ "$GITHUB_ACTIONS" == "true" ] || [ "$(hostname)" == "$REMOTE_HOST" ]; then
    eval "$command"
  else
    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "$command"
  fi
}

# Function to log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Check if the server is accessible on port 80
log "Checking if port 80 is open and accessible..."
PORT_CHECK=$(execute_ssh "sudo netstat -tuln | grep ':80 ' || echo 'Port 80 not in use'")
log "Port 80 status: $PORT_CHECK"

# Check if the application container is running
log "Checking if application container is running..."
CONTAINER_CHECK=$(execute_ssh "docker ps | grep portfolio-app || echo 'No portfolio container running'")
log "Container status: $CONTAINER_CHECK"

# Check if socat is forwarding traffic
log "Checking if socat is forwarding traffic from port 80 to 8080..."
SOCAT_CHECK=$(execute_ssh "ps aux | grep 'socat TCP-LISTEN:80' | grep -v grep || echo 'Socat not running'")
log "Socat status: $SOCAT_CHECK"

# Check if we can access the application locally
log "Checking if we can access the application locally..."
LOCAL_CHECK=$(execute_ssh "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080 || echo 'Failed to connect'")
log "Local access status: $LOCAL_CHECK"

# Check if we can access the application through port 80
log "Checking if we can access the application through port 80..."
PORT80_CHECK=$(execute_ssh "curl -s -o /dev/null -w '%{http_code}' http://localhost:80 || echo 'Failed to connect'")
log "Port 80 access status: $PORT80_CHECK"

# Check firewall status
log "Checking firewall status..."
FIREWALL_CHECK=$(execute_ssh "sudo ufw status || echo 'UFW not installed'")
log "Firewall status: $FIREWALL_CHECK"

# Check if ports 80 and 8080 are allowed in the firewall
log "Ensuring ports 80 and 8080 are allowed in the firewall..."
execute_ssh "sudo ufw allow 80/tcp || true"
execute_ssh "sudo ufw allow 8080/tcp || true"

# Restart socat to ensure it's running properly
log "Restarting socat to ensure proper port forwarding..."
execute_ssh "sudo pkill socat || true"
execute_ssh "sudo nohup socat TCP-LISTEN:80,fork TCP:localhost:8080 > /dev/null 2>&1 &"
sleep 2

# Verify socat is running
SOCAT_VERIFY=$(execute_ssh "ps aux | grep 'socat TCP-LISTEN:80' | grep -v grep || echo 'Socat still not running'")
log "Socat status after restart: $SOCAT_VERIFY"

# Create a simple health check file
log "Creating a simple health check file..."
execute_ssh "echo 'OK' > ${APP_DIR}/public/health.txt"
execute_ssh "chmod 644 ${APP_DIR}/public/health.txt"

# Check if we can access the health check file
log "Checking if we can access the health check file..."
HEALTH_CHECK=$(execute_ssh "curl -s http://localhost:80/health.txt || echo 'Failed to access health check'")
log "Health check result: $HEALTH_CHECK"

# Get server's public IP
log "Getting server's public IP..."
SERVER_IP=$(execute_ssh "curl -s https://api.ipify.org || echo 'Failed to get IP'")
log "Server public IP: $SERVER_IP"

log "✅ Cloudflare connection check completed."
log "If you're still seeing Cloudflare 521 errors, please verify that:"
log "1. The correct origin IP ($SERVER_IP) is configured in Cloudflare"
log "2. Cloudflare's proxy is enabled for your domain"
log "3. Your server's firewall allows connections from Cloudflare's IP ranges"
log "4. The application is properly serving content on port 80"

exit 0