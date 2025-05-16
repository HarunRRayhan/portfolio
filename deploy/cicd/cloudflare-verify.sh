#!/bin/bash

# Cloudflare Verification Script
# This script verifies that Cloudflare can properly connect to your origin server

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
echo "========== CLOUDFLARE VERIFICATION =========="

# Get server's public IP
echo "Server public IP: $(curl -s https://api.ipify.org)"

# Create a special file for Cloudflare to verify
echo "Creating special verification file..."
echo "Cloudflare verification successful" > /var/www/html/cloudflare-verify.txt
sudo chmod 644 /var/www/html/cloudflare-verify.txt

# Check if Nginx is running
echo "Checking if Nginx is running..."
ps aux | grep nginx | grep -v grep || echo "Nginx is not running"

# Verify the file is accessible locally
echo "Verifying file is accessible locally..."
curl -s http://localhost/cloudflare-verify.txt || echo "Failed to access verification file locally"

# Check Cloudflare IP ranges
echo "Checking if server allows Cloudflare IP ranges..."
if command -v ufw &> /dev/null; then
  echo "Firewall status:"
  sudo ufw status
  
  echo "Ensuring port 80 is allowed for all IPs (including Cloudflare)..."
  sudo ufw allow 80/tcp
else
  echo "UFW not installed, assuming no firewall restrictions"
fi

# Check AWS security group settings
echo "Checking AWS security group settings..."
if command -v aws &> /dev/null; then
  echo "AWS CLI is available, but we need credentials to check security groups"
else
  echo "AWS CLI not installed"
  echo "Please verify in AWS Console that the security group allows inbound traffic on port 80 from Cloudflare IP ranges"
fi

echo "========== CLOUDFLARE VERIFICATION COMPLETED =========="
echo ""
echo "IMPORTANT: If Cloudflare is still showing a 521 error, please verify that:"
echo "1. The DNS A record for harun.dev points to: $(curl -s https://api.ipify.org)"
echo "2. Cloudflare proxy is enabled (orange cloud) for your domain"
echo "3. You've purged the Cloudflare cache after making these changes"
echo ""
echo "You can verify the connection by accessing: http://$(curl -s https://api.ipify.org)/cloudflare-verify.txt"
echo "This should show: 'Cloudflare verification successful'"
EOF
)

# Run the remote commands
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "$REMOTE_COMMANDS"

echo "Cloudflare verification completed."