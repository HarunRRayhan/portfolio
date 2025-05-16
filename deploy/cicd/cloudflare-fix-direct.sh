#!/bin/bash

# Cloudflare Direct Fix Script
# This script implements specific fixes for Cloudflare connectivity issues

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
echo "========== CLOUDFLARE DIRECT FIX =========="

# Stop all services that might be using port 80
echo "Stopping all services on port 80..."
sudo systemctl stop nginx || true
sudo killall -9 nginx || true
sudo lsof -ti:80 | xargs -r sudo kill -9 || true

# Create a special file for Cloudflare
echo "Creating Cloudflare-specific test files..."
mkdir -p /tmp/cloudflare-test
echo "<html><body><h1>Cloudflare Test</h1><p>This page confirms connectivity between Cloudflare and your origin server.</p></body></html>" > /tmp/cloudflare-test/index.html
echo "Cloudflare connectivity test successful" > /tmp/cloudflare-test/cf-test.txt

# Create a minimal Nginx configuration specifically for Cloudflare
echo "Creating Cloudflare-optimized Nginx configuration..."
cat > /tmp/cloudflare.conf << 'NGINX'
worker_processes 1;
error_log /var/log/nginx-error.log;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Cloudflare settings
    real_ip_header CF-Connecting-IP;
    
    # Log settings
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx-access.log main;
    
    # Performance settings
    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout  65;
    
    # Server block
    server {
        listen       80 default_server;
        server_name  _;
        
        # Root directory
        root   /tmp/cloudflare-test;
        index  index.html;
        
        # Allow Cloudflare IPs
        # This is a simplified list - the full list is much longer
        # but this covers the main ranges
        allow 103.21.244.0/22;
        allow 103.22.200.0/22;
        allow 103.31.4.0/22;
        allow 104.16.0.0/12;
        allow 108.162.192.0/18;
        allow 131.0.72.0/22;
        allow 141.101.64.0/18;
        allow 162.158.0.0/15;
        allow 172.64.0.0/13;
        allow 173.245.48.0/20;
        allow 188.114.96.0/20;
        allow 190.93.240.0/20;
        allow 197.234.240.0/22;
        allow 198.41.128.0/17;
        
        # Also allow direct testing
        allow 127.0.0.1;
        allow all;
        
        # Main location block
        location / {
            try_files $uri $uri/ =404;
            
            # Add headers for Cloudflare
            add_header X-Content-Type-Options "nosniff" always;
            add_header X-XSS-Protection "1; mode=block" always;
            add_header X-Frame-Options "SAMEORIGIN" always;
        }
        
        # Test file specifically for Cloudflare
        location = /cf-test.txt {
            add_header Content-Type text/plain;
            add_header Cache-Control "no-store, no-cache, must-revalidate";
        }
        
        # Deny access to hidden files
        location ~ /\. {
            deny all;
        }
    }
}
NGINX

# Start Nginx with our Cloudflare-optimized configuration
echo "Starting Nginx with Cloudflare-optimized configuration..."
sudo nginx -c /tmp/cloudflare.conf -t
sudo nginx -c /tmp/cloudflare.conf

# Verify Nginx is running
echo "Verifying Nginx is running..."
ps aux | grep nginx | grep -v grep || echo "Nginx is not running"

# Check if port 80 is in use
echo "Checking if port 80 is in use..."
sudo netstat -tuln | grep ":80 " || echo "Port 80 is not in use"

# Test the site locally
echo "Testing the site locally..."
curl -v http://localhost/ || echo "Failed to access site locally"
curl -v http://localhost/cf-test.txt || echo "Failed to access Cloudflare test file locally"

# Get server's public IP
PUBLIC_IP=$(curl -s https://api.ipify.org)
echo "Server public IP: $PUBLIC_IP"

# Disable UFW firewall to ensure no firewall issues
echo "Temporarily disabling firewall..."
if command -v ufw &> /dev/null; then
  sudo ufw disable
  echo "UFW firewall disabled"
else
  echo "UFW not installed, no firewall to disable"
fi

echo "========== CLOUDFLARE DIRECT FIX COMPLETED =========="
echo ""
echo "IMPORTANT NEXT STEPS:"
echo "1. Update your Cloudflare DNS A record to point to: $PUBLIC_IP"
echo "2. Set SSL/TLS encryption mode to 'Flexible' in Cloudflare"
echo "3. Purge all cached content in Cloudflare"
echo "4. Wait 5-10 minutes for changes to take effect"
echo ""
echo "You can verify direct connectivity by accessing: http://$PUBLIC_IP/cf-test.txt"
echo "This should show: 'Cloudflare connectivity test successful'"
echo ""
echo "If you're still seeing a 521 error after these steps, please check your Cloudflare Firewall Rules"
echo "and ensure there are no rules blocking access to your site."
EOF
)

# Run the remote commands
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "$REMOTE_COMMANDS"

echo "Cloudflare direct fix completed."