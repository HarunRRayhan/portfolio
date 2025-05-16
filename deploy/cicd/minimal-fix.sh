#!/bin/bash

# Minimal script to fix Cloudflare 521 error
# This script runs a basic web server on port 80

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

# Create a simple HTML file
cat > /tmp/index.html << 'HTML'
<!DOCTYPE html>
<html>
<head>
    <title>Server is working!</title>
</head>
<body>
    <h1>Server is working!</h1>
    <p>This confirms the server is accessible.</p>
</body>
</html>
HTML

# Create a simple health check file
echo "OK" > /tmp/health.txt

# Copy files to server
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no /tmp/index.html "$REMOTE_USER@$REMOTE_HOST:/tmp/index.html"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no /tmp/health.txt "$REMOTE_USER@$REMOTE_HOST:/tmp/health.txt"

# Run a single command to set up the web server
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "sudo pkill -f 'nginx' || true; sudo pkill -f 'python3 -m http.server 80' || true; sudo mkdir -p /var/www/html; sudo cp /tmp/index.html /var/www/html/index.html; sudo cp /tmp/health.txt /var/www/html/health.txt; cd /var/www/html && sudo python3 -m http.server 80 > /dev/null 2>&1 &"

echo "Basic web server started on port 80."
echo "Please check if the Cloudflare 521 error is resolved."
echo "You can test direct access by visiting: http://$REMOTE_HOST"