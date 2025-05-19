#!/bin/bash

# Script to safely run the Laravel application fix script on the remote server

set -e

# Load environment variables
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$DEPLOY_DIR/.env.deploy" ]; then
  set -a
  . "$DEPLOY_DIR/.env.deploy"
  set +a
fi

# Check if we have the required variables
if [ -z "$REMOTE_USER" ] || [ -z "$REMOTE_HOST" ] || [ -z "$SSH_KEY" ]; then
  echo "Missing required environment variables. Please check .env.deploy file."
  exit 1
fi

# Ensure SSH key has correct permissions
if [ -f "$DEPLOY_DIR/$SSH_KEY" ]; then
  chmod 600 "$DEPLOY_DIR/$SSH_KEY"
else
  echo "SSH key file not found: $DEPLOY_DIR/$SSH_KEY"
  exit 1
fi

# Copy the fix script to the server
echo "Copying Laravel application fix script to server..."
scp -i "$DEPLOY_DIR/$SSH_KEY" "$SCRIPT_DIR/fix-laravel-app.sh" "$REMOTE_USER@$REMOTE_HOST:/tmp/fix-laravel-app.sh"

# Make the script executable and run it with sudo
echo "Running Laravel application fix script on server..."
ssh -i "$DEPLOY_DIR/$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "chmod +x /tmp/fix-laravel-app.sh && sudo /tmp/fix-laravel-app.sh"

# Test if the site is accessible
echo "Testing site accessibility..."
HTTP_STATUS=$(ssh -i "$DEPLOY_DIR/$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "curl -s -o /dev/null -w '%{http_code}' http://localhost:80 || echo 'Connection failed'")
echo "HTTP status on localhost:80: $HTTP_STATUS"

if [[ "$HTTP_STATUS" == "200" ]]; then
  echo "✅ Site is accessible locally!"
else
  echo "⚠️ Site is not accessible locally. Status: $HTTP_STATUS"
fi

# Test diagnostic page
echo "Testing diagnostic page..."
DIAG_STATUS=$(ssh -i "$DEPLOY_DIR/$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "curl -s -o /dev/null -w '%{http_code}' http://localhost/diagnose.php || echo 'Connection failed'")
echo "Diagnostic page status: $DIAG_STATUS"

if [[ "$DIAG_STATUS" == "200" ]]; then
  echo "✅ Diagnostic page is accessible!"
  echo "Retrieving diagnostic information..."
  ssh -i "$DEPLOY_DIR/$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "curl -s http://localhost/diagnose.php | grep -v '<pre>' | grep -v '</pre>'" | head -n 30
  echo "..."
else
  echo "⚠️ Diagnostic page is not accessible. Status: $DIAG_STATUS"
fi

# Check container status
echo "Checking container status..."
CONTAINER_STATUS=$(ssh -i "$DEPLOY_DIR/$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "docker ps --format '{{.Names}}: {{.Status}}' | grep portfolio-app || echo 'No containers running'")
echo "Container status: $CONTAINER_STATUS"

# Check Cloudflare connectivity
echo "Checking Cloudflare connectivity..."
DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://harun.dev || echo "Connection failed")
echo "HTTP status on https://harun.dev: $DOMAIN_STATUS"

if [[ "$DOMAIN_STATUS" == "200" ]]; then
  echo "✅ Site is accessible through Cloudflare!"
else
  echo "⚠️ Site is not accessible through Cloudflare. Status: $DOMAIN_STATUS"
fi

# Clean up
echo "Cleaning up..."
ssh -i "$DEPLOY_DIR/$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "rm -f /tmp/fix-laravel-app.sh"

echo "Script execution complete!"
