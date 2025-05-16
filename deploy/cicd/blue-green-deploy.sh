#!/bin/bash

# Blue-Green Deployment Script for Laravel Portfolio
# This script implements a zero-downtime deployment using blue-green strategy

set -e
set -o pipefail

# Get absolute path to script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$DEPLOY_DIR")"
APP_DIR="${APP_DIR:-/opt/portfolio}"
DOCKER_DIR="${APP_DIR}/docker"
CI_DIR="${DOCKER_DIR}/ci"
NGINX_PROXY_PORT=8080
APP_PORT_BLUE=9000
APP_PORT_GREEN=9001
HEALTH_CHECK_PATH="/health"
HEALTH_CHECK_TIMEOUT=60
HEALTH_CHECK_INTERVAL=5

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

# Function to log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
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

# Determine current active environment (blue or green)
log "Determining current active environment..."
CURRENT_CONTAINER=$(execute_ssh "${DOCKER_CMD} ps --filter 'name=portfolio-app-' --filter 'status=running' --format '{{.Names}}' | head -n 1")

if [[ "$CURRENT_CONTAINER" == *"-blue" ]]; then
  CURRENT_ENV="blue"
  NEW_ENV="green"
  CURRENT_PORT=$APP_PORT_BLUE
  NEW_PORT=$APP_PORT_GREEN
elif [[ "$CURRENT_CONTAINER" == *"-green" ]]; then
  CURRENT_ENV="green"
  NEW_ENV="blue"
  CURRENT_PORT=$APP_PORT_GREEN
  NEW_PORT=$APP_PORT_BLUE
else
  # Default to blue if no container is running
  CURRENT_ENV="green"
  NEW_ENV="blue"
  CURRENT_PORT=$APP_PORT_GREEN
  NEW_PORT=$APP_PORT_BLUE
  log "No active container found. Starting with $NEW_ENV environment."
fi

NEW_CONTAINER="portfolio-app-${NEW_ENV}-${TIMESTAMP}"
log "Current environment: $CURRENT_ENV, New environment: $NEW_ENV"
log "New container name: $NEW_CONTAINER"

# Create Nginx configuration for blue-green switching
log "Creating Nginx proxy configuration..."
execute_ssh "cat > ${APP_DIR}/docker/ci/nginx-proxy.conf << EOF
server {
    listen 80;
    server_name localhost;

    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }

    location / {
        proxy_pass http://127.0.0.1:${NEW_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF"

# Start Nginx proxy if not already running
PROXY_CONTAINER=$(execute_ssh "${DOCKER_CMD} ps --filter 'name=portfolio-nginx-proxy' --filter 'status=running' --format '{{.ID}}'")
if [ -z "$PROXY_CONTAINER" ]; then
  log "Starting Nginx proxy container..."
  execute_ssh "${DOCKER_CMD} run -d --name portfolio-nginx-proxy \
    -p ${NGINX_PROXY_PORT}:80 \
    -v ${APP_DIR}/docker/ci/nginx-proxy.conf:/etc/nginx/conf.d/default.conf:ro \
    --restart unless-stopped \
    nginx:1.25-alpine"
fi

# Start the new environment container
log "Starting new $NEW_ENV environment container..."
execute_ssh "${DOCKER_CMD} run -d --name ${NEW_CONTAINER} \
  -p ${NEW_PORT}:80 \
  -v ${APP_DIR}:/app \
  -e WEB_DOCUMENT_ROOT=/app/public \
  -e WEB_DOCUMENT_INDEX=index.php \
  -e PHP_DISPLAY_ERRORS=1 \
  -e PHP_MEMORY_LIMIT=512M \
  -e PHP_MAX_EXECUTION_TIME=300 \
  -e PHP_POST_MAX_SIZE=50M \
  -e PHP_UPLOAD_MAX_FILESIZE=50M \
  -e APP_ENV=production \
  -e APP_DEBUG=true \
  -e APP_URL=http://localhost:${NGINX_PROXY_PORT} \
  -e DB_CONNECTION=pgsql \
  -e DB_HOST=db \
  -e DB_PORT=5432 \
  -e DB_DATABASE=${POSTGRES_DB:-laravel} \
  -e DB_USERNAME=${POSTGRES_USER:-laravel} \
  -e DB_PASSWORD=${POSTGRES_PASSWORD:-laravel} \
  -e VIEW_COMPILED_PATH=/app/storage/framework/views \
  --restart unless-stopped \
  webdevops/php-nginx:8.2-alpine \
  bash -c 'mkdir -p /app/storage/framework/{sessions,views,cache,cache/data} && chmod -R 777 /app/storage && supervisord'"

# Wait for container to start
log "Waiting for container to start..."
sleep 10

# Check if new container is running
NEW_CONTAINER_CHECK=$(execute_ssh "${DOCKER_CMD} ps -q -f name=${NEW_CONTAINER}")
if [ -z "$NEW_CONTAINER_CHECK" ]; then
  log "New container failed to start. Checking logs..."
  execute_ssh "${DOCKER_CMD} logs ${NEW_CONTAINER}"
  fail "New container failed to start. Deployment aborted."
fi

# Health check for the new environment
log "Performing health checks on new environment..."
HEALTH_CHECK_START_TIME=$(date +%s)
HEALTH_CHECK_END_TIME=$((HEALTH_CHECK_START_TIME + HEALTH_CHECK_TIMEOUT))
HEALTH_CHECK_SUCCESS=false

while [ $(date +%s) -lt $HEALTH_CHECK_END_TIME ]; do
  log "Checking health of new container... ($(( $(date +%s) - HEALTH_CHECK_START_TIME ))s elapsed)"
  HEALTH_STATUS=$(execute_ssh "curl -s -o /dev/null -w '%{http_code}' http://localhost:${NEW_PORT}${HEALTH_CHECK_PATH} || echo 'failed'")
  
  if [ "$HEALTH_STATUS" = "200" ] || [ "$HEALTH_STATUS" = "302" ] || [ "$HEALTH_STATUS" = "301" ]; then
    log "✅ Health check passed with status code: $HEALTH_STATUS"
    HEALTH_CHECK_SUCCESS=true
    break
  else
    log "Health check returned: $HEALTH_STATUS. Waiting ${HEALTH_CHECK_INTERVAL} seconds before retry..."
    sleep $HEALTH_CHECK_INTERVAL
  fi
done

if [ "$HEALTH_CHECK_SUCCESS" != "true" ]; then
  log "❌ Health check failed after ${HEALTH_CHECK_TIMEOUT} seconds. Rolling back..."
  execute_ssh "${DOCKER_CMD} stop ${NEW_CONTAINER} || true"
  execute_ssh "${DOCKER_CMD} rm ${NEW_CONTAINER} || true"
  fail "Health check failed. Deployment aborted."
fi

# Switch traffic to the new environment
log "Switching traffic to the new $NEW_ENV environment..."
execute_ssh "cat > ${APP_DIR}/docker/ci/nginx-proxy.conf << EOF
server {
    listen 80;
    server_name localhost;

    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }

    location / {
        proxy_pass http://127.0.0.1:${NEW_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF"

# Reload Nginx proxy configuration
log "Reloading Nginx proxy configuration..."
execute_ssh "${DOCKER_CMD} exec portfolio-nginx-proxy nginx -s reload"

# Verify the switch was successful
log "Verifying the switch was successful..."
sleep 5
SWITCH_CHECK=$(execute_ssh "curl -s -o /dev/null -w '%{http_code}' http://localhost:${NGINX_PROXY_PORT} || echo 'failed'")
if [ "$SWITCH_CHECK" = "200" ] || [ "$SWITCH_CHECK" = "302" ] || [ "$SWITCH_CHECK" = "301" ]; then
  log "✅ Switch successful. New environment is now serving traffic."
else
  log "⚠️ Switch verification returned: $SWITCH_CHECK. This might indicate an issue."
fi

# Stop the old environment container if it exists
if [ -n "$CURRENT_CONTAINER" ]; then
  log "Stopping old $CURRENT_ENV environment container..."
  execute_ssh "${DOCKER_CMD} stop $CURRENT_CONTAINER || true"
fi

# Clean up old containers (keep the most recent 2 for potential rollback)
log "Cleaning up old containers..."
OLD_CONTAINERS=$(execute_ssh "${DOCKER_CMD} ps -a --format '{{.Names}}' | grep 'portfolio-app-' | grep -v ${NEW_CONTAINER} | sort -r | tail -n +3")
if [ ! -z "$OLD_CONTAINERS" ]; then
  for container in $OLD_CONTAINERS; do
    log "Removing old container: $container"
    execute_ssh "${DOCKER_CMD} rm -f $container 2>/dev/null || true"
  done
  log "Old containers cleaned up"
else
  log "No old containers to clean up (keeping the 2 most recent for potential rollback)"
fi

log "✅ Blue-Green deployment completed successfully!"
log "New environment ($NEW_ENV) is now active at http://localhost:${NGINX_PROXY_PORT}"
exit 0