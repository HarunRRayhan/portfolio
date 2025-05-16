#!/bin/bash

# Cloudflare 521 Fix Script
# This script properly sources environment variables and fixes Cloudflare 521 errors

set -e

# Load environment variables
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$DEPLOY_DIR/.env.deploy" ]; then
  set -a
  . "$DEPLOY_DIR/.env.deploy"
  set +a
else
  echo "Error: .env.deploy file not found at $DEPLOY_DIR/.env.deploy"
  exit 1
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

# Create a simple HTML file for the health check
cat > /tmp/index.html << 'HTML'
<!DOCTYPE html>
<html>
<head>
    <title>Server Health Check</title>
</head>
<body>
    <h1>Server is working!</h1>
    <p>This confirms the server is accessible.</p>
</body>
</html>
HTML

# Create health check file
echo "OK" > /tmp/health.txt

# Copy files to the server
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no /tmp/index.html "$REMOTE_USER@$REMOTE_HOST:/tmp/index.html"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no /tmp/health.txt "$REMOTE_USER@$REMOTE_HOST:/tmp/health.txt"

# Set up the web server on port 80
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
# Create web directory
sudo mkdir -p /var/www/html

# Copy health check files
sudo cp /tmp/index.html /var/www/html/
sudo cp /tmp/health.txt /var/www/html/

# Stop any existing services on port 80
sudo systemctl stop nginx || true
sudo pkill -f "nginx" || true
sudo pkill -f "python3 -m http.server 80" || true

# Start a simple Python HTTP server on port 80
cd /var/www/html && sudo nohup python3 -m http.server 80 > /dev/null 2>&1 &

# Verify the server is running
sleep 2
if sudo netstat -tuln | grep -q ":80 "; then
  echo "✅ Server is now running on port 80"
else
  echo "❌ Failed to start server on port 80"
fi

# Test local connectivity
if curl -s http://localhost/health.txt | grep -q "OK"; then
  echo "✅ Server is responding correctly"
else
  echo "❌ Server is not responding correctly"
fi

# Get server IP
SERVER_IP=$(curl -s https://api.ipify.org)
echo "Server IP: $SERVER_IP"
EOF

echo "Cloudflare fix completed."
echo ""
echo "NEXT STEPS:"
echo "1. Verify your Cloudflare DNS A record points to the server IP"
echo "2. Set SSL/TLS encryption mode to 'Full' in Cloudflare"
echo "3. Ensure the proxy is enabled (orange cloud) for your domain"
echo "4. Purge all cached content in Cloudflare"