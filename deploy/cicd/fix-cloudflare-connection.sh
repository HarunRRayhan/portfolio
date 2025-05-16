#!/bin/bash

# Comprehensive script to fix Cloudflare 521 error
# This script diagnoses and fixes common issues that cause Cloudflare 521 errors

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
echo "========== CLOUDFLARE CONNECTION FIX =========="

# Get server's public IP
PUBLIC_IP=$(curl -s https://api.ipify.org)
echo "Server public IP: $PUBLIC_IP"

# Check if port 80 is open and listening
echo "Checking if port 80 is open and listening..."
if netstat -tuln | grep -q ":80 "; then
  echo "✅ Port 80 is open and listening"
else
  echo "❌ Port 80 is not open. Checking what might be blocking it..."
  
  # Check if nginx is running
  if systemctl is-active --quiet nginx; then
    echo "Nginx is running, but not listening on port 80"
    echo "Checking Nginx configuration..."
    nginx -T | grep -i "listen"
  else
    echo "Nginx is not running. Attempting to start it..."
    systemctl start nginx
    systemctl status nginx
  fi
  
  # Check Docker containers
  echo "Checking Docker containers..."
  docker ps
fi

# Check if port 443 is open and listening
echo "Checking if port 443 is open and listening..."
if netstat -tuln | grep -q ":443 "; then
  echo "✅ Port 443 is open and listening"
else
  echo "❌ Port 443 is not open"
fi

# Check if Docker is running
echo "Checking if Docker is running..."
if systemctl is-active --quiet docker; then
  echo "✅ Docker is running"
else
  echo "❌ Docker is not running. Starting Docker..."
  systemctl start docker
fi

# Check Docker containers
echo "Checking Docker containers..."
docker ps

# Check Docker Compose services
echo "Checking Docker Compose services in /opt/portfolio..."
if [ -d "/opt/portfolio" ]; then
  cd /opt/portfolio
  if [ -f "./docker/docker-compose.yml" ]; then
    echo "Docker Compose file found. Checking services..."
    docker-compose -f ./docker/docker-compose.yml ps
  else
    echo "❌ Docker Compose file not found in /opt/portfolio/docker/"
  fi
else
  echo "❌ Directory /opt/portfolio not found"
fi

# Fix common issues
echo "Fixing common issues..."

# 1. Ensure Nginx listens on port 80 directly
echo "Setting up direct Nginx listener on port 80..."
cat > /tmp/direct-nginx.conf << 'NGINX'
server {
    listen 80 default_server;
    server_name _;
    
    # Cloudflare IPs - update this list as needed
    # https://www.cloudflare.com/ips/
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 2400:cb00::/32;
    set_real_ip_from 2606:4700::/32;
    set_real_ip_from 2803:f800::/32;
    set_real_ip_from 2405:b500::/32;
    set_real_ip_from 2405:8100::/32;
    set_real_ip_from 2c0f:f248::/32;
    set_real_ip_from 2a06:98c0::/29;
    
    real_ip_header CF-Connecting-IP;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check endpoint for Cloudflare
    location /health.txt {
        add_header Content-Type text/plain;
        return 200 'OK';
    }
}
NGINX

sudo cp /tmp/direct-nginx.conf /etc/nginx/sites-available/direct
sudo ln -sf /etc/nginx/sites-available/direct /etc/nginx/sites-enabled/direct

# Remove default site if it exists
if [ -f "/etc/nginx/sites-enabled/default" ]; then
  sudo rm -f /etc/nginx/sites-enabled/default
fi

# 2. Create health check file
echo "Creating health check file..."
echo "OK" | sudo tee /var/www/html/health.txt

# 3. Check Docker Compose configuration
echo "Checking Docker Compose configuration..."
if [ -d "/opt/portfolio" ]; then
  cd /opt/portfolio
  if [ -f "./docker/docker-compose.yml" ]; then
    # Modify Docker Compose to ensure nginx container binds to port 8080 instead of 80
    echo "Updating Docker Compose configuration..."
    sudo sed -i 's/"80:80"/"8080:80"/g' ./docker/docker-compose.yml
    
    # Restart Docker Compose services
    echo "Restarting Docker Compose services..."
    docker-compose -f ./docker/docker-compose.yml down
    docker-compose -f ./docker/docker-compose.yml up -d
  fi
fi

# 4. Restart Nginx
echo "Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl status nginx

# 5. Check firewall status
echo "Checking firewall status..."
if command -v ufw &> /dev/null; then
  echo "UFW firewall status:"
  sudo ufw status
  
  # Ensure ports 80 and 443 are open
  echo "Ensuring ports 80 and 443 are open..."
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
fi

# 6. Test connectivity
echo "Testing local connectivity..."
curl -v http://localhost/health.txt

# 7. Test external connectivity
echo "Testing external connectivity..."
curl -v http://$PUBLIC_IP/health.txt

echo "========== CLOUDFLARE CONNECTION FIX COMPLETED =========="
echo ""
echo "NEXT STEPS:"
echo "1. Verify your Cloudflare DNS A record points to: $PUBLIC_IP"
echo "2. Set SSL/TLS encryption mode to 'Full' in Cloudflare"
echo "3. Ensure the proxy is enabled (orange cloud) for your domain"
echo "4. Purge all cached content in Cloudflare"
echo ""
echo "If you're still seeing a 521 error, try these additional steps:"
echo "1. Temporarily disable Cloudflare proxy (gray cloud) to test direct access"
echo "2. Check if your server is accessible directly via http://$PUBLIC_IP"
echo "3. Contact Cloudflare support if the issue persists"
EOF
)

# Run the remote commands
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "$REMOTE_COMMANDS"

echo "Cloudflare connection fix completed."