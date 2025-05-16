#!/bin/bash

# Ultra Simple Docker Deployment Script for Laravel Portfolio
# This script uses the absolute simplest approach to deploy the application

set -e

# Get absolute path to script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$DEPLOY_DIR")"
APP_DIR="${APP_DIR:-/opt/portfolio}"

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

# Stop all existing portfolio containers
log "Stopping all existing portfolio containers..."
OLD_CONTAINERS=$(execute_ssh "${DOCKER_CMD} ps -a --format '{{.Names}}' | grep 'portfolio-app-' || true")
if [ -n "$OLD_CONTAINERS" ]; then
  for container in $OLD_CONTAINERS; do
    log "Stopping and removing container: $container"
    execute_ssh "${DOCKER_CMD} stop $container 2>/dev/null || true"
    execute_ssh "${DOCKER_CMD} rm $container 2>/dev/null || true"
  done
fi

# Create timestamp for deployment
TIMESTAMP=$(date +%Y%m%d%H%M%S)
CONTAINER_NAME="portfolio-app-${TIMESTAMP}"

# Start the new container using a simple pre-built image
log "Starting new container: ${CONTAINER_NAME}..."
execute_ssh "${DOCKER_CMD} run -d --name ${CONTAINER_NAME} \
  -p 80:80 \
  -v ${APP_DIR}:/var/www/html \
  -e WEB_DOCUMENT_ROOT=/var/www/html/public \
  -e APP_ENV=production \
  -e APP_DEBUG=true \
  -e APP_URL=https://harun.dev \
  -e DB_CONNECTION=pgsql \
  -e DB_HOST=db \
  -e DB_PORT=5432 \
  -e DB_DATABASE=${POSTGRES_DB:-laravel} \
  -e DB_USERNAME=${POSTGRES_USER:-laravel} \
  -e DB_PASSWORD=${POSTGRES_PASSWORD:-laravel} \
  --restart unless-stopped \
  webdevops/php-nginx:8.2-alpine"

# Wait for container to start
log "Waiting for container to start..."
sleep 5

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

# Run the container directly on port 80 instead of port forwarding
log "Container will listen directly on port 80 instead of using port forwarding..."
# We'll handle this by changing the port mapping in the docker run command

log "✅ Deployment completed successfully!"
log "Container is running at http://localhost:80"
exit 0