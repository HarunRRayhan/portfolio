#!/bin/bash

# Simple script to run a basic web server on port 80
# This will help diagnose and fix Cloudflare 521 errors

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

# Run commands one by one to avoid interruptions
echo "Checking server IP..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "curl -s https://api.ipify.org"

echo -e "\nStopping existing services on port 80..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "sudo systemctl stop nginx || true"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "sudo pkill -f nginx || true"

echo -e "\nKilling any process using port 80..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "sudo fuser -k 80/tcp || true"

echo -e "\nCreating a simple HTML file..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "echo '<html><body><h1>Server is working!</h1><p>This confirms the server is accessible.</p></body></html>' | sudo tee /var/www/html/index.html"

echo -e "\nCreating a health check file..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "echo 'OK' | sudo tee /var/www/html/health.txt"

echo -e "\nStarting a simple Python HTTP server on port 80..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "cd /var/www/html && sudo nohup python3 -m http.server 80 > /dev/null 2>&1 &"

echo -e "\nVerifying the server is running..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "sleep 2 && sudo netstat -tuln | grep ':80 '"

echo -e "\nTesting local connectivity..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "curl -s http://localhost/health.txt"

echo -e "\nTesting external connectivity..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "curl -s http://\$(curl -s https://api.ipify.org)/health.txt"

echo -e "\nSimple web server setup completed."
echo -e "\nNEXT STEPS:"
echo "1. Verify your Cloudflare DNS A record points to the server IP"
echo "2. Set SSL/TLS encryption mode to 'Full' in Cloudflare"
echo "3. Ensure the proxy is enabled (orange cloud) for your domain"
echo "4. Purge all cached content in Cloudflare"
echo -e "\nIf you're still seeing a 521 error, try these additional steps:"
echo "1. Temporarily disable Cloudflare proxy (gray cloud) to test direct access"
echo "2. Check if your server is accessible directly via the server IP"
echo "3. Contact Cloudflare support if the issue persists"