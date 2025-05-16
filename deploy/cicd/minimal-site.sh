#!/bin/bash

# Minimal Site Deployment Script
# This script creates the simplest possible Nginx configuration

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
echo "========== MINIMAL SITE DEPLOYMENT =========="

# Stop all services that might be using port 80
echo "Stopping all services on port 80..."
sudo systemctl stop nginx || true
sudo killall -9 nginx || true
sudo lsof -ti:80 | xargs -r sudo kill -9 || true

# Create a minimal HTML file
echo "Creating minimal HTML file..."
echo "<html><body><h1>Harun R Rayhan</h1><p>Site is working!</p></body></html>" > /tmp/index.html

# Create a minimal Nginx configuration
echo "Creating minimal Nginx configuration..."
cat > /tmp/minimal.conf << 'NGINX'
worker_processes 1;
events {
    worker_connections 1024;
}
http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;
    
    server {
        listen       80;
        server_name  localhost;
        
        location / {
            root   /var/www/html;
            index  index.html;
        }
    }
}
NGINX

# Deploy the files
echo "Deploying files..."
sudo mkdir -p /var/www/html
sudo cp /tmp/index.html /var/www/html/index.html

# Start Nginx with our minimal configuration
echo "Starting Nginx with minimal configuration..."
sudo nginx -c /tmp/minimal.conf -t
sudo nginx -c /tmp/minimal.conf

# Verify Nginx is running
echo "Verifying Nginx is running..."
ps aux | grep nginx

# Check if port 80 is in use
echo "Checking if port 80 is in use..."
sudo netstat -tuln | grep ":80 " || echo "Port 80 is not in use"

# Test the site
echo "Testing the site..."
curl -v http://localhost/

# Check external connectivity
echo "Checking external connectivity..."
PUBLIC_IP=$(curl -s https://api.ipify.org)
echo "Server public IP: $PUBLIC_IP"
echo "You can test external connectivity by running: curl -v http://$PUBLIC_IP/"

# Check AWS security group settings
echo "Checking AWS security group settings..."
if command -v aws &> /dev/null; then
  echo "AWS CLI is available, but we need credentials to check security groups"
else
  echo "AWS CLI not installed"
  echo "Please verify in AWS Console that the security group allows inbound traffic on port 80"
fi

echo "========== MINIMAL SITE DEPLOYMENT COMPLETED =========="
EOF
)

# Run the remote commands
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "$REMOTE_COMMANDS"

echo "Minimal site deployment completed."