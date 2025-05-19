#!/bin/bash

# Script to build assets locally and copy them to the server

set -e

# Load environment variables
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$DEPLOY_DIR")"

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

# Build assets locally
echo "Building assets locally..."
cd "$PROJECT_DIR"

# Install dependencies
echo "Installing npm dependencies..."
npm install

# Build assets
echo "Running npm build..."
npm run build

# Check if build was successful
if [ ! -d "$PROJECT_DIR/public/build" ]; then
  echo "Build failed! No build directory found."
  exit 1
fi

# Create a temporary directory for assets
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TEMP_DIR"

# Copy built assets to temporary directory
echo "Copying built assets to temporary directory..."
cp -r "$PROJECT_DIR/public/build" "$TEMP_DIR/"

# Create a tar file of the assets
echo "Creating tar file of assets..."
cd "$TEMP_DIR"
tar -czf assets.tar.gz build

# Copy the tar file to the server
echo "Copying assets to server..."
scp -i "$DEPLOY_DIR/$SSH_KEY" "$TEMP_DIR/assets.tar.gz" "$REMOTE_USER@$REMOTE_HOST:/tmp/assets.tar.gz"

# Extract the assets on the server
echo "Extracting assets on server..."
ssh -i "$DEPLOY_DIR/$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "sudo mkdir -p /opt/portfolio/public/build && sudo tar -xzf /tmp/assets.tar.gz -C /opt/portfolio/public && sudo chown -R 1000:1000 /opt/portfolio/public/build && sudo chmod -R 755 /opt/portfolio/public/build"

# Clean up
echo "Cleaning up..."
rm -rf "$TEMP_DIR"
ssh -i "$DEPLOY_DIR/$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "rm -f /tmp/assets.tar.gz"

# Test if the site is accessible
echo "Testing site accessibility..."
HTTP_STATUS=$(ssh -i "$DEPLOY_DIR/$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "curl -s -o /dev/null -w '%{http_code}' http://localhost:80 || echo 'Connection failed'")
echo "HTTP status on localhost:80: $HTTP_STATUS"

if [[ "$HTTP_STATUS" == "200" ]]; then
  echo "✅ Site is accessible locally!"
else
  echo "⚠️ Site is not accessible locally. Status: $HTTP_STATUS"
fi

# Check Cloudflare connectivity
echo "Checking Cloudflare connectivity..."
DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://harun.dev || echo "Connection failed")
echo "HTTP status on https://harun.dev: $DOMAIN_STATUS"

if [[ "$DOMAIN_STATUS" == "200" ]]; then
  echo "✅ Site is accessible through Cloudflare!"
else
  echo "⚠️ Site is not accessible through Cloudflare. Status: $DOMAIN_STATUS"
fi

echo "Script execution complete!"
