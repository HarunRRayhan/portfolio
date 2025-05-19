#!/bin/bash

# Ultra Simple Docker Deployment Script for Laravel Portfolio
# This script uses the absolute simplest approach to deploy the application

set -e

# Get absolute path to script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$DEPLOY_DIR")"

# Load environment variables from .env.deploy if running locally
# When running in GitHub Actions, environment variables are passed directly
if [ "$GITHUB_ACTIONS" != "true" ] && [ -f "$DEPLOY_DIR/.env.deploy" ]; then
  echo "Loading environment variables from $DEPLOY_DIR/.env.deploy"
  set -a
  . "$DEPLOY_DIR/.env.deploy"
  set +a
fi

# Set default values for required variables if not provided
APP_DIR="${APP_DIR:-/opt/portfolio}"
DB_CONNECTION="${DB_CONNECTION:-pgsql}"
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_DATABASE="${DB_DATABASE:-portfolio}"
DB_USERNAME="${DB_USERNAME:-portfolio}"
DB_PASSWORD="${DB_PASSWORD:-password}"
APP_ENV="${APP_ENV:-production}"
APP_DEBUG="${APP_DEBUG:-false}"
APP_URL="${APP_URL:-https://harun.dev}"

# Use timestamp from GitHub Actions if available, otherwise generate one
TIMESTAMP="${DEPLOY_TIMESTAMP:-$(date +%Y%m%d%H%M%S)}"

# Print environment information (without sensitive data)
echo "Deployment Environment: ${APP_ENV}"
echo "Application URL: ${APP_URL}"
echo "Database Connection: ${DB_CONNECTION}"
echo "Database Host: ${DB_HOST}"
echo "Database Port: ${DB_PORT}"
echo "Database Name: ${DB_DATABASE}"
echo "Application Directory: ${APP_DIR}"

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

# Container name with timestamp
CONTAINER_NAME="portfolio-app-${TIMESTAMP}"

# Create .env file content for Laravel
log "Creating .env file content for Laravel..."
ENV_CONTENT=$(cat << EOF
APP_NAME="${APP_NAME}"
APP_ENV=${APP_ENV}
APP_KEY=${APP_KEY}
APP_DEBUG=${APP_DEBUG}
APP_URL=${APP_URL}

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=${DB_CONNECTION}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_DATABASE=${DB_DATABASE}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}

CLOUDFLARE_ZONE_ID=${CLOUDFLARE_ZONE_ID}
CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}

R2_BUCKET_NAME=${R2_BUCKET_NAME}
R2_S3_ENDPOINT=${R2_S3_ENDPOINT}
R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}
R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}

SESSION_DRIVER=file
SESSION_LIFETIME=120

CACHE_DRIVER=file

QUEUE_CONNECTION=sync
EOF
)

# Write .env file to server
log "Writing .env file to server..."
execute_ssh "echo '$ENV_CONTENT' > ${APP_DIR}/.env"

# Start the new container using a simple pre-built image
log "Starting new container: ${CONTAINER_NAME}..."
execute_ssh "${DOCKER_CMD} run -d --name ${CONTAINER_NAME} \
  -p 80:80 \
  -v ${APP_DIR}:/var/www/html \
  -e WEB_DOCUMENT_ROOT=/var/www/html/public \
  -e PHP_MAX_EXECUTION_TIME=300 \
  -e PHP_POST_MAX_SIZE=50M \
  -e PHP_UPLOAD_MAX_FILESIZE=50M \
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