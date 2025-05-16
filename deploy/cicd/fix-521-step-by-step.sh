#!/bin/bash

# Step-by-step script to fix Cloudflare 521 error
# This script runs multiple separate SSH commands to avoid connection issues

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

SSH_CMD="ssh -i \"$SSH_KEY\" -o StrictHostKeyChecking=no \"$REMOTE_USER@$REMOTE_HOST\""

echo "Using SSH key: $SSH_KEY"
echo "Connecting to: $REMOTE_USER@$REMOTE_HOST"

# Step 1: Get server IP
echo "Step 1: Getting server IP..."
SERVER_IP=$(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "curl -s https://api.ipify.org")
echo "Server IP: $SERVER_IP"

# Step 2: Check what's using port 80
echo "Step 2: Checking what's using port 80..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "sudo lsof -i :80 || echo 'No process using port 80'"

# Step 3: Stop Nginx if running
echo "Step 3: Stopping Nginx if running..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "sudo systemctl stop nginx || true"

# Step 4: Kill any process using port 80
echo "Step 4: Killing any process using port 80..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "sudo fuser -k 80/tcp || true"

# Step 5: Create web directory
echo "Step 5: Creating web directory..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "sudo mkdir -p /var/www/html"

# Step 6: Create index.html
echo "Step 6: Creating index.html..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "echo '<html><body><h1>Server is working!</h1><p>This confirms the server is accessible.</p></body></html>' | sudo tee /var/www/html/index.html"

# Step 7: Create health.txt
echo "Step 7: Creating health.txt..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "echo 'OK' | sudo tee /var/www/html/health.txt"

# Step 8: Install Python3 if not already installed
echo "Step 8: Ensuring Python3 is installed..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "sudo apt-get update && sudo apt-get install -y python3 || true"

# Step 9: Start Python HTTP server
echo "Step 9: Starting Python HTTP server..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "cd /var/www/html && sudo nohup python3 -m http.server 80 > /dev/null 2>&1 & echo 'Python server started'"

# Step 10: Verify server is running
echo "Step 10: Verifying server is running..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "sleep 2 && sudo netstat -tuln | grep ':80 ' || echo 'Server not running on port 80'"

# Step 11: Test local connectivity
echo "Step 11: Testing local connectivity..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "curl -s http://localhost/health.txt || echo 'Failed to connect locally'"

# Step 12: Test external connectivity
echo "Step 12: Testing external connectivity..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "curl -s http://$SERVER_IP/health.txt || echo 'Failed to connect externally'"

echo "Fix completed. Please check if the Cloudflare 521 error is resolved."
echo ""
echo "NEXT STEPS:"
echo "1. Verify your Cloudflare DNS A record points to: $SERVER_IP"
echo "2. Set SSL/TLS encryption mode to 'Full' in Cloudflare"
echo "3. Ensure the proxy is enabled (orange cloud) for your domain"
echo "4. Purge all cached content in Cloudflare"
echo ""
echo "If you're still seeing a 521 error, try these additional steps:"
echo "1. Temporarily disable Cloudflare proxy (gray cloud) to test direct access"
echo "2. Check if your server is accessible directly via http://$SERVER_IP"
echo "3. Contact Cloudflare support if the issue persists"