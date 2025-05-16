#!/bin/bash

# Cloudflare Direct Access Script
# This script creates a direct access URL for testing without Cloudflare

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
echo "========== CLOUDFLARE DIRECT ACCESS SETUP =========="

# Get server's public IP
PUBLIC_IP=$(curl -s https://api.ipify.org)
echo "Server public IP: $PUBLIC_IP"

# Create a direct access page
echo "Creating direct access page..."
sudo mkdir -p /var/www/direct
cat > /tmp/direct-index.html << 'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Direct Access - Harun R Rayhan</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        .status {
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        .instructions {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
        }
        code {
            background-color: #f1f1f1;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Direct Access - Harun R Rayhan</h1>
        
        <div class="status">
            ✅ <strong>Server Status:</strong> Your server is running and accessible directly!
        </div>
        
        <p>This page confirms that your server is working correctly.</p>
        
        <div class="instructions">
            <h3>Cloudflare Connection Instructions:</h3>
            <ol>
                <li>Verify your Cloudflare DNS settings point to the correct IP</li>
                <li>Set SSL/TLS encryption mode to "Flexible" in Cloudflare</li>
                <li>Ensure the proxy is enabled (orange cloud) for your domain</li>
                <li>Purge all cached content in Cloudflare</li>
                <li>Check that there are no Firewall rules blocking access</li>
            </ol>
        </div>
        
        <p>If you're still seeing a 521 error after following these steps, please contact Cloudflare support as the issue may be on their end.</p>
    </div>
</body>
</html>
HTML

sudo cp /tmp/direct-index.html /var/www/direct/index.html
sudo chmod 644 /var/www/direct/index.html

# Create a direct access Nginx configuration
echo "Creating direct access Nginx configuration..."
cat > /tmp/direct.conf << 'NGINX'
server {
    listen 8090;
    server_name _;
    
    root /var/www/direct;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
NGINX

sudo cp /tmp/direct.conf /etc/nginx/sites-available/direct
sudo ln -sf /etc/nginx/sites-available/direct /etc/nginx/sites-enabled/direct

# Restart Nginx
echo "Restarting Nginx..."
sudo systemctl restart nginx

# Check if port 8090 is in use
echo "Checking if port 8090 is in use..."
sudo netstat -tuln | grep ":8090 " || echo "Port 8090 is not in use"

# If port 8090 is not in use, try starting Nginx directly
if ! sudo netstat -tuln | grep -q ":8090 "; then
  echo "Port 8090 is not in use, trying to start Nginx directly..."
  sudo nginx -t
  sudo nginx
fi

# Test direct access
echo "Testing direct access..."
curl -s http://localhost:8090/ > /dev/null && echo "Direct access is working!" || echo "Direct access is not working"

echo "========== CLOUDFLARE DIRECT ACCESS SETUP COMPLETED =========="
echo ""
echo "DIRECT ACCESS URL: http://$PUBLIC_IP:8090/"
echo ""
echo "Please try accessing your site directly using the URL above."
echo "If this works but Cloudflare still shows a 521 error, the issue is definitely with Cloudflare's configuration."
echo ""
echo "Try these additional steps:"
echo "1. Temporarily disable Cloudflare proxy (gray cloud) to test direct access"
echo "2. Check if your Cloudflare plan allows for custom SSL certificates"
echo "3. Contact Cloudflare support with the information that your server is accessible directly"
EOF
)

# Run the remote commands
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "$REMOTE_COMMANDS"

echo "Cloudflare direct access setup completed."