#!/bin/bash

# Ultra Simple Docker Deployment Script for Laravel Portfolio
# This script uses the absolute simplest approach to deploy the application

set -e

# Get absolute path to script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$DEPLOY_DIR")"

# Load environment variables
if [ -f "$DEPLOY_DIR/.env.deploy" ]; then
  set -a
  . "$DEPLOY_DIR/.env.deploy"
  set +a
fi

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

# Ensure required directories exist with proper permissions
log "Creating required directories with proper permissions..."
execute_ssh "mkdir -p ${APP_DIR}/storage/framework/{sessions,views,cache,cache/data}"
execute_ssh "sudo chown -R www-data:www-data ${APP_DIR}/storage"
execute_ssh "sudo chmod -R 775 ${APP_DIR}/storage"
execute_ssh "sudo find ${APP_DIR}/storage -type d -exec chmod 775 {} \;"
execute_ssh "sudo find ${APP_DIR}/storage -type f -exec chmod 664 {} \;"

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
  # Environment variables are loaded from the .env file on the server \
  --restart unless-stopped \
  webdevops/php-nginx:8.2-alpine"

# Wait for container to start
log "Waiting for container to start..."
sleep 5

# Fix permissions inside the container
log "Fixing permissions inside the container..."
execute_ssh "${DOCKER_CMD} exec ${CONTAINER_NAME} sh -c 'mkdir -p /var/www/html/storage/framework/{sessions,views,cache,cache/data} && chown -R www-data:www-data /var/www/html/storage && chmod -R 775 /var/www/html/storage && find /var/www/html/storage -type d -exec chmod 775 {} \; && find /var/www/html/storage -type f -exec chmod 664 {} \;'"

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