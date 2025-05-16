#!/bin/bash

# Cloudflare Connection Fix Script
# This script helps diagnose and fix Cloudflare 521 errors by ensuring proper connectivity

set -e

# Function to log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Check if running as root
if [ "$(id -u)" != "0" ]; then
  log "This script must be run as root. Please use sudo."
  exit 1
fi

# Get server's public IP
log "Getting server's public IP..."
SERVER_IP=$(curl -s https://api.ipify.org)
log "Server public IP: $SERVER_IP"

# Create a simple health check file
log "Creating a simple health check file..."
echo "OK" > /opt/portfolio/public/health.txt
chmod 644 /opt/portfolio/public/health.txt

# Check if the health check file is accessible
log "Checking if health check file is accessible..."
HEALTH_CHECK=$(curl -s http://localhost/health.txt || echo "Failed to access health check")
log "Health check result: $HEALTH_CHECK"

# Check if port 80 is open
log "Checking if port 80 is open..."
PORT_CHECK=$(netstat -tuln | grep ':80 ' || echo "Port 80 not in use")
log "Port 80 status: $PORT_CHECK"

# Ensure firewall allows Cloudflare IPs
log "Ensuring firewall allows Cloudflare IPs..."
ufw allow 80/tcp
ufw allow 443/tcp

# Check if Docker container is running
log "Checking if Docker container is running..."
CONTAINER_CHECK=$(docker ps | grep portfolio-app || echo "No portfolio container running")
log "Container status: $CONTAINER_CHECK"

# Restart the container if needed
if [[ "$CONTAINER_CHECK" == *"No portfolio container running"* ]]; then
  log "Container not running. Attempting to restart the latest container..."
  LATEST_CONTAINER=$(docker ps -a --format '{{.Names}}' | grep 'portfolio-app-' | sort -r | head -n 1)
  if [ -n "$LATEST_CONTAINER" ]; then
    log "Restarting container: $LATEST_CONTAINER"
    docker start $LATEST_CONTAINER
  else
    log "No portfolio containers found."
  fi
fi

# Create a simple Nginx configuration to test direct connectivity
log "Creating a simple Nginx configuration for testing..."
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

cat > /etc/nginx/sites-available/cloudflare-test << 'EOL'
server {
    listen 80;
    server_name localhost;
    
    location / {
        return 200 "Cloudflare Test: Server is accessible";
    }
    
    location /health.txt {
        alias /opt/portfolio/public/health.txt;
    }
}
EOL

ln -sf /etc/nginx/sites-available/cloudflare-test /etc/nginx/sites-enabled/

# Check if Nginx is installed
if command -v nginx &> /dev/null; then
  log "Testing Nginx configuration..."
  nginx -t
  
  log "Restarting Nginx..."
  systemctl restart nginx
else
  log "Nginx not installed. Installing..."
  apt-get update
  apt-get install -y nginx
  
  log "Starting Nginx..."
  systemctl start nginx
fi

log "✅ Cloudflare connection fix completed."
log "Important information for Cloudflare configuration:"
log "1. Your server's public IP is: $SERVER_IP"
log "2. Make sure this IP is configured as the origin server in Cloudflare"
log "3. Ensure Cloudflare proxy is enabled (orange cloud) for your domain"
log "4. Try accessing your server directly using the IP to verify it's working"
log "5. You can test the health check at: http://$SERVER_IP/health.txt"

exit 0