#!/bin/bash

# Script to prepare Docker configuration for deployment
# This script creates the necessary Docker configuration files for deployment

set -e
set -o pipefail

# Get absolute path to script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
APP_DIR="$(dirname "$DEPLOY_DIR")"
DOCKER_DIR="${APP_DIR}/docker"
CI_DIR="${DOCKER_DIR}/ci"

# Define Docker command with full path to ensure it's found
DOCKER_CMD="/usr/bin/docker"
# Check if docker exists at the default location
if [ ! -f "$DOCKER_CMD" ]; then
  # Try to find docker in common locations
  if [ -f /usr/local/bin/docker ]; then
    DOCKER_CMD='/usr/local/bin/docker'
  elif [ -f /bin/docker ]; then
    DOCKER_CMD='/bin/docker'
  elif command -v docker >/dev/null 2>&1; then
    DOCKER_CMD='docker'
  else
    echo 'Error: Docker command not found. Please ensure Docker is installed.'
    exit 1
  fi
fi

# Export the Docker command for other scripts
export DOCKER_CMD

# Create timestamp for deployment
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Ensure required directories exist
echo "Ensuring required directories exist..."
mkdir -p "${DOCKER_DIR}/ci"
mkdir -p "${DEPLOY_DIR}/log"

# Define the Docker Compose file path
DOCKER_COMPOSE_FILE="${DOCKER_DIR}/docker-compose-new.yml"

# Ensure the Docker Compose file exists
echo "Creating Docker Compose file at $DOCKER_COMPOSE_FILE"

# Check if the template exists in the CI directory
if [ -f "${CI_DIR}/docker-compose-template.yml" ]; then
  echo "Using Docker Compose template from ${CI_DIR}"
  
  # Use envsubst to replace environment variables in the template
  # First create a temporary file with the variables expanded
  TMP_FILE="/tmp/docker-compose-${TIMESTAMP}.yml"
  export TIMESTAMP
  export APP_DIR
  
  cat "${CI_DIR}/docker-compose-template.yml" | envsubst > "$TMP_FILE"
  mv "$TMP_FILE" "$DOCKER_COMPOSE_FILE"
else
  # Create a basic Docker Compose file if template doesn't exist
  echo "Docker Compose template not found, creating basic configuration"
  cat > "$DOCKER_COMPOSE_FILE" << EOF
version: '3.8'

services:
  app:
    image: nginx:alpine
    container_name: portfolio-app-${TIMESTAMP}
    restart: unless-stopped
    volumes:
      - ${APP_DIR}:/var/www/html
      - ${CI_DIR}/nginx.conf:/etc/nginx/conf.d/default.conf
    ports:
      - "8080:80"
    networks:
      - portfolio-network
  
  php:
    image: php:8.2-fpm-alpine
    container_name: portfolio-php-${TIMESTAMP}
    restart: unless-stopped
    volumes:
      - ${APP_DIR}:/var/www/html
    networks:
      - portfolio-network

networks:
  portfolio-network:
    driver: bridge
EOF
fi

# Ensure the wait-for-db.sh script exists and is executable
if [ ! -f "${CI_DIR}/wait-for-db.sh" ]; then
  echo "Warning: wait-for-db.sh not found in ${CI_DIR}"
else
  chmod +x "${CI_DIR}/wait-for-db.sh"
fi

# Ensure the nginx.conf file exists
if [ ! -f "${CI_DIR}/nginx.conf" ]; then
  echo "Warning: nginx.conf not found in ${CI_DIR}"
fi

echo "Docker configuration prepared successfully"
echo "Docker Compose file: $DOCKER_COMPOSE_FILE"
echo "Timestamp: $TIMESTAMP"

# Save the timestamp to a file for the calling script
echo "${TIMESTAMP}" > "${DOCKER_DIR}/timestamp.txt"
exit 0