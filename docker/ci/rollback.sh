#!/bin/bash

# Rollback script for Docker-based deployments
# This script is used to rollback to the previous deployment if the new one fails

set -e

# Get absolute path to script directory
APP_DIR="${APP_DIR:-/opt/portfolio}"
DOCKER_DIR="${APP_DIR}/docker"
DEPLOY_DIR="${APP_DIR}/deploy"

# Set up logging
LOG_DIR="${DEPLOY_DIR}/log"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/rollback.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "==============================================="
echo "   🔄 Starting Rollback Process 🔄"
echo "==============================================="
echo "Started at: $(date)"

# Function to get Docker environment variables
get_docker_env_vars() {
  # Load environment variables from .env file
  if [ -f "${APP_DIR}/.env" ]; then
    set -a
    source "${APP_DIR}/.env"
    set +a
  fi
  
  echo "POSTGRES_DB=$POSTGRES_DB \
  POSTGRES_USER=$POSTGRES_USER \
  POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
  MIN_APP_INSTANCES=$MIN_APP_INSTANCES \
  MAX_APP_INSTANCES=$MAX_APP_INSTANCES \
  APP_CPU_LIMIT=$APP_CPU_LIMIT \
  APP_MEMORY_LIMIT=$APP_MEMORY_LIMIT \
  NGINX_CPU_LIMIT=$NGINX_CPU_LIMIT \
  NGINX_MEMORY_LIMIT=$NGINX_MEMORY_LIMIT \
  DB_CPU_LIMIT=$DB_CPU_LIMIT \
  DB_MEMORY_LIMIT=$DB_MEMORY_LIMIT \
  MAX_APP_CPU_LIMIT=$MAX_APP_CPU_LIMIT \
  MAX_APP_MEMORY_LIMIT=$MAX_APP_MEMORY_LIMIT \
  MAX_NGINX_CPU_LIMIT=$MAX_NGINX_CPU_LIMIT \
  MAX_NGINX_MEMORY_LIMIT=$MAX_NGINX_MEMORY_LIMIT \
  MAX_DB_CPU_LIMIT=$MAX_DB_CPU_LIMIT \
  MAX_DB_MEMORY_LIMIT=$MAX_DB_MEMORY_LIMIT"
}

# Function to run Docker Compose command with proper environment variables
docker_compose_run() {
  local compose_file="$1"
  local command="$2"
  local docker_env_vars=$(get_docker_env_vars)
  
  eval "$docker_env_vars docker-compose -f $compose_file $command"
}

# 1. Check if backup files exist
echo "Step 1: Checking for backup files"

if [ ! -f "${DOCKER_DIR}/docker-compose.yml.backup" ] || [ ! -f "${DOCKER_DIR}/nginx.conf.backup" ]; then
  echo "Error: Backup files not found. Cannot perform rollback."
  exit 1
fi

echo "Backup files found. Proceeding with rollback."

# 2. Restore the original configuration files
echo "Step 2: Restoring original configuration files"

cp "${DOCKER_DIR}/docker-compose.yml.backup" "${DOCKER_DIR}/docker-compose.yml"
cp "${DOCKER_DIR}/nginx.conf.backup" "${DOCKER_DIR}/nginx.conf"

echo "Original configuration files restored."

# 3. Restart the original container
echo "Step 3: Restarting the original container"

# Start the original container
docker_compose_run "${DOCKER_DIR}/docker-compose.yml" "up -d"

echo "Original container restarted."

# 4. Reload nginx configuration
echo "Step 4: Reloading nginx configuration"

docker exec $(docker ps -qf "name=nginx") nginx -s reload

echo "Nginx configuration reloaded."

# 5. Clean up any new containers
echo "Step 5: Cleaning up new containers"

# Get the list of app containers that are not the original one
NEW_CONTAINERS=$(docker ps -a --format "{{.Names}}" | grep "app_" || true)

if [ -n "$NEW_CONTAINERS" ]; then
  echo "Found new containers to clean up: $NEW_CONTAINERS"
  
  for container in $NEW_CONTAINERS; do
    # Skip the original container
    if [ "$container" != "app" ]; then
      echo "Stopping and removing container: $container"
      docker stop "$container" || true
      docker rm "$container" || true
    fi
  done
else
  echo "No new containers found to clean up."
fi

# 6. Clean up temporary files
echo "Step 6: Cleaning up temporary files"

rm -f "${DOCKER_DIR}/docker-compose-new.yml"
rm -f "${DOCKER_DIR}/nginx-new.conf"
rm -f "${DOCKER_DIR}/docker-compose.yml.backup"
rm -f "${DOCKER_DIR}/nginx.conf.backup"

echo "Temporary files cleaned up."

echo "==============================================="
echo "   ✅ Rollback Process Completed ✅"
echo "==============================================="
echo "Completed at: $(date)"

exit 0