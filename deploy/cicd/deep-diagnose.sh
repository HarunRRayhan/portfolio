#!/bin/bash

# Deep Diagnostic Script for Cloudflare 521 Errors
# This script performs a thorough analysis of the server configuration

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
echo "========== DEEP DIAGNOSTIC REPORT =========="

# Install necessary tools
echo "Installing necessary diagnostic tools..."
sudo apt-get update
sudo apt-get install -y net-tools curl netcat

# Check server's public IP
echo -e "\n=== SERVER IP ADDRESS ==="
PUBLIC_IP=$(curl -s https://api.ipify.org)
echo "Server public IP: $PUBLIC_IP"

# Check if Docker is running
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

# Check Docker containers
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

# Check port bindings in detail
echo -e "\n=== DETAILED PORT BINDINGS ==="
echo "Checking netstat output for port 80..."
sudo netstat -tuln | grep ":80 " || echo "Port 80 not in use according to netstat"

echo "Checking Docker port mappings..."
docker ps --format "{{.Names}}: {{.Ports}}" | grep portfolio-app || echo "No port mappings found for portfolio containers"

echo "Testing if port 80 is actually listening..."
nc -zv localhost 80 || echo "Port 80 is not accepting connections"

# Check Docker container network settings
echo -e "\n=== DOCKER CONTAINER NETWORK ==="
if [[ "$RUNNING_CONTAINER" != "No running portfolio container" ]]; then
  echo "Inspecting container network settings..."
  docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $RUNNING_CONTAINER
  
  echo "Checking container port bindings..."
  docker inspect --format='{{json .HostConfig.PortBindings}}' $RUNNING_CONTAINER
fi

# Check if the application is actually running inside the container
echo -e "\n=== CONTAINER APPLICATION STATUS ==="
if [[ "$RUNNING_CONTAINER" != "No running portfolio container" ]]; then
  echo "Checking if Nginx is running inside the container..."
  docker exec $RUNNING_CONTAINER ps aux | grep nginx || echo "Nginx not running in container"
  
  echo "Checking if PHP-FPM is running inside the container..."
  docker exec $RUNNING_CONTAINER ps aux | grep php-fpm || echo "PHP-FPM not running in container"
  
  echo "Checking Nginx configuration..."
  docker exec $RUNNING_CONTAINER cat /opt/docker/etc/nginx/vhost.conf || echo "Cannot read Nginx configuration"
fi

# Restart the container with verbose output
echo -e "\n=== RESTARTING CONTAINER WITH PROPER CONFIGURATION ==="
echo "Stopping all existing containers..."
docker ps -a --format "{{.Names}}" | grep portfolio-app | xargs -r docker stop
docker ps -a --format "{{.Names}}" | grep portfolio-app | xargs -r docker rm

echo "Starting a new container with proper configuration..."
TIMESTAMP=$(date +%Y%m%d%H%M%S)
CONTAINER_NAME="portfolio-app-${TIMESTAMP}"

docker run -d --name ${CONTAINER_NAME} \
  -p 80:80 \
  -v /opt/portfolio:/var/www/html \
  -e WEB_DOCUMENT_ROOT=/var/www/html/public \
  -e WEB_DOCUMENT_INDEX=index.php \
  -e PHP_DISPLAY_ERRORS=1 \
  -e PHP_MEMORY_LIMIT=512M \
  -e PHP_MAX_EXECUTION_TIME=300 \
  -e PHP_POST_MAX_SIZE=50M \
  -e PHP_UPLOAD_MAX_FILESIZE=50M \
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

# Wait for container to initialize
echo "Waiting for container to initialize..."
sleep 10

# Check if the new container is running
echo "Verifying new container is running..."
docker ps | grep ${CONTAINER_NAME} || echo "⚠️ New container failed to start"

# Check if port 80 is now bound
echo "Checking if port 80 is now bound..."
sudo netstat -tuln | grep ":80 " || echo "⚠️ Port 80 still not in use"

# Test local connectivity
echo -e "\n=== LOCAL CONNECTIVITY TESTS ==="
echo "Testing connection to localhost:80..."
curl -v http://localhost:80/ || echo "⚠️ Failed to connect to localhost:80"

# Create a simple health check file
echo "Creating health check file..."
echo "OK" > /opt/portfolio/public/health.txt
chmod 644 /opt/portfolio/public/health.txt

echo "Testing health check..."
curl -v http://localhost:80/health.txt || echo "⚠️ Failed to access health check"

# Check logs from the new container
echo -e "\n=== CONTAINER LOGS ==="
echo "Last 20 log lines from new container:"
docker logs --tail 20 ${CONTAINER_NAME} 2>&1 || echo "Failed to get container logs"

# Check if there are any firewall issues
echo -e "\n=== FIREWALL STATUS ==="
if command -v ufw &> /dev/null; then
  echo "UFW status:"
  sudo ufw status
  
  echo "Ensuring port 80 is allowed..."
  sudo ufw allow 80/tcp
else
  echo "UFW not installed"
fi

# Check AWS security group settings
echo -e "\n=== AWS SECURITY GROUP CHECK ==="
if command -v aws &> /dev/null; then
  echo "Checking AWS CLI availability..."
  aws --version
  
  echo "This would require AWS credentials to check security groups"
else
  echo "AWS CLI not installed, can't check security groups"
  echo "Please verify in AWS Console that the security group allows inbound traffic on port 80"
fi

# Test external connectivity
echo -e "\n=== EXTERNAL CONNECTIVITY TEST ==="
echo "Testing connection from external service..."
echo "Server IP: $PUBLIC_IP"
echo "You can test external connectivity by running: curl -v http://$PUBLIC_IP/"

# Check Cloudflare connection
echo -e "\n=== CLOUDFLARE CONNECTION TEST ==="
echo "Testing connection to Cloudflare..."
curl -s https://www.cloudflare.com/cdn-cgi/trace || echo "Failed to connect to Cloudflare"

echo -e "\n========== END OF DEEP DIAGNOSTIC REPORT =========="
EOF
)

# Run the remote commands
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "$REMOTE_COMMANDS"

echo "Deep diagnostics completed."