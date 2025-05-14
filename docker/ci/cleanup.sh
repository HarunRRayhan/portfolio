#!/bin/bash

# Cleanup script for zero-downtime deployment
# This script cleans up old containers after a successful deployment

set -e

# Get absolute path to script directory
APP_DIR="${APP_DIR:-/opt/portfolio}"
DOCKER_DIR="${APP_DIR}/docker"
DEPLOY_DIR="${APP_DIR}/deploy"

# Set up logging
LOG_DIR="${DEPLOY_DIR}/log"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/cleanup.log"
exec > >(tee -a "$LOG_FILE") 2>&1

# Get the timestamp of the current deployment from the first argument
CURRENT_TIMESTAMP=$1

if [ -z "$CURRENT_TIMESTAMP" ]; then
  echo "Error: Current timestamp not provided"
  echo "Usage: $0 <current_timestamp>"
  exit 1
fi

echo "==============================================="
echo "   🧹 Cleaning Up Old Containers 🧹"
echo "==============================================="
echo "Started at: $(date)"
echo "Current deployment timestamp: $CURRENT_TIMESTAMP"

# 1. Find all app containers except the current one
echo "Step 1: Finding old app containers"

# Get a list of all app containers
ALL_APP_CONTAINERS=$(docker ps -a --format "{{.Names}}" | grep "^app" || true)

# Filter out the current container
OLD_CONTAINERS=""
for container in $ALL_APP_CONTAINERS; do
  if [ "$container" != "app_${CURRENT_TIMESTAMP}" ]; then
    OLD_CONTAINERS="$OLD_CONTAINERS $container"
  fi
done

if [ -z "$OLD_CONTAINERS" ]; then
  echo "No old containers found to clean up"
else
  echo "Found old containers to clean up: $OLD_CONTAINERS"
  
  # 2. Stop and remove old containers
  echo "Step 2: Stopping and removing old containers"
  
  for container in $OLD_CONTAINERS; do
    echo "Stopping and removing container: $container"
    docker stop "$container" || true
    docker rm "$container" || true
  done
  
  echo "Old containers removed"
fi

# 3. Clean up temporary files
echo "Step 3: Cleaning up temporary files"

# Remove temporary files
rm -f "${DOCKER_DIR}/docker-compose-new.yml" || true
rm -f "${DOCKER_DIR}/nginx-new.conf" || true
rm -f "${DOCKER_DIR}/nginx-template.conf" || true

# Keep backup files for a potential rollback
echo "Keeping backup files for potential rollback"

echo "Temporary files cleaned up"

# 4. Update the main docker-compose.yml to use the current container name
echo "Step 4: Updating main docker-compose.yml"

# Backup the current docker-compose.yml if not already done
if [ ! -f "${DOCKER_DIR}/docker-compose.yml.backup" ]; then
  cp "${DOCKER_DIR}/docker-compose.yml" "${DOCKER_DIR}/docker-compose.yml.backup"
fi

# Update the main docker-compose.yml to use the current container name
# This is a more complex sed operation to handle multiple occurrences and different patterns
sed -i "s/app:/app_${CURRENT_TIMESTAMP}:/g" "${DOCKER_DIR}/docker-compose.yml"
sed -i "s/- app$/- app_${CURRENT_TIMESTAMP}/g" "${DOCKER_DIR}/docker-compose.yml"
sed -i "s/- app /- app_${CURRENT_TIMESTAMP} /g" "${DOCKER_DIR}/docker-compose.yml"

echo "Main docker-compose.yml updated"

echo "==============================================="
echo "   ✅ Cleanup Completed ✅"
echo "==============================================="
echo "Completed at: $(date)"

exit 0