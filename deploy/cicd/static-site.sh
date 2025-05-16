#!/bin/bash

# Static Site Deployment Script
# This script creates a simple static HTML page and serves it using Nginx

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
echo "========== STATIC SITE DEPLOYMENT =========="

# Stop all Docker containers
echo "Stopping all Docker containers..."
docker ps -a -q | xargs -r docker stop
docker ps -a -q | xargs -r docker rm

# Install Nginx directly on the host
echo "Installing Nginx..."
sudo apt-get update
sudo apt-get install -y nginx

# Create a simple static HTML page
echo "Creating static HTML page..."
cat > /tmp/index.html << 'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harun R Rayhan</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            padding: 40px;
            background-color: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            border-radius: 5px;
            text-align: center;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        p {
            color: #666;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harun R Rayhan</h1>
        <p>Welcome to my portfolio site.</p>
        <p>The main application is currently undergoing maintenance.</p>
        <p>Please check back soon!</p>
    </div>
</body>
</html>
HTML

# Create a health check file
echo "Creating health check file..."
echo "OK" > /tmp/health.txt

# Configure Nginx
echo "Configuring Nginx..."
cat > /tmp/nginx-site.conf << 'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/html;
    index index.html;
    
    server_name _;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
NGINX

# Deploy the files
echo "Deploying files..."
sudo mkdir -p /var/www/html
sudo cp /tmp/index.html /var/www/html/index.html
sudo cp /tmp/health.txt /var/www/html/health.txt
sudo cp /tmp/nginx-site.conf /etc/nginx/sites-available/default

# Set correct permissions
echo "Setting permissions..."
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# Restart Nginx
echo "Restarting Nginx..."
sudo systemctl restart nginx

# Verify Nginx is running
echo "Verifying Nginx status..."
sudo systemctl status nginx

# Test the site
echo "Testing the site..."
curl -v http://localhost/

# Test the health check
echo "Testing health check..."
curl -v http://localhost/health.txt

echo "========== STATIC SITE DEPLOYMENT COMPLETED =========="
EOF
)

# Run the remote commands
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "$REMOTE_COMMANDS"

echo "Static site deployment completed."