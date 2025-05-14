#!/bin/bash

# CI/CD Deployment Script for Zero-Downtime Deployment
# This script orchestrates the entire zero-downtime deployment process

set -e
set -o pipefail

# Get absolute path to script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$DEPLOY_DIR")"
APP_DIR="${APP_DIR:-/opt/portfolio}"
DOCKER_DIR="${APP_DIR}/docker"
CI_DIR="${DOCKER_DIR}/ci"

# Set up logging
LOG_DIR="$DEPLOY_DIR/log"
mkdir -p "$LOG_DIR"
# Archive previous ci-deploy.log if it exists
if [ -f "$LOG_DIR/ci-deploy.log" ]; then
  mv "$LOG_DIR/ci-deploy.log" "$LOG_DIR/ci-deploy-$(date '+%Y%m%d-%H%M%S').log"
fi
LOG_FILE="$LOG_DIR/ci-deploy.log"
exec > >(tee -a "$LOG_FILE") 2>&1

# Load environment variables
if [ -f "$DEPLOY_DIR/.env.deploy" ]; then
  set -a
  . "$DEPLOY_DIR/.env.deploy"
  set +a
fi

# Validate required environment variables
echo "Validating required environment variables..."
REQUIRED_VARS=("REMOTE_HOST" "REMOTE_USER" "SSH_KEY" "POSTGRES_DB" "POSTGRES_USER" "POSTGRES_PASSWORD" "R2_BUCKET_NAME" "R2_S3_ENDPOINT" "R2_ACCESS_KEY_ID" "R2_SECRET_ACCESS_KEY" "CLOUDFLARE_ZONE_ID" "CLOUDFLARE_API_TOKEN")
MISSING_VARS=""

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS="$MISSING_VARS $var"
  fi
done

if [ ! -z "$MISSING_VARS" ]; then
  echo "ERROR: Missing required environment variables:$MISSING_VARS"
  echo "Please ensure all required environment variables are set in the .env.deploy file or passed as environment variables."
  exit 1
fi

echo "All required environment variables are present."

# Signature and start time
SCRIPT_START_TIME=$(date +%s)
echo -e "\n==============================================="
echo -e "   🚀 CI/CD Zero-Downtime Deployment Script 🚀"
echo -e "===============================================\n"
echo "Started at: $(date)"

# Helper: Print step header, track and print step time
step() {
  STEP_NUM=$1
  STEP_NAME="$2"
  echo -e "\n+++++++++++++++++++++++++++++++++++++++++++++++"
  printf '+++   STEP %d: %s   +++\n' "$STEP_NUM" "$STEP_NAME"
  echo -e "++++++++++++++++++++++++++++++++++++++++++++++\n"
  STEP_START_TIME=$(date +%s)
}

# Helper: Print success info
success() {
  echo -e "$1"
  STEP_END_TIME=$(date +%s)
  STEP_DURATION=$((STEP_END_TIME - STEP_START_TIME))
  echo -e "Step took $STEP_DURATION seconds.\n"
}

# Helper: Print error info
fail() {
  echo -e "$1"
  STEP_END_TIME=$(date +%s)
  STEP_DURATION=$((STEP_END_TIME - STEP_START_TIME))
  echo -e "Step took $STEP_DURATION seconds.\n"
  exit 1
}

# At the end, print total time
print_total_time() {
  SCRIPT_END_TIME=$(date +%s)
  TOTAL_DURATION=$((SCRIPT_END_TIME - SCRIPT_START_TIME))
  echo -e "\n==============================================="
  echo -e "   🎉 Deployment completed in $TOTAL_DURATION seconds! 🎉"
  echo -e "===============================================\n"
}

# Function to execute SSH commands
execute_ssh() {
  ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "$1"
}

# Function to check if a script exists and make it executable
ensure_script_executable() {
  local script_path="$1"
  if [ ! -f "$script_path" ]; then
    echo "Error: Script not found at $script_path"
    return 1
  fi
  
  chmod +x "$script_path"
  return 0
}

# 1. Prepare for deployment
step 1 "Preparing for deployment"

# Ensure all CI scripts are executable
ensure_script_executable "${CI_DIR}/prepare-deployment.sh" || fail "Failed to make prepare-deployment.sh executable"
ensure_script_executable "${CI_DIR}/health-check.sh" || fail "Failed to make health-check.sh executable"
ensure_script_executable "${CI_DIR}/switch-traffic.sh" || fail "Failed to make switch-traffic.sh executable"
ensure_script_executable "${CI_DIR}/cleanup.sh" || fail "Failed to make cleanup.sh executable"
ensure_script_executable "${CI_DIR}/rollback.sh" || fail "Failed to make rollback.sh executable"

# Prepare deployment by creating necessary configuration files
TIMESTAMP=$(${CI_DIR}/prepare-deployment.sh)
if [ $? -ne 0 ]; then
  fail "Failed to prepare deployment"
fi

echo "Deployment prepared with timestamp: $TIMESTAMP"
success "Deployment preparation completed"

# 2. Build and start the new container
step 2 "Building and starting the new container"

# Function to get Docker environment variables
get_docker_env_vars() {
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
  
  echo "$docker_env_vars docker-compose -f $compose_file $command"
}

# Function to execute Docker Compose command with proper environment variables
docker_compose_exec() {
  local compose_file="$1"
  local service="$2"
  local command="$3"
  local docker_env_vars=$(get_docker_env_vars)
  
  echo "$docker_env_vars docker-compose -f $compose_file exec -T $service $command"
}

# Build the new container
DOCKER_BUILD_CMD=$(docker_compose_run "${DOCKER_DIR}/docker-compose-new.yml" "build --no-cache")
execute_ssh "cd $APP_DIR && $DOCKER_BUILD_CMD"

# Start the new container
DOCKER_UP_CMD=$(docker_compose_run "${DOCKER_DIR}/docker-compose-new.yml" "up -d")
execute_ssh "cd $APP_DIR && $DOCKER_UP_CMD"

# Check if the new container started successfully
NEW_CONTAINER_NAME="app_${TIMESTAMP}"
execute_ssh "cd $APP_DIR && ${CI_DIR}/health-check.sh ${NEW_CONTAINER_NAME} 12 5"
if [ $? -ne 0 ]; then
  fail "New container failed to start or become healthy. Rolling back..."
  execute_ssh "cd $APP_DIR && ${CI_DIR}/rollback.sh"
  exit 1
fi

success "New container successfully built and started"

# 3. Run Laravel artisan commands in the new container
step 3 "Running Laravel artisan commands in the new container"

# Create command variables for each artisan command
CONFIG_CACHE_CMD=$(docker_compose_exec "${DOCKER_DIR}/docker-compose-new.yml" "app_${TIMESTAMP}" "php artisan config:cache")
ROUTE_CACHE_CMD=$(docker_compose_exec "${DOCKER_DIR}/docker-compose-new.yml" "app_${TIMESTAMP}" "php artisan route:cache")
VIEW_CACHE_CMD=$(docker_compose_exec "${DOCKER_DIR}/docker-compose-new.yml" "app_${TIMESTAMP}" "php artisan view:cache")
MIGRATE_CMD=$(docker_compose_exec "${DOCKER_DIR}/docker-compose-new.yml" "app_${TIMESTAMP}" "php artisan migrate --force")
STORAGE_LINK_CMD=$(docker_compose_exec "${DOCKER_DIR}/docker-compose-new.yml" "app_${TIMESTAMP}" "sh -c \"if [ ! -L /var/www/html/public/storage ]; then php artisan storage:link; else echo 'Storage link already exists, skipping creation'; fi\"")

# Execute artisan commands
execute_ssh "cd $APP_DIR && $CONFIG_CACHE_CMD"
execute_ssh "cd $APP_DIR && $ROUTE_CACHE_CMD"
execute_ssh "cd $APP_DIR && $VIEW_CACHE_CMD"
execute_ssh "cd $APP_DIR && $MIGRATE_CMD"
execute_ssh "cd $APP_DIR && $STORAGE_LINK_CMD"

success "Laravel artisan commands executed successfully"

# 4. Switch traffic to the new container
step 4 "Switching traffic to the new container"

execute_ssh "cd $APP_DIR && ${CI_DIR}/switch-traffic.sh ${TIMESTAMP}"
if [ $? -ne 0 ]; then
  fail "Failed to switch traffic to the new container. Rolling back..."
  execute_ssh "cd $APP_DIR && ${CI_DIR}/rollback.sh"
  exit 1
fi

success "Traffic switched to the new container successfully"

# 5. Verify the new deployment
step 5 "Verifying the new deployment"

# Wait for a moment to ensure everything is working
sleep 10

# Check if the new container is still healthy
execute_ssh "cd $APP_DIR && ${CI_DIR}/health-check.sh ${NEW_CONTAINER_NAME} 3 5"
if [ $? -ne 0 ]; then
  fail "New container is not healthy after traffic switch. Rolling back..."
  execute_ssh "cd $APP_DIR && ${CI_DIR}/rollback.sh"
  exit 1
fi

success "New deployment verified successfully"

# 6. Clean up old containers
step 6 "Cleaning up old containers"

execute_ssh "cd $APP_DIR && ${CI_DIR}/cleanup.sh ${TIMESTAMP}"
if [ $? -ne 0 ]; then
  echo "Warning: Failed to clean up old containers. This is not critical, continuing..."
fi

success "Cleanup completed successfully"

# 7. Purge CDN Cache (Cloudflare)
step 7 "Purging CDN Cache (Cloudflare)"
if [ -z "$CLOUDFLARE_ZONE_ID" ] || [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "Skipping Cloudflare CDN purge - missing CLOUDFLARE_ZONE_ID or CLOUDFLARE_API_TOKEN"
  echo "To enable Cloudflare cache purging, add the following to your .env.deploy file:"
  echo "CLOUDFLARE_API_TOKEN=your_api_token"
  echo "CLOUDFLARE_ZONE_ID=your_zone_id"
else
  echo "Attempting to purge Cloudflare cache for zone ID $CLOUDFLARE_ZONE_ID"
  if [ -n "$CLOUDFLARE_API_TOKEN" ]; then
    echo "Using API Token authentication method..."
    RESULT=$(curl -s -X POST \
      "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data '{"purge_everything":true}')

    # Parse JSON properly to check for success
    SUCCESS=$(echo "$RESULT" | grep -o '"success":[^,}]*' | cut -d ':' -f2 | tr -d ' ')
    if [[ "$SUCCESS" == "true" ]]; then
      echo "Cloudflare cache purged successfully!"
    else
      echo "Failed to purge Cloudflare cache. Response: $RESULT"
    fi
  elif [ -n "$CLOUDFLARE_EMAIL" ] && [ -n "$CLOUDFLARE_API_KEY" ]; then
    echo "Using API Key authentication method..."
    RESULT=$(curl -s -X POST \
      "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
      -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
      -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
      -H "Content-Type: application/json" \
      --data '{"purge_everything":true}')

    # Parse JSON properly to check for success
    SUCCESS=$(echo "$RESULT" | grep -o '"success":[^,}]*' | cut -d ':' -f2 | tr -d ' ')
    if [[ "$SUCCESS" == "true" ]]; then
      echo "Cloudflare cache purged successfully!"
    else
      echo "Failed to purge Cloudflare cache. Response: $RESULT"
    fi
  else
    echo "Missing Cloudflare authentication credentials. Please provide either API Token or Email + API Key."
  fi
fi

success "Deployment completed successfully!"

# Print total time
print_total_time

exit 0