#!/bin/bash

# Script to fix Nginx port conflict and ensure proper Cloudflare connectivity
# This script identifies what's using port 80 and reconfigures services appropriately

set -e

# Load environment variables
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$DEPLOY_DIR/.env.deploy" ]; then
  set -a
  . "$DEPLOY_DIR/.env.deploy"
  set +a
fi

# Check if required variables are set
if [ -z "$REMOTE_USER" ] || [ -z "$REMOTE_HOST" ] || [ -z "$SSH_KEY" ]; then
  echo "Error: Missing required variables in .env.deploy"
  echo "Required: REMOTE_USER, REMOTE_HOST, SSH_KEY"
  exit 1
fi

# Ensure SSH_KEY is relative to the deploy directory
if [ -n "$SSH_KEY" ] && [[ "$SSH_KEY" != /* ]]; then
  SSH_KEY="$DEPLOY_DIR/$SSH_KEY"
fi

echo "Using SSH key: $SSH_KEY"
echo "Connecting to: $REMOTE_USER@$REMOTE_HOST"

# Create remote commands
REMOTE_COMMANDS=$(cat << 'EOF'
echo "========== FIXING NGINX PORT CONFLICT =========="

# Get server's public IP
PUBLIC_IP=$(curl -s https://api.ipify.org)
echo "Server public IP: $PUBLIC_IP"

# Identify what's using port 80
echo "Identifying what's using port 80..."
sudo lsof -i :80

# Stop all services using port 80
echo "Stopping all services using port 80..."
sudo systemctl stop nginx || true
sudo pkill -f "nginx" || true

# Find and stop any Docker containers using port 80
echo "Stopping any Docker containers using port 80..."
for container in $(docker ps -q); do
  if docker port $container | grep -q "80/tcp"; then
    echo "Stopping container $container that's using port 80..."
    docker stop $container
  fi
done

# Create a simple Nginx configuration for Cloudflare
echo "Creating simple Nginx configuration for Cloudflare..."
cat > /tmp/cloudflare-nginx.conf << 'NGINX'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 768;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    gzip on;

    server {
        listen 80 default_server;
        server_name _;
        
        root /var/www/html;
        index index.html;

        # Cloudflare IPs
        set_real_ip_from 103.21.244.0/22;
        set_real_ip_from 103.22.200.0/22;
        set_real_ip_from 103.31.4.0/22;
        set_real_ip_from 104.16.0.0/13;
        set_real_ip_from 104.24.0.0/14;
        set_real_ip_from 108.162.192.0/18;
        set_real_ip_from 131.0.72.0/22;
        set_real_ip_from 141.101.64.0/18;
        set_real_ip_from 162.158.0.0/15;
        set_real_ip_from 172.64.0.0/13;
        set_real_ip_from 173.245.48.0/20;
        set_real_ip_from 188.114.96.0/20;
        set_real_ip_from 190.93.240.0/20;
        set_real_ip_from 197.234.240.0/22;
        set_real_ip_from 198.41.128.0/17;
        
        real_ip_header CF-Connecting-IP;
        
        # Health check for Cloudflare
        location = /health.txt {
            add_header Content-Type text/plain;
            return 200 'OK';
        }
        
        # Proxy to Laravel app running in Docker
        location / {
            proxy_pass http://localhost:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
NGINX

# Create health check file
echo "Creating health check file..."
sudo mkdir -p /var/www/html
echo "OK" | sudo tee /var/www/html/health.txt

# Start Nginx with the new configuration
echo "Starting Nginx with the new configuration..."
sudo nginx -c /tmp/cloudflare-nginx.conf -t
sudo nginx -c /tmp/cloudflare-nginx.conf

# Verify Nginx is running
echo "Verifying Nginx is running..."
ps aux | grep nginx

# Update Docker Compose configuration
echo "Updating Docker Compose configuration..."
if [ -d "/opt/portfolio" ] && [ -f "/opt/portfolio/docker/docker-compose.yml" ]; then
  cd /opt/portfolio
  
  # Create a backup of the original docker-compose.yml
  cp docker/docker-compose.yml docker/docker-compose.yml.bak
  
  # Update the port mapping from 80:80 to 8080:80
  sed -i 's/"80:80"/"8080:80"/g' docker/docker-compose.yml
  
  # Start Docker Compose services
  echo "Starting Docker Compose services..."
  docker-compose -f docker/docker-compose.yml up -d
fi

# Test connectivity
echo "Testing local connectivity..."
curl -v http://localhost/health.txt

# Test external connectivity
echo "Testing external connectivity..."
curl -v http://$PUBLIC_IP/health.txt

echo "========== NGINX PORT CONFLICT FIXED =========="
echo ""
echo "NEXT STEPS:"
echo "1. Verify your Cloudflare DNS A record points to: $PUBLIC_IP"
echo "2. Set SSL/TLS encryption mode to 'Full' in Cloudflare"
echo "3. Ensure the proxy is enabled (orange cloud) for your domain"
echo "4. Purge all cached content in Cloudflare"
echo ""
echo "If you're still seeing a 521 error, try these additional steps:"
echo "1. Temporarily disable Cloudflare proxy (gray cloud) to test direct access"
echo "2. Check if your server is accessible directly via http://$PUBLIC_IP"
echo "3. Contact Cloudflare support if the issue persists"
EOF
)

# Run the remote commands
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "$REMOTE_COMMANDS"

echo "Nginx port conflict fix completed."