#!/bin/bash

# Simple Docker Deployment Script for Laravel Portfolio
# This script implements a zero-downtime deployment using a blue-green strategy

set -e
set -o pipefail

# Get absolute path to script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$DEPLOY_DIR")"
APP_DIR="${APP_DIR:-/opt/portfolio}"
DOCKER_DIR="${APP_DIR}/docker"
CI_DIR="${DOCKER_DIR}/ci"
PORT=8080

# Create timestamp for deployment
TIMESTAMP=$(date +%Y%m%d%H%M%S)
export TIMESTAMP

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

# Function to handle failures
fail() {
  log "❌ ERROR: $1"
  exit 1
}

# Ensure required directories exist
log "Creating required directories..."
execute_ssh "mkdir -p ${APP_DIR}/docker/ci ${APP_DIR}/storage/framework/{sessions,views,cache,cache/data}"
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
    fail "Docker command not found. Please ensure Docker is installed."
  fi
fi
log "Using Docker command: $DOCKER_CMD"

# Get the currently active container
CURRENT_CONTAINER=$(execute_ssh "${DOCKER_CMD} ps --filter 'name=portfolio-app-' --filter 'status=running' --format '{{.Names}}' | head -n 1")
log "Current active container: ${CURRENT_CONTAINER:-None}"

# Create a new container name with timestamp
NEW_CONTAINER="portfolio-app-${TIMESTAMP}"
log "New container name: $NEW_CONTAINER"

# Start the new container
log "Starting new container..."
execute_ssh "${DOCKER_CMD} run -d --name ${NEW_CONTAINER} \
  -p ${PORT}:80 \
  -v ${APP_DIR}:/app \
  -e WEB_DOCUMENT_ROOT=/app/public \
  -e WEB_DOCUMENT_INDEX=index.php \
  -e PHP_DISPLAY_ERRORS=1 \
  -e PHP_MEMORY_LIMIT=512M \
  -e PHP_MAX_EXECUTION_TIME=300 \
  -e PHP_POST_MAX_SIZE=50M \
  -e PHP_UPLOAD_MAX_FILESIZE=50M \
  # Environment variables are loaded from the .env file on the server \
  -e VIEW_COMPILED_PATH=/app/storage/framework/views \
  --restart unless-stopped \
  webdevops/php-nginx:8.2-alpine \
  bash -c 'mkdir -p /app/storage/framework/{sessions,views,cache,cache/data} && chmod -R 777 /app/storage && supervisord'"

# Wait for container to start
log "Waiting for container to start..."
sleep 15

# Check if container is running
NEW_CONTAINER_CHECK=$(execute_ssh "${DOCKER_CMD} ps -q -f name=${NEW_CONTAINER}")
if [ -z "$NEW_CONTAINER_CHECK" ]; then
  log "Container failed to start. Checking logs..."
  execute_ssh "${DOCKER_CMD} logs ${NEW_CONTAINER}"
  fail "Container failed to start. Deployment aborted."
fi

# Health check
log "Performing health checks..."
MAX_RETRIES=10
RETRY_COUNT=0
HEALTH_CHECK_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  log "Health check attempt $(($RETRY_COUNT + 1))/$MAX_RETRIES..."
  HEALTH_STATUS=$(execute_ssh "curl -s -o /dev/null -w '%{http_code}' http://localhost:${PORT} || echo 'failed'")
  
  if [ "$HEALTH_STATUS" = "200" ] || [ "$HEALTH_STATUS" = "302" ] || [ "$HEALTH_STATUS" = "301" ]; then
    log "✅ Health check passed with status code: $HEALTH_STATUS"
    HEALTH_CHECK_SUCCESS=true
    break
  else
    log "Health check returned: $HEALTH_STATUS. Waiting 5 seconds before retry..."
    execute_ssh "${DOCKER_CMD} logs --tail 20 ${NEW_CONTAINER}"
    sleep 5
    RETRY_COUNT=$((RETRY_COUNT + 1))
  fi
done

if [ "$HEALTH_CHECK_SUCCESS" != "true" ]; then
  log "❌ Health check failed after multiple attempts. Rolling back..."
  execute_ssh "${DOCKER_CMD} stop ${NEW_CONTAINER} || true"
  execute_ssh "${DOCKER_CMD} rm ${NEW_CONTAINER} || true"
  
  if [ -n "$CURRENT_CONTAINER" ]; then
    log "Ensuring previous container is running..."
    PREV_CONTAINER_STATUS=$(execute_ssh "${DOCKER_CMD} ps -q -f name=$CURRENT_CONTAINER")
    if [ -z "$PREV_CONTAINER_STATUS" ]; then
      execute_ssh "${DOCKER_CMD} start $CURRENT_CONTAINER || true"
    fi
  fi
  
  fail "Health check failed. Deployment aborted."
fi

# If we have a previous container, stop it
if [ -n "$CURRENT_CONTAINER" ]; then
  log "Stopping previous container: $CURRENT_CONTAINER"
  execute_ssh "${DOCKER_CMD} stop $CURRENT_CONTAINER || true"
fi

# Clean up old containers (keep the most recent 3 for potential rollback)
log "Cleaning up old containers..."
OLD_CONTAINERS=$(execute_ssh "${DOCKER_CMD} ps -a --format '{{.Names}}' | grep 'portfolio-app-' | grep -v ${NEW_CONTAINER} | sort -r | tail -n +4")
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
log "New container is running at http://localhost:${PORT}"
exit 0