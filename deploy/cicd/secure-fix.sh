#!/bin/bash

# Secure script to fix Cloudflare 521 error
# This script properly sources environment variables from .env.deploy

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

# Check server status
echo "Checking server status..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "curl -s http://localhost/ > /dev/null && echo 'Server is responding on port 80' || echo 'Server is NOT responding on port 80'"

# Get server IP
SERVER_IP=$(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "curl -s https://api.ipify.org")
echo "Server IP: $SERVER_IP"

echo "Cloudflare connection check completed."
echo ""
echo "NEXT STEPS:"
echo "1. Verify your Cloudflare DNS A record points to: $SERVER_IP"
echo "2. Set SSL/TLS encryption mode to 'Full' in Cloudflare"
echo "3. Ensure the proxy is enabled (orange cloud) for your domain"
echo "4. Purge all cached content in Cloudflare"