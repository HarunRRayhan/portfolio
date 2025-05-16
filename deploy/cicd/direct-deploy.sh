#!/bin/bash

# Direct Docker Deployment Script for Laravel Portfolio
# This script uses the simplest possible approach to deploy the application

set -e

# Get absolute path to script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$DEPLOY_DIR")"
APP_DIR="${APP_DIR:-/opt/portfolio}"
PORT=80

# Create timestamp for deployment
TIMESTAMP=$(date +%Y%m%d%H%M%S)
CONTAINER_NAME="portfolio-app-${TIMESTAMP}"

# Function to execute commands via SSH if needed
execute_ssh() {
  local command="$1"
  if [ "$GITHUB_ACTIONS" == "true" ] || [ "$(hostname)" == "$REMOTE_HOST" ]; then
    eval "$command"
  else
    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "$command"
  fi
}

# Function to log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Ensure required directories exist
log "Creating required directories..."
execute_ssh "mkdir -p ${APP_DIR}/storage/framework/{sessions,views,cache,cache/data}"
execute_ssh "chmod -R 777 ${APP_DIR}/storage"

# Find Docker command
log "Locating Docker command..."
DOCKER_CMD=$(execute_ssh "command -v docker || echo not-found")
if [ "$DOCKER_CMD" = "not-found" ]; then
  for path in /usr/bin/docker /usr/local/bin/docker /bin/docker; do
    if execute_ssh "[ -f $path ]"; then
      DOCKER_CMD=$path
      break
    fi
  done
  if [ "$DOCKER_CMD" = "not-found" ]; then
    log "Docker command not found. Please ensure Docker is installed."
    exit 1
  fi
fi
log "Using Docker command: $DOCKER_CMD"

# Stop and remove any container using the same port
log "Checking for containers using port ${PORT}..."
PORT_CHECK=$(execute_ssh "netstat -tuln | grep :${PORT} || true")
if [ -n "$PORT_CHECK" ]; then
  log "Port ${PORT} is in use. Stopping containers using this port..."
  OLD_CONTAINERS=$(execute_ssh "${DOCKER_CMD} ps -a --format '{{.Names}}' | grep 'portfolio-app-'")
  for container in $OLD_CONTAINERS; do
    log "Stopping container: $container"
    execute_ssh "${DOCKER_CMD} stop $container || true"
    execute_ssh "${DOCKER_CMD} rm $container || true"
  done
fi

# Copy our custom Nginx configuration
log "Copying custom Nginx configuration..."
execute_ssh "mkdir -p ${APP_DIR}/docker/ci"
execute_ssh "cat > ${APP_DIR}/docker/ci/production-nginx.conf << 'EOL'
$(cat ${SCRIPT_DIR}/production-nginx.conf)
EOL"

# Start the new container
log "Starting new container: ${CONTAINER_NAME}..."
execute_ssh "${DOCKER_CMD} run -d --name ${CONTAINER_NAME} \
  -p ${PORT}:80 \
  -v ${APP_DIR}:/app \
  -v ${APP_DIR}/docker/ci/production-nginx.conf:/opt/docker/etc/nginx/vhost.conf \
  -e WEB_DOCUMENT_ROOT=/app/public \
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
  -e DB_DATABASE=${POSTGRES_DB:-laravel} \
  -e DB_USERNAME=${POSTGRES_USER:-laravel} \
  -e DB_PASSWORD=${POSTGRES_PASSWORD:-laravel} \
  -e VIEW_COMPILED_PATH=/app/storage/framework/views \
  --restart unless-stopped \
  webdevops/php-nginx:8.2-alpine"

# Wait for container to start
log "Waiting for container to start..."
sleep 10

# Verify container is running
CONTAINER_CHECK=$(execute_ssh "${DOCKER_CMD} ps -q -f name=${CONTAINER_NAME}")
if [ -z "$CONTAINER_CHECK" ]; then
  log "Container failed to start. Checking logs..."
  execute_ssh "${DOCKER_CMD} logs ${CONTAINER_NAME}"
  log "Deployment failed."
  exit 1
else
  log "Container is running successfully."
fi

# Clean up old containers (keep the most recent 3 for potential rollback)
log "Cleaning up old containers..."
OLD_CONTAINERS=$(execute_ssh "${DOCKER_CMD} ps -a --format '{{.Names}}' | grep 'portfolio-app-' | grep -v ${CONTAINER_NAME} | sort -r | tail -n +4")
if [ ! -z "$OLD_CONTAINERS" ]; then
  for container in $OLD_CONTAINERS; do
    log "Removing old container: $container"
    execute_ssh "${DOCKER_CMD} rm -f $container 2>/dev/null || true"
  done
  log "Old containers cleaned up"
else
  log "No old containers to clean up"
fi

log "✅ Deployment completed successfully!"
log "Container is running at http://localhost:${PORT}"
exit 0