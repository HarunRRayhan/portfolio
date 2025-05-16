#!/bin/bash

# Setup Nginx as a reverse proxy for our Laravel application
# This script installs and configures Nginx to forward traffic from port 80 to our application on port 8080

set -e

APP_DIR="${APP_DIR:-/opt/portfolio}"
APP_PORT=8080

# Function to log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Check if running as root
if [ "$(id -u)" != "0" ]; then
  log "This script must be run as root. Please use sudo."
  exit 1
fi

# Install Nginx if not already installed
if ! command -v nginx &> /dev/null; then
  log "Installing Nginx..."
  apt-get update
  apt-get install -y nginx
fi

# Create Nginx configuration
log "Creating Nginx configuration..."
cat > /etc/nginx/sites-available/laravel-proxy << 'EOL'
server {
    listen 80;
    server_name harun.dev www.harun.dev;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOL

# Enable the site
log "Enabling site configuration..."
ln -sf /etc/nginx/sites-available/laravel-proxy /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
log "Testing Nginx configuration..."
nginx -t

# Restart Nginx
log "Restarting Nginx..."
systemctl restart nginx

log "✅ Nginx proxy setup completed successfully!"
log "Traffic from port 80 will now be forwarded to your application on port 8080"