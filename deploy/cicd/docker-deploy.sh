#!/bin/bash

# Docker Deployment Script for Laravel Portfolio
# This script deploys the application using a single all-in-one Docker container

set -e
set -o pipefail

# Get absolute path to script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$DEPLOY_DIR")"
APP_DIR="${APP_DIR:-/opt/portfolio}"
DOCKER_DIR="${APP_DIR}/docker"
CI_DIR="${DOCKER_DIR}/ci"

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

# Function to handle failures
fail() {
  echo "❌ ERROR: $1"
  exit 1
}

# Ensure required directories exist
echo "Creating required directories..."
execute_ssh "mkdir -p ${APP_DIR}/docker/ci ${APP_DIR}/storage/framework/{sessions,views,cache,cache/data}"
execute_ssh "chmod -R 777 ${APP_DIR}/storage"

# Create Docker Compose file
echo "Creating Docker Compose file..."
DOCKER_COMPOSE_FILE="${APP_DIR}/docker/docker-compose.yml"

execute_ssh "cat > ${DOCKER_COMPOSE_FILE} << EOF
version: '3.8'

services:
  app:
    image: webdevops/php-nginx:8.2-alpine
    container_name: portfolio-app-${TIMESTAMP}
    restart: unless-stopped
    volumes:
      - ${APP_DIR}:/app
    ports:
      - \"8080:80\"
    environment:
      - WEB_DOCUMENT_ROOT=/app/public
      - PHP_DISPLAY_ERRORS=1
      - PHP_MEMORY_LIMIT=512M
      - PHP_MAX_EXECUTION_TIME=300
      - PHP_POST_MAX_SIZE=50M
      - PHP_UPLOAD_MAX_FILESIZE=50M
EOF"

# Find Docker command
echo "Locating Docker command..."
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
echo "Using Docker command: $DOCKER_CMD"

# Start the container
echo "Starting Docker container..."
execute_ssh "cd ${APP_DIR} && ${DOCKER_CMD} compose -f ${DOCKER_COMPOSE_FILE} up -d || docker-compose -f ${DOCKER_COMPOSE_FILE} up -d"

# Check if container is running
echo "Verifying container is running..."
sleep 10
APP_CONTAINER_CHECK=$(execute_ssh "${DOCKER_CMD} ps -q -f name=portfolio-app-${TIMESTAMP}")
if [ -z "$APP_CONTAINER_CHECK" ]; then
  fail "Container failed to start. Please check Docker logs."
fi

# Check if web server is responding
echo "Checking if web server is responding..."
NGINX_CHECK=$(execute_ssh "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080 || echo 'failed'")
if [ "$NGINX_CHECK" = "failed" ] || [ "$NGINX_CHECK" = "000" ]; then
  echo "Warning: Could not connect to web server. This might be expected if port 8080 is not accessible."
else
  echo "Web server responded with status code: $NGINX_CHECK"
fi

# Clean up old containers
echo "Cleaning up old containers..."
OLD_CONTAINERS=$(execute_ssh "${DOCKER_CMD} ps -a --format '{{.Names}}' | grep -v 'portfolio-app-${TIMESTAMP}' | grep 'portfolio-app'")
if [ ! -z "$OLD_CONTAINERS" ]; then
  for container in $OLD_CONTAINERS; do
    execute_ssh "${DOCKER_CMD} rm -f $container 2>/dev/null || true"
  done
  echo "Old containers cleaned up"
else
  echo "No old containers found to clean up"
fi

echo "✅ Deployment completed successfully!"
exit 0