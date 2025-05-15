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
LOG_DIR="${APP_DIR}/logs"
# Create log directory if it doesn't exist and ensure we have permission
mkdir -p "$LOG_DIR" 2>/dev/null || {
  echo "Warning: Cannot create log directory at $LOG_DIR, using /tmp for logs instead"
  LOG_DIR="/tmp"
}
# Archive previous ci-deploy.log if it exists
if [ -f "$LOG_DIR/ci-deploy.log" ]; then
  mv "$LOG_DIR/ci-deploy.log" "$LOG_DIR/ci-deploy-$(date '+%Y%m%d-%H%M%S').log" 2>/dev/null || true
fi
LOG_FILE="$LOG_DIR/ci-deploy.log"
exec > >(tee -a "$LOG_FILE") 2>&1

# Load environment variables - check multiple possible locations
ENV_FILES=(
  "$ENV_FILE_PATH" # First check if passed from github-deploy.sh
  "$APP_DIR/.env.deploy"
  "$APP_DIR/docker/.env.deploy"
  "/tmp/.env.deploy"
  "$DEPLOY_DIR/.env.deploy"
)

ENV_FILE_FOUND=false
for env_file in "${ENV_FILES[@]}"; do
  if [ -f "$env_file" ]; then
    echo "Loading environment variables from $env_file"
    set -a
    . "$env_file"
    set +a
    ENV_FILE_FOUND=true
    break
  fi
done

if [ "$ENV_FILE_FOUND" = false ]; then
  echo "Warning: No environment file found. Using environment variables passed directly."
fi

# Validate required environment variables
echo "Validating required environment variables..."

# Determine if we're running in GitHub Actions or locally
if [ "$GITHUB_ACTIONS" == "true" ]; then
  echo "Running in GitHub Actions environment"
  # In GitHub Actions, we don't need SSH variables for the CI script
  REQUIRED_VARS=("POSTGRES_DB" "POSTGRES_USER" "POSTGRES_PASSWORD" "R2_BUCKET_NAME" "R2_S3_ENDPOINT" "R2_ACCESS_KEY_ID" "R2_SECRET_ACCESS_KEY" "CLOUDFLARE_ZONE_ID" "CLOUDFLARE_API_TOKEN")
else
  # For local execution, we need all variables
  REQUIRED_VARS=("POSTGRES_DB" "POSTGRES_USER" "POSTGRES_PASSWORD" "R2_BUCKET_NAME" "R2_S3_ENDPOINT" "R2_ACCESS_KEY_ID" "R2_SECRET_ACCESS_KEY" "CLOUDFLARE_ZONE_ID" "CLOUDFLARE_API_TOKEN")
  
  # Only check for SSH variables if we're not already on the server
  if [ "$(hostname)" != "$REMOTE_HOST" ]; then
    REQUIRED_VARS+=("REMOTE_HOST" "REMOTE_USER" "SSH_KEY")
  fi
fi

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
  # Prepare a command that ensures /opt/deploy exists before executing the actual command
  local original_cmd="$1"
  local prepare_cmd="mkdir -p /opt/deploy 2>/dev/null || true; if [ ! -d '/opt/deploy' ]; then ln -sf ${APP_DIR}/deploy /opt/deploy 2>/dev/null || true; fi; $original_cmd"
  
  # If we're running in GitHub Actions or already on the server, execute locally
  if [ "$GITHUB_ACTIONS" == "true" ] || [ "$(hostname)" == "$REMOTE_HOST" ]; then
    # Execute the command locally
    echo "Executing locally: $original_cmd"
    eval "$prepare_cmd"
  else
    # Execute via SSH
    if [ -z "$SSH_KEY" ]; then
      # No SSH key specified, use agent forwarding
      ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "$prepare_cmd"
    else
      # Use the specified SSH key
      ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "$prepare_cmd"
    fi
  fi
}

# Function to check if a script exists and make it executable
ensure_script_executable() {
  local script_path="$1"
  local script_name=$(basename "$script_path")
  
  if [ -f "$script_path" ]; then
    chmod +x "$script_path"
    return 0
  else
    # Check if the script exists in the deploy/cicd directory
    if [ -f "${SCRIPT_DIR}/${script_name}" ]; then
      echo "Found ${script_name} in ${SCRIPT_DIR}, copying to $(dirname "$script_path")"
      mkdir -p "$(dirname "$script_path")"
      cp "${SCRIPT_DIR}/${script_name}" "$script_path"
      chmod +x "$script_path"
      return 0
    fi
    echo "Error: Script not found at $script_path or ${SCRIPT_DIR}/${script_name}"
    return 1
  fi
}

# 1. Prepare for deployment
step 1 "Preparing for deployment"

# Ensure required directories exist
echo "Ensuring required directories exist..."
mkdir -p "${APP_DIR}/docker/ci"
mkdir -p "${APP_DIR}/deploy"
mkdir -p "${APP_DIR}/deploy/cicd"
mkdir -p "${APP_DIR}/deploy/log"

# Also create /opt/deploy directory which seems to be required
mkdir -p "/opt/deploy" 2>/dev/null || echo "Note: Could not create /opt/deploy directory, but will continue anyway"

# Ensure all CI scripts are executable
ensure_script_executable "${CI_DIR}/prepare-deployment.sh" || fail "Failed to make prepare-deployment.sh executable"
ensure_script_executable "${CI_DIR}/health-check.sh" || fail "Failed to make health-check.sh executable"
ensure_script_executable "${CI_DIR}/switch-traffic.sh" || fail "Failed to make switch-traffic.sh executable"
ensure_script_executable "${CI_DIR}/cleanup.sh" || fail "Failed to make cleanup.sh executable"
ensure_script_executable "${CI_DIR}/rollback.sh" || fail "Failed to make rollback.sh executable"

# Prepare deployment by creating necessary configuration files
echo "Running prepare-deployment script..."

# Check if the prepare-deployment.sh script exists in CI_DIR
if [ -f "${CI_DIR}/prepare-deployment.sh" ] && [ -x "${CI_DIR}/prepare-deployment.sh" ]; then
  TIMESTAMP=$(${CI_DIR}/prepare-deployment.sh)
  if [ $? -ne 0 ]; then
    fail "Failed to prepare deployment using CI_DIR script"
  fi
# Check if our new prepare-deployment.sh script exists in the SCRIPT_DIR
elif [ -f "${SCRIPT_DIR}/prepare-deployment.sh" ]; then
  # Make it executable
  chmod +x "${SCRIPT_DIR}/prepare-deployment.sh"
  # Copy it to CI_DIR
  mkdir -p "${CI_DIR}"
  cp "${SCRIPT_DIR}/prepare-deployment.sh" "${CI_DIR}/"
  # Run it
  TIMESTAMP=$(${CI_DIR}/prepare-deployment.sh)
  if [ $? -ne 0 ]; then
    fail "Failed to prepare deployment using copied script"
  fi
else
  # Create a timestamp manually
  TIMESTAMP=$(date '+%Y%m%d%H%M%S')
  echo "No prepare-deployment.sh script found, using manual timestamp: $TIMESTAMP"
  
  # Create necessary directories
  mkdir -p "${APP_DIR}/docker/ci"
  mkdir -p "${APP_DIR}/deploy"
  mkdir -p "${APP_DIR}/deploy/cicd"
  mkdir -p "${APP_DIR}/deploy/log"
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
  
  # Check if the compose file exists
  if [ ! -f "$compose_file" ]; then
    echo "Warning: Docker Compose file not found at $compose_file"
    
    # Check if we need to create the docker directory
    local docker_dir=$(dirname "$compose_file")
    mkdir -p "$docker_dir"
    
    # Create a minimal docker-compose file
    echo "Creating minimal docker-compose file at $compose_file"
    cat > "$compose_file" << EOF
version: '3.8'

services:
  app_${TIMESTAMP}:
    build:
      context: .
      dockerfile: Dockerfile
    image: portfolio:${TIMESTAMP}
    container_name: portfolio-app-${TIMESTAMP}
    restart: unless-stopped
    volumes:
      - ${APP_DIR}/deploy:${OPT_DEPLOY_DIR:-/opt/deploy}
    networks:
      - portfolio-network

networks:
  portfolio-network:
    driver: bridge
EOF
  fi
  
  # Add OPT_DEPLOY_DIR to environment variables if it's set
  if [ -n "$OPT_DEPLOY_DIR" ] && [ "$OPT_DEPLOY_DIR" != "/opt/deploy" ]; then
    docker_env_vars="$docker_env_vars OPT_DEPLOY_DIR=$OPT_DEPLOY_DIR"
  fi
  
  echo "$docker_env_vars docker-compose -f $compose_file $command"
}

# Function to execute Docker Compose command with proper environment variables
docker_compose_exec() {
  local compose_file="$1"
  local service="$2"
  local command="$3"
  local docker_env_vars=$(get_docker_env_vars)
  
  # Check if the compose file exists
  if [ ! -f "$compose_file" ]; then
    echo "Warning: Docker Compose file not found at $compose_file"
    # Use the docker_compose_run function to create the file if it doesn't exist
    docker_compose_run "$compose_file" "version"
  fi
  
  echo "$docker_env_vars docker-compose -f $compose_file exec -T $service $command"
}

# Determine which deploy directory to use
OPT_DEPLOY_DIR=${OPT_DEPLOY_DIR:-/opt/deploy}

# Check if we're using an alternative directory
if [ "$OPT_DEPLOY_DIR" != "/opt/deploy" ]; then
  echo "Using alternative deploy directory: $OPT_DEPLOY_DIR"
  # Create the directory if it doesn't exist
  execute_ssh "mkdir -p $OPT_DEPLOY_DIR/docker"
  
  # Create a symlink from APP_DIR/deploy to OPT_DEPLOY_DIR if they're different
  if [ "${APP_DIR}/deploy" != "$OPT_DEPLOY_DIR" ]; then
    echo "Creating symlink from $OPT_DEPLOY_DIR to ${APP_DIR}/deploy"
    execute_ssh "ln -sf ${APP_DIR}/deploy $OPT_DEPLOY_DIR 2>/dev/null || true"
  fi
else
  # Try to ensure /opt/deploy directory exists or create a symlink
  if [ ! -d "/opt/deploy" ]; then
    echo "Attempting to create /opt/deploy directory..."
    execute_ssh "sudo mkdir -p /opt/deploy/docker && sudo chown -R $(whoami):$(whoami) /opt/deploy 2>/dev/null || (mkdir -p ~/opt_deploy/docker && ln -sf ~/opt_deploy /opt/deploy 2>/dev/null || echo 'Warning: Could not create /opt/deploy directory')"
  else
    # Ensure the docker directory exists inside /opt/deploy
    execute_ssh "mkdir -p /opt/deploy/docker"
  fi
fi

# Ensure the Docker directory exists in the APP_DIR
execute_ssh "mkdir -p ${APP_DIR}/docker"

# Ensure docker directory exists
mkdir -p "${DOCKER_DIR}"

# Create docker-compose-new.yml if it doesn't exist
if [ ! -f "${DOCKER_DIR}/docker-compose-new.yml" ]; then
  echo "Creating docker-compose-new.yml file..."
  cat > "${DOCKER_DIR}/docker-compose-new.yml" << EOF
version: '3.8'

services:
  app_${TIMESTAMP}:
    build:
      context: .
      dockerfile: Dockerfile
    image: portfolio:${TIMESTAMP}
    container_name: portfolio-app-${TIMESTAMP}
    restart: unless-stopped
    networks:
      - portfolio-network

networks:
  portfolio-network:
    driver: bridge
EOF
fi

# Define the Docker Compose file path
DOCKER_COMPOSE_FILE="${APP_DIR}/docker/docker-compose-new.yml"

# Ensure the Docker Compose file exists
echo "Ensuring Docker Compose file exists at $DOCKER_COMPOSE_FILE"

# Create the Docker Compose file directly on the server
execute_ssh "mkdir -p \"$(dirname $DOCKER_COMPOSE_FILE)\""

# Ensure wait-for-db.sh exists
execute_ssh "mkdir -p ${APP_DIR}/docker"
execute_ssh "if [ ! -f ${APP_DIR}/docker/wait-for-db.sh ]; then
  cat > ${APP_DIR}/docker/wait-for-db.sh << 'EOFSCRIPT'
#!/bin/bash

# Script to wait for the database to be ready
# Usage: ./wait-for-db.sh [host] [port] [timeout]

set -e

HOST=\"\${1:-db}\"
PORT=\"\${2:-5432}\"
TIMEOUT=\"\${3:-60}\"

echo \"Waiting for database at \$HOST:\$PORT to be ready (timeout: \${TIMEOUT}s)...\"

start_time=\$(date +%s)
end_time=\$((start_time + TIMEOUT))

while [ \$(date +%s) -lt \$end_time ]; do
  if nc -z \"\$HOST\" \"\$PORT\" > /dev/null 2>&1; then
    echo \"Database is ready!\"
    exit 0
  fi
  echo \"Database is not ready yet, waiting...\"
  sleep 1
done

echo \"Timed out waiting for database at \$HOST:\$PORT\"
exit 1
EOFSCRIPT
  chmod +x ${APP_DIR}/docker/wait-for-db.sh
fi"

# Create a simple Docker Compose file that doesn't rely on building from source
execute_ssh "cat > $DOCKER_COMPOSE_FILE << 'EOFMARKER'
version: '3.8'

services:
  app:
    image: nginx:alpine
    container_name: portfolio-app-${TIMESTAMP}
    restart: unless-stopped
    volumes:
      - ${APP_DIR}:/var/www/html
      - ${APP_DIR}/docker/nginx.conf:/etc/nginx/conf.d/default.conf
    ports:
      - "80:80"
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
EOFMARKER"

# Prepare Docker configuration
echo "Preparing Docker configuration..."

# Ensure the prepare-docker.sh script is executable
ensure_script_executable "${SCRIPT_DIR}/prepare-docker.sh"

# Run the prepare-docker.sh script to set up Docker configuration
TIMESTAMP=$(execute_ssh "cd $APP_DIR && ${SCRIPT_DIR}/prepare-docker.sh")
if [ $? -ne 0 ]; then
  fail "Failed to prepare Docker configuration"
fi

# Define the Docker Compose file path
DOCKER_COMPOSE_FILE="${APP_DIR}/docker/docker-compose-new.yml"

# Start the containers
DOCKER_UP_CMD=$(docker_compose_run "$DOCKER_COMPOSE_FILE" "up -d")
execute_ssh "cd $APP_DIR && $DOCKER_UP_CMD"

# Check if the new containers started successfully
APP_CONTAINER_NAME="portfolio-app-${TIMESTAMP}"
PHP_CONTAINER_NAME="portfolio-php-${TIMESTAMP}"

# Check if containers are running
APP_CONTAINER_CHECK=$(execute_ssh "cd $APP_DIR && docker ps -q -f name=$APP_CONTAINER_NAME")
PHP_CONTAINER_CHECK=$(execute_ssh "cd $APP_DIR && docker ps -q -f name=$PHP_CONTAINER_NAME")

if [ -z "$APP_CONTAINER_CHECK" ]; then
  fail "Nginx container failed to start. Rolling back..."
  execute_ssh "cd $APP_DIR && ${CI_DIR}/rollback.sh 2>/dev/null || docker-compose -f $DOCKER_COMPOSE_FILE down"
  exit 1
fi

if [ -z "$PHP_CONTAINER_CHECK" ]; then
  fail "PHP container failed to start. Rolling back..."
  execute_ssh "cd $APP_DIR && ${CI_DIR}/rollback.sh 2>/dev/null || docker-compose -f $DOCKER_COMPOSE_FILE down"
  exit 1
fi

# Basic health check
echo "Waiting 10 seconds for containers to initialize..."
sleep 10

# Try a simple curl to check if Nginx is responding
NGINX_CHECK=$(execute_ssh "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080 || echo 'failed'")
if [ "$NGINX_CHECK" = "failed" ] || [ "$NGINX_CHECK" = "000" ]; then
  echo "Warning: Could not connect to Nginx. This might be expected if port 8080 is not accessible."
else
  echo "Nginx responded with status code: $NGINX_CHECK"
fi

success "Containers successfully started"

# 3. Run Laravel artisan commands in the new container
step 3 "Running Laravel artisan commands in the new container"

# Create command variables for each artisan command
CONFIG_CACHE_CMD=$(docker_compose_exec "$DOCKER_COMPOSE_FILE" "php" "php /var/www/html/artisan config:cache")
ROUTE_CACHE_CMD=$(docker_compose_exec "$DOCKER_COMPOSE_FILE" "php" "php /var/www/html/artisan route:cache")
VIEW_CACHE_CMD=$(docker_compose_exec "$DOCKER_COMPOSE_FILE" "php" "php /var/www/html/artisan view:cache")
MIGRATE_CMD=$(docker_compose_exec "$DOCKER_COMPOSE_FILE" "php" "php /var/www/html/artisan migrate --force")
STORAGE_LINK_CMD=$(docker_compose_exec "$DOCKER_COMPOSE_FILE" "php" "sh -c \"if [ ! -L /var/www/html/public/storage ]; then php /var/www/html/artisan storage:link; else echo 'Storage link already exists, skipping creation'; fi\"")


# Execute artisan commands
execute_ssh "cd $APP_DIR && $CONFIG_CACHE_CMD"
execute_ssh "cd $APP_DIR && $ROUTE_CACHE_CMD"
execute_ssh "cd $APP_DIR && $VIEW_CACHE_CMD"
execute_ssh "cd $APP_DIR && $MIGRATE_CMD"
execute_ssh "cd $APP_DIR && $STORAGE_LINK_CMD"

success "Laravel artisan commands executed successfully"

# 4. Verify the new deployment is working
step 4 "Verifying the new deployment"

# Check if the containers are still running
APP_CONTAINER_CHECK=$(execute_ssh "cd $APP_DIR && docker ps -q -f name=$APP_CONTAINER_NAME")
PHP_CONTAINER_CHECK=$(execute_ssh "cd $APP_DIR && docker ps -q -f name=$PHP_CONTAINER_NAME")

if [ -z "$APP_CONTAINER_CHECK" ]; then
  fail "Nginx container is not running. Deployment failed."
  execute_ssh "cd $APP_DIR && docker-compose -f $DOCKER_COMPOSE_FILE down"
  exit 1
fi

if [ -z "$PHP_CONTAINER_CHECK" ]; then
  fail "PHP container is not running. Deployment failed."
  execute_ssh "cd $APP_DIR && docker-compose -f $DOCKER_COMPOSE_FILE down"
  exit 1
fi

# Try a simple curl to check if Nginx is responding
NGINX_CHECK=$(execute_ssh "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080 || echo 'failed'")
if [ "$NGINX_CHECK" = "failed" ] || [ "$NGINX_CHECK" = "000" ]; then
  echo "Warning: Could not connect to Nginx. This might be expected if port 8080 is not accessible."
else
  if [ "$NGINX_CHECK" != "200" ] && [ "$NGINX_CHECK" != "302" ] && [ "$NGINX_CHECK" != "301" ]; then
    echo "Warning: Nginx responded with unexpected status code: $NGINX_CHECK"
  else
    echo "Nginx is responding with status code: $NGINX_CHECK (OK)"
  fi
fi

# Wait a moment to ensure everything is stable
sleep 10

# Final check to ensure containers are still running
APP_CONTAINER_CHECK=$(execute_ssh "cd $APP_DIR && docker ps -q -f name=$APP_CONTAINER_NAME")
PHP_CONTAINER_CHECK=$(execute_ssh "cd $APP_DIR && docker ps -q -f name=$PHP_CONTAINER_NAME")

if [ -z "$APP_CONTAINER_CHECK" ] || [ -z "$PHP_CONTAINER_CHECK" ]; then
  fail "One or more containers stopped running. Deployment failed."
  execute_ssh "cd $APP_DIR && docker-compose -f $DOCKER_COMPOSE_FILE down"
  exit 1
fi

success "New deployment verified successfully"

# 5. Clean up old containers (optional)
step 5 "Cleaning up old containers"

# Find and remove old containers with similar names but different timestamps
OLD_CONTAINERS=$(execute_ssh "docker ps -a --format '{{.Names}}' | grep -v '$APP_CONTAINER_NAME\|$PHP_CONTAINER_NAME' | grep 'portfolio-app\|portfolio-php'")
if [ ! -z "$OLD_CONTAINERS" ]; then
  echo "Found old containers to clean up: $OLD_CONTAINERS"
  for container in $OLD_CONTAINERS; do
    execute_ssh "docker rm -f $container 2>/dev/null || true"
  done
  echo "Old containers cleaned up"
else
  echo "No old containers found to clean up"
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