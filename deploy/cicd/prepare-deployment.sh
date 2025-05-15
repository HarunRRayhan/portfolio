#!/bin/bash

# This is a minimal wrapper for docker/ci/prepare-deployment.sh
# It ensures the necessary directories exist and calls the original script

set -e
set -o pipefail

# Get the app directory
APP_DIR="${APP_DIR:-/opt/portfolio}"
DOCKER_DIR="${APP_DIR}/docker"
CI_DIR="${DOCKER_DIR}/ci"
DEPLOY_DIR="${APP_DIR}/deploy"

# Create necessary directories
echo "Ensuring required directories exist..."
mkdir -p "${DOCKER_DIR}/ci"
mkdir -p "${DEPLOY_DIR}/log"

# Check if the original prepare-deployment.sh exists
if [ -f "${CI_DIR}/prepare-deployment.sh" ]; then
  echo "Using prepare-deployment.sh from ${CI_DIR}"
  chmod +x "${CI_DIR}/prepare-deployment.sh"
  TIMESTAMP=$("${CI_DIR}/prepare-deployment.sh")
  exit_code=$?
  
  if [ $exit_code -ne 0 ]; then
    echo "Error: prepare-deployment.sh failed with exit code $exit_code"
    exit $exit_code
  fi
else
  # If the original script doesn't exist, just create a timestamp
  TIMESTAMP=$(date '+%Y%m%d%H%M%S')
  echo "Original script not found. Using timestamp: $TIMESTAMP"
fi

# Output the timestamp for the calling script
echo "${TIMESTAMP}"
exit 0
