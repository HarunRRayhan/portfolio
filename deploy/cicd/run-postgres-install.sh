#!/bin/bash

# Script to safely run the PostgreSQL installation script on the remote server

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

# Copy the installation script to the server
echo "Copying PostgreSQL installation script to server..."
scp -i "$DEPLOY_DIR/$SSH_KEY" "$SCRIPT_DIR/install-postgres.sh" "$REMOTE_USER@$REMOTE_HOST:/tmp/install-postgres.sh"

# Make the script executable and run it with sudo
echo "Running PostgreSQL installation script on server..."
ssh -i "$DEPLOY_DIR/$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "chmod +x /tmp/install-postgres.sh && sudo /tmp/install-postgres.sh"

# Test if the site is accessible
echo "Testing site accessibility..."
HTTP_STATUS=$(ssh -i "$DEPLOY_DIR/$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "curl -s -o /dev/null -w '%{http_code}' http://localhost:80 || echo 'Connection failed'")
echo "HTTP status on localhost:80: $HTTP_STATUS"

if [[ "$HTTP_STATUS" == "200" ]]; then
  echo "✅ Site is accessible locally!"
else
  echo "⚠️ Site is not accessible locally. Status: $HTTP_STATUS"
fi

# Check container status
echo "Checking container status..."
CONTAINER_STATUS=$(ssh -i "$DEPLOY_DIR/$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "docker ps --format '{{.Names}}: {{.Status}}' | grep portfolio-app || echo 'No containers running'")
echo "Container status: $CONTAINER_STATUS"

# Clean up
echo "Cleaning up..."
ssh -i "$DEPLOY_DIR/$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "rm -f /tmp/install-postgres.sh"

echo "Script execution complete!"
