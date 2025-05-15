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

# Check if we need to rebuild the Docker image or use an existing one
echo "Checking for existing Docker image..."
IMAGE_EXISTS=$(execute_ssh "${DOCKER_CMD:-docker} images -q portfolio-app:latest 2>/dev/null")
REBUILD_NEEDED="false"

# Check if source code has changed since last build
if [ -n "$IMAGE_EXISTS" ]; then
  echo "Found existing Docker image. Using existing image without rebuilding."
else
  echo "No existing Docker image found. Building new image..."
  REBUILD_NEEDED="true"
fi

# Build Docker image if needed
if [ "$REBUILD_NEEDED" = "true" ]; then
  echo "Building Docker image using the production Dockerfile..."
  execute_ssh "cd ${APP_DIR} && ${DOCKER_CMD:-docker} build -t portfolio-app:latest -f docker/Dockerfile ."
  if [ $? -ne 0 ]; then
    echo "Failed to build Docker image. Aborting deployment."
    exit 1
  fi
fi

# Create Docker Compose file
echo "Creating Docker Compose file..."
DOCKER_COMPOSE_FILE="${APP_DIR}/docker/docker-compose.yml"

execute_ssh "cat > ${DOCKER_COMPOSE_FILE} << EOF
version: '3.8'

services:
  app:
    image: portfolio-app:latest
    container_name: portfolio-app-${TIMESTAMP}
    volumes:
      - ${APP_DIR}/.env:/var/www/html/.env
      - ${APP_DIR}/storage:/var/www/html/storage
    environment:
      - APP_ENV=production
      - APP_DEBUG=false
      - APP_URL=https://harun.dev
      - DB_CONNECTION=pgsql
      - DB_HOST=db
      - DB_PORT=5432
      - DB_DATABASE=\${POSTGRES_DB:-laravel}
      - DB_USERNAME=\${POSTGRES_USER:-laravel}
      - DB_PASSWORD=\${POSTGRES_PASSWORD:-laravel}
      - VIEW_COMPILED_PATH=/var/www/html/storage/framework/views
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:1.25-alpine
    container_name: portfolio-nginx-${TIMESTAMP}
    volumes:
      - ${APP_DIR}/docker/ci/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ${APP_DIR}/public:/var/www/html/public:ro
    ports:
      - \"8080:80\"
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network

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
  
  # Stop and remove the current containers
  execute_ssh "${DOCKER_CMD} rm -f portfolio-app-${TIMESTAMP} portfolio-nginx-${TIMESTAMP} 2>/dev/null || true"
  
  # Find the most recent previous app container timestamp
  PREVIOUS_TIMESTAMP=$(execute_ssh "${DOCKER_CMD} ps -a --format '{{.Names}}' | grep 'portfolio-app-' | grep -v 'portfolio-app-${TIMESTAMP}' | sort -r | head -n 1 | sed 's/portfolio-app-//'")
  
  if [ -n "$PREVIOUS_TIMESTAMP" ]; then
    echo "Found previous deployment with timestamp: $PREVIOUS_TIMESTAMP. Restarting it..."
    
    # Start both app and nginx containers from previous deployment
    execute_ssh "${DOCKER_CMD} start portfolio-app-$PREVIOUS_TIMESTAMP portfolio-nginx-$PREVIOUS_TIMESTAMP || true"
    
    # Check if previous containers started successfully
    PREV_APP_CHECK=$(execute_ssh "${DOCKER_CMD} ps -q -f name=portfolio-app-$PREVIOUS_TIMESTAMP")
    PREV_NGINX_CHECK=$(execute_ssh "${DOCKER_CMD} ps -q -f name=portfolio-nginx-$PREVIOUS_TIMESTAMP")
    
    if [ -n "$PREV_APP_CHECK" ] && [ -n "$PREV_NGINX_CHECK" ]; then
      echo "✅ Rollback successful. Previous containers are now running."
    elif [ -n "$PREV_APP_CHECK" ]; then
      echo "⚠️ Partial rollback: App container is running, but Nginx container failed to start."
    elif [ -n "$PREV_NGINX_CHECK" ]; then
      echo "⚠️ Partial rollback: Nginx container is running, but App container failed to start."
    else
      echo "❌ Failed to restart previous containers. Manual intervention required."
    fi
  else
    echo "❌ No previous containers found for rollback. Manual intervention required."
  fi
  
  exit 1
}

# Check if both containers are running
echo "Checking if both app and nginx containers are running..."
APP_CONTAINER_CHECK=$(execute_ssh "${DOCKER_CMD} ps -q -f name=portfolio-app-${TIMESTAMP}")
NGINX_CONTAINER_CHECK=$(execute_ssh "${DOCKER_CMD} ps -q -f name=portfolio-nginx-${TIMESTAMP}")

if [ -z "$APP_CONTAINER_CHECK" ]; then
  rollback_deployment "App container failed to start or crashed"
fi

if [ -z "$NGINX_CONTAINER_CHECK" ]; then
  rollback_deployment "Nginx container failed to start or crashed"
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
    echo "App container logs:"
    execute_ssh "${DOCKER_CMD} logs --tail 20 portfolio-app-${TIMESTAMP}"
    echo "Nginx container logs:"
    execute_ssh "${DOCKER_CMD} logs --tail 20 portfolio-nginx-${TIMESTAMP}"
    sleep 10
    RETRY_COUNT=$((RETRY_COUNT + 1))
  fi
done

if [ "$SERVER_UP" != "true" ]; then
  rollback_deployment "Web server is not responding properly after multiple attempts"
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