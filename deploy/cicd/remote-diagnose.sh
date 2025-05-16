#!/bin/bash

# Remote Server Diagnostic Script
# This script SSHs into the server and runs diagnostics to identify Cloudflare 521 errors

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

# Create remote diagnostic commands
REMOTE_COMMANDS=$(cat << 'EOF'
echo "========== SERVER DIAGNOSTIC REPORT =========="
echo "Running comprehensive diagnostics to identify why Cloudflare can't connect..."

# 1. Check server's public IP
echo -e "\n=== SERVER IP ADDRESS ==="
PUBLIC_IP=$(curl -s https://api.ipify.org)
echo "Server public IP: $PUBLIC_IP"

# 2. Check if Docker is running
echo -e "\n=== DOCKER STATUS ==="
if command -v docker &> /dev/null; then
  echo "Docker is installed"
  if systemctl is-active --quiet docker; then
    echo "Docker service is running"
  else
    echo "⚠️ Docker service is NOT running"
    echo "Running: sudo systemctl start docker"
    sudo systemctl start docker
  fi
else
  echo "⚠️ Docker is NOT installed"
fi

# 3. Check Docker containers
echo -e "\n=== DOCKER CONTAINERS ==="
CONTAINERS=$(docker ps -a --format "{{.Names}}: {{.Status}}" | grep portfolio-app || echo "No portfolio containers found")
echo "$CONTAINERS"

RUNNING_CONTAINER=$(docker ps --format "{{.Names}}" | grep portfolio-app || echo "No running portfolio container")
if [[ "$RUNNING_CONTAINER" == "No running portfolio container" ]]; then
  echo "⚠️ No running portfolio container found"
  LATEST_CONTAINER=$(docker ps -a --format "{{.Names}}" | grep portfolio-app | head -n 1)
  if [[ -n "$LATEST_CONTAINER" ]]; then
    echo "Latest container: $LATEST_CONTAINER (not running)"
    echo "Starting container: $LATEST_CONTAINER"
    docker start $LATEST_CONTAINER
  fi
else
  echo "Running container: $RUNNING_CONTAINER"
fi

# 4. Check port bindings
echo -e "\n=== PORT BINDINGS ==="
PORT_80=$(netstat -tuln | grep ":80 " || echo "Port 80 not in use")
echo "Port 80 status: $PORT_80"

if [[ "$PORT_80" == "Port 80 not in use" ]]; then
  echo "⚠️ Port 80 is not in use - this is why Cloudflare can't connect"
  echo "Stopping all portfolio containers to free up ports..."
  docker ps -a --format "{{.Names}}" | grep portfolio-app | xargs -r docker stop
  docker ps -a --format "{{.Names}}" | grep portfolio-app | xargs -r docker rm
  
  echo "Starting a new container on port 80..."
  TIMESTAMP=$(date +%Y%m%d%H%M%S)
  CONTAINER_NAME="portfolio-app-${TIMESTAMP}"
  
  docker run -d --name ${CONTAINER_NAME} \
    -p 80:80 \
    -v /opt/portfolio:/var/www/html \
    -e WEB_DOCUMENT_ROOT=/var/www/html/public \
    -e APP_ENV=production \
    -e APP_DEBUG=true \
    -e APP_URL=https://harun.dev \
    -e DB_CONNECTION=pgsql \
    -e DB_HOST=db \
    -e DB_PORT=5432 \
    -e DB_DATABASE=portfolio \
    -e DB_USERNAME=portfolio \
    -e DB_PASSWORD=CO601jkELC5h0pDlqVNbSQ== \
    --restart unless-stopped \
    webdevops/php-nginx:8.2-alpine
    
  echo "New container started: ${CONTAINER_NAME}"
fi

# 5. Check firewall status
echo -e "\n=== FIREWALL STATUS ==="
if command -v ufw &> /dev/null; then
  UFW_STATUS=$(ufw status | grep "Status: " || echo "UFW not configured")
  echo "UFW status: $UFW_STATUS"
  
  echo "Ensuring port 80 is allowed..."
  sudo ufw allow 80/tcp
else
  echo "UFW not installed"
fi

# 6. Test local connectivity
echo -e "\n=== LOCAL CONNECTIVITY TESTS ==="
if command -v curl &> /dev/null; then
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 || echo "Connection failed")
  echo "HTTP status on localhost:80: $HTTP_STATUS"
  
  if [[ "$HTTP_STATUS" == "Connection failed" || "$HTTP_STATUS" == "000" ]]; then
    echo "⚠️ Cannot connect to localhost:80"
  elif [[ "$HTTP_STATUS" == "200" ]]; then
    echo "✅ Successfully connected to localhost:80"
  else
    echo "⚠️ Received HTTP status $HTTP_STATUS from localhost:80"
  fi
  
  # Create a simple health check file
  echo "Creating health check file..."
  echo "OK" > /opt/portfolio/public/health.txt
  chmod 644 /opt/portfolio/public/health.txt
  
  HEALTH_CHECK=$(curl -s http://localhost:80/health.txt || echo "Failed to access health check")
  echo "Health check result: $HEALTH_CHECK"
else
  echo "Curl not installed, skipping connectivity test"
fi

# 7. Check logs
echo -e "\n=== RECENT LOGS ==="
RUNNING_CONTAINER=$(docker ps --format "{{.Names}}" | grep portfolio-app | head -n 1)
if [[ -n "$RUNNING_CONTAINER" ]]; then
  echo "Last 10 log lines from container:"
  docker logs --tail 10 $RUNNING_CONTAINER 2>&1 || echo "Failed to get container logs"
fi

echo -e "\n=== CLOUDFLARE CONNECTION TEST ==="
echo "Testing connection to Cloudflare..."
curl -s https://www.cloudflare.com/cdn-cgi/trace || echo "Failed to connect to Cloudflare"

echo -e "\n========== END OF DIAGNOSTIC REPORT =========="
EOF
)

# Run the remote commands
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "$REMOTE_COMMANDS"

echo "Remote diagnostics completed."