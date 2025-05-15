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
    volumes:
      - ${APP_DIR}:/app
    ports:
      - \"8080:80\"
    environment:
      - WEB_DOCUMENT_ROOT=/app/public
      - WEB_DOCUMENT_INDEX=index.php
      - PHP_DISPLAY_ERRORS=1
      - PHP_MEMORY_LIMIT=512M
      - PHP_MAX_EXECUTION_TIME=300
      - PHP_POST_MAX_SIZE=50M
      - PHP_UPLOAD_MAX_FILESIZE=50M
      - APP_ENV=production
      - APP_DEBUG=true
      - APP_URL=http://localhost:8080
      - DB_CONNECTION=pgsql
      - DB_HOST=db
      - DB_PORT=5432
      - DB_DATABASE=\${POSTGRES_DB:-laravel}
      - DB_USERNAME=\${POSTGRES_USER:-laravel}
      - DB_PASSWORD=\${POSTGRES_PASSWORD:-laravel}
      - VIEW_COMPILED_PATH=/app/storage/framework/views
    restart: unless-stopped
    networks:
      - app-network
    command: bash -c "mkdir -p /app/storage/framework/{sessions,views,cache,cache/data} && chmod -R 777 /app/storage && supervisord"

networks:
  app-network:
    driver: bridge
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

# Function to rollback deployment
rollback_deployment() {
  echo "⚠️ Rolling back deployment due to: $1"
  
  # Stop and remove the current container
  execute_ssh "${DOCKER_CMD} rm -f portfolio-app-${TIMESTAMP} 2>/dev/null || true"
  
  # Find the most recent previous app container
  PREVIOUS_CONTAINER=$(execute_ssh "${DOCKER_CMD} ps -a --format '{{.Names}}' | grep 'portfolio-app-' | grep -v 'portfolio-app-${TIMESTAMP}' | sort -r | head -n 1")
  
  if [ -n "$PREVIOUS_CONTAINER" ]; then
    echo "Found previous container: $PREVIOUS_CONTAINER. Restarting it..."
    
    # Start the previous container
    execute_ssh "${DOCKER_CMD} start $PREVIOUS_CONTAINER || true"
    
    # Check if previous container started successfully
    PREV_CONTAINER_CHECK=$(execute_ssh "${DOCKER_CMD} ps -q -f name=$PREVIOUS_CONTAINER")
    
    if [ -n "$PREV_CONTAINER_CHECK" ]; then
      echo "✅ Rollback successful. Previous container is now running."
    else
      echo "❌ Failed to restart previous container. Manual intervention required."
    fi
  else
    echo "❌ No previous containers found for rollback. Manual intervention required."
  fi
  
  exit 1
}

# Check if container is running
echo "Checking if container is running..."
CONTAINER_CHECK=$(execute_ssh "${DOCKER_CMD} ps -q -f name=portfolio-app-${TIMESTAMP}")

if [ -z "$CONTAINER_CHECK" ]; then
  rollback_deployment "Container failed to start or crashed"
fi

# Check if web server is responding
echo "Checking if web server is responding..."
MAX_RETRIES=10
RETRY_COUNT=0
SERVER_UP=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  echo "Attempt $(($RETRY_COUNT + 1))/$MAX_RETRIES: Checking web server status..."
  SERVER_CHECK=$(execute_ssh "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080 || echo 'failed'")
  
  if [ "$SERVER_CHECK" = "200" ] || [ "$SERVER_CHECK" = "302" ] || [ "$SERVER_CHECK" = "301" ]; then
    echo "✅ Web server responded with status code: $SERVER_CHECK"
    SERVER_UP=true
    break
  else
    echo "Web server returned: $SERVER_CHECK. Waiting 10 seconds before retry..."
    # Check container logs to help with debugging
    echo "Container logs:"
    execute_ssh "${DOCKER_CMD} logs --tail 30 portfolio-app-${TIMESTAMP}"
    sleep 10
    RETRY_COUNT=$((RETRY_COUNT + 1))
  fi
done

if [ "$SERVER_UP" != "true" ]; then
  rollback_deployment "Web server is not responding properly after multiple attempts"
fi

# Clean up old containers (keep the most recent 2 for potential rollback)
echo "Cleaning up old containers..."
OLD_CONTAINERS=$(execute_ssh "${DOCKER_CMD} ps -a --format '{{.Names}}' | grep 'portfolio-app-' | grep -v 'portfolio-app-${TIMESTAMP}' | sort -r | tail -n +3")
if [ ! -z "$OLD_CONTAINERS" ]; then
  for container in $OLD_CONTAINERS; do
    echo "Removing old container: $container"
    execute_ssh "${DOCKER_CMD} rm -f $container 2>/dev/null || true"
  done
  echo "Old containers cleaned up"
else
  echo "No old containers to clean up (keeping the 2 most recent for potential rollback)"
fi

echo "✅ Deployment completed successfully!"
exit 0