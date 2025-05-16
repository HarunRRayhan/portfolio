#!/bin/bash

# Script to fix Cloudflare 521 error
# This script creates a simple Nginx configuration that works with Cloudflare

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

# Create a simple HTML file for testing
cat > /tmp/index.html << 'HTML'
<!DOCTYPE html>
<html>
<head>
    <title>Harun R Rayhan - Portfolio</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        .status {
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harun R Rayhan - Portfolio</h1>
        
        <div class="status">
            ✅ <strong>Server Status:</strong> Your server is running and accessible through Cloudflare!
        </div>
        
        <p>This is a temporary page while the main application is being configured.</p>
        <p>The full portfolio site will be available soon.</p>
    </div>
</body>
</html>
HTML

# Create a simple Nginx configuration file
cat > /tmp/nginx.conf << 'NGINX'
worker_processes 1;
error_log stderr notice;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    sendfile on;
    keepalive_timeout 65;
    
    server {
        listen 80;
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
        
        location / {
            try_files $uri $uri/ =404;
            
            # Add headers for Cloudflare
            add_header X-Content-Type-Options "nosniff";
            add_header X-XSS-Protection "1; mode=block";
            add_header X-Frame-Options "SAMEORIGIN";
        }
        
        # Health check for Cloudflare
        location = /health.txt {
            add_header Content-Type text/plain;
            return 200 'OK';
        }
    }
}
NGINX

# Create remote commands
REMOTE_COMMANDS=$(cat << 'EOF'
echo "========== CLOUDFLARE 521 FIX =========="

# Get server's public IP
PUBLIC_IP=$(curl -s https://api.ipify.org)
echo "Server public IP: $PUBLIC_IP"

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

# Create directory for web files
echo "Creating directory for web files..."
sudo mkdir -p /var/www/html

# Create health check file
echo "Creating health check file..."
echo "OK" | sudo tee /var/www/html/health.txt

# Start Nginx with the new configuration
echo "Starting Nginx with the new configuration..."
sudo nginx -c /tmp/nginx.conf -t
sudo nginx -c /tmp/nginx.conf

# Verify Nginx is running
echo "Verifying Nginx is running..."
ps aux | grep nginx

# Check if port 80 is in use
echo "Checking if port 80 is in use..."
sudo netstat -tuln | grep ":80 "

# Test connectivity
echo "Testing local connectivity..."
curl -v http://localhost/health.txt

# Test external connectivity
echo "Testing external connectivity..."
curl -v http://$PUBLIC_IP/health.txt

echo "========== CLOUDFLARE 521 FIX COMPLETED =========="
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

# Copy files to the server
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no /tmp/index.html "$REMOTE_USER@$REMOTE_HOST:/tmp/index.html"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no /tmp/nginx.conf "$REMOTE_USER@$REMOTE_HOST:/tmp/nginx.conf"

# Run the remote commands
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "$REMOTE_COMMANDS"

echo "Cloudflare 521 fix completed."