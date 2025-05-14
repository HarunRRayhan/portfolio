#!/bin/bash

# Switch traffic script for zero-downtime deployment
# This script switches traffic from the old container to the new one

set -e

# Get absolute path to script directory
APP_DIR="${APP_DIR:-/opt/portfolio}"
DOCKER_DIR="${APP_DIR}/docker"
DEPLOY_DIR="${APP_DIR}/deploy"

# Set up logging
LOG_DIR="${DEPLOY_DIR}/log"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/switch-traffic.log"
exec > >(tee -a "$LOG_FILE") 2>&1

# Get the timestamp from the first argument
TIMESTAMP=$1

if [ -z "$TIMESTAMP" ]; then
  echo "Error: Timestamp not provided"
  echo "Usage: $0 <timestamp>"
  exit 1
fi

echo "==============================================="
echo "   🔄 Switching Traffic to New Container 🔄"
echo "==============================================="
echo "Started at: $(date)"
echo "Using timestamp: $TIMESTAMP"

# 1. Create a new nginx configuration file that points to the new container
echo "Step 1: Creating new nginx configuration"

# Check if nginx template exists
if [ ! -f "${DOCKER_DIR}/nginx-template.conf" ]; then
  echo "Error: Nginx template file not found at ${DOCKER_DIR}/nginx-template.conf"
  exit 1
fi

# Create a new nginx.conf file from the template
cp "${DOCKER_DIR}/nginx-template.conf" "${DOCKER_DIR}/nginx-new.conf"

# Replace TIMESTAMP placeholder with actual timestamp if needed
sed -i "s/TIMESTAMP/${TIMESTAMP}/g" "${DOCKER_DIR}/nginx-new.conf"

echo "New nginx configuration created"

# 2. Backup the current nginx.conf
echo "Step 2: Backing up current nginx configuration"

if [ -f "${DOCKER_DIR}/nginx.conf" ]; then
  cp "${DOCKER_DIR}/nginx.conf" "${DOCKER_DIR}/nginx.conf.backup"
  echo "Current nginx configuration backed up to ${DOCKER_DIR}/nginx.conf.backup"
else
  echo "Warning: Current nginx configuration not found at ${DOCKER_DIR}/nginx.conf"
  echo "Proceeding without backup"
fi

# 3. Replace the current nginx.conf with the new one
echo "Step 3: Replacing current nginx configuration with new one"

cp "${DOCKER_DIR}/nginx-new.conf" "${DOCKER_DIR}/nginx.conf"
echo "Nginx configuration replaced"

# 4. Reload nginx configuration
echo "Step 4: Reloading nginx configuration"

NGINX_CONTAINER=$(docker ps -qf "name=nginx")
if [ -z "$NGINX_CONTAINER" ]; then
  echo "Error: Nginx container not found"
  exit 1
fi

docker exec $NGINX_CONTAINER nginx -s reload
echo "Nginx configuration reloaded"

# 5. Verify the new configuration
echo "Step 5: Verifying new configuration"

# Wait for a moment to ensure everything is working
sleep 5

# Check if the new container is still running
NEW_CONTAINER="app_${TIMESTAMP}"
if ! docker ps -q -f "name=${NEW_CONTAINER}" | grep -q .; then
  echo "Error: New container ${NEW_CONTAINER} is not running"
  echo "Rolling back to previous configuration"
  
  # Restore the original nginx configuration
  if [ -f "${DOCKER_DIR}/nginx.conf.backup" ]; then
    cp "${DOCKER_DIR}/nginx.conf.backup" "${DOCKER_DIR}/nginx.conf"
    docker exec $NGINX_CONTAINER nginx -s reload
    echo "Rolled back to previous configuration"
  fi
  
  exit 1
fi

echo "New configuration verified successfully"

echo "==============================================="
echo "   ✅ Traffic Switch Completed ✅"
echo "==============================================="
echo "Completed at: $(date)"

exit 0