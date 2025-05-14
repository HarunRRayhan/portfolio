#!/bin/bash

# Health check script for Docker containers
# This script is used to check if a container is healthy

set -e

# Get container name from argument
CONTAINER_NAME=$1
MAX_ATTEMPTS=${2:-12}
DELAY_SECONDS=${3:-5}

if [ -z "$CONTAINER_NAME" ]; then
  echo "Error: Container name not provided"
  echo "Usage: $0 <container_name> [max_attempts] [delay_seconds]"
  exit 1
fi

echo "Checking health of container: $CONTAINER_NAME"
echo "Max attempts: $MAX_ATTEMPTS, Delay: $DELAY_SECONDS seconds"

attempt=1
while [ $attempt -le $MAX_ATTEMPTS ]; do
  echo "Health check attempt $attempt of $MAX_ATTEMPTS..."
  
  # Check if container exists and is running
  if ! docker ps -q -f "name=$CONTAINER_NAME" | grep -q .; then
    echo "Container $CONTAINER_NAME is not running"
    sleep $DELAY_SECONDS
    attempt=$((attempt+1))
    continue
  fi
  
  # Check if container is running
  if [ "$(docker inspect --format='{{.State.Status}}' $CONTAINER_NAME 2>/dev/null)" == "running" ]; then
    # If container has a health check, verify it's healthy
    HEALTH_STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}healthy{{end}}' $CONTAINER_NAME 2>/dev/null)
    
    if [ "$HEALTH_STATUS" == "healthy" ]; then
      echo "Container $CONTAINER_NAME is healthy!"
      exit 0
    else
      echo "Container is running but health status is: $HEALTH_STATUS"
    fi
  else
    echo "Container is not in running state"
  fi
  
  sleep $DELAY_SECONDS
  attempt=$((attempt+1))
done

echo "Container $CONTAINER_NAME failed health check after $MAX_ATTEMPTS attempts."
exit 1