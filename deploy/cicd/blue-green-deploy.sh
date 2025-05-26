#!/bin/bash

# Blue-Green Zero-Downtime Deployment Script
# Usage: ./blue-green-deploy.sh [target_env]
# If target_env is not specified, it will automatically determine the opposite of current active environment

set -e
set -o pipefail

# Get absolute path to script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$DEPLOY_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
log() {
  echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
  echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

error() {
  echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

warning() {
  echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ $1${NC}"
}

# Function to download .env.deploy and SSH key from S3
download_deploy_files_from_s3() {
  log "Downloading .env.deploy and SSH key from S3..."
  
  # First, try to load basic AWS credentials from local .env.deploy if it exists
  if [ -f "$DEPLOY_DIR/.env.deploy" ]; then
    local aws_access_key=$(grep '^AWS_ACCESS_KEY_ID=' "$DEPLOY_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"' || true)
    local aws_secret_key=$(grep '^AWS_SECRET_ACCESS_KEY=' "$DEPLOY_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"' || true)
    local config_bucket=$(grep '^CONFIG_BUCKET_NAME=' "$DEPLOY_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"' || true)
  fi
  
  # Use environment variables if available (from GitHub Actions)
  aws_access_key=${AWS_ACCESS_KEY_ID:-$aws_access_key}
  aws_secret_key=${AWS_SECRET_ACCESS_KEY:-$aws_secret_key}
  config_bucket=${CONFIG_BUCKET_NAME:-$config_bucket}
  
  if [ -z "$aws_access_key" ] || [ -z "$aws_secret_key" ] || [ -z "$config_bucket" ]; then
    warning "Missing AWS credentials or CONFIG_BUCKET_NAME, using local files"
    return 1
  fi
  
  export AWS_ACCESS_KEY_ID="$aws_access_key"
  export AWS_SECRET_ACCESS_KEY="$aws_secret_key"
  export CONFIG_BUCKET_NAME="$config_bucket"
  
  # Download .env.deploy from S3
  if aws s3 cp "s3://$config_bucket/secrets/envs/docker/.env" "$DEPLOY_DIR/.env.deploy.s3" 2>/dev/null; then
    success "Successfully downloaded .env.deploy from S3"
    mv "$DEPLOY_DIR/.env.deploy.s3" "$DEPLOY_DIR/.env.deploy"
  else
    warning "Failed to download .env.deploy from S3, using local file if available"
  fi
  
  # Download SSH key from S3
  if aws s3 cp "s3://$config_bucket/key/ssh/portfolio-key.pem" "$DEPLOY_DIR/portfolio-key.pem.s3" 2>/dev/null; then
    success "Successfully downloaded SSH key from S3"
    mv "$DEPLOY_DIR/portfolio-key.pem.s3" "$DEPLOY_DIR/portfolio-key.pem"
    chmod 600 "$DEPLOY_DIR/portfolio-key.pem"
  else
    warning "Failed to download SSH key from S3, using local file if available"
  fi
}

# Download deployment files from S3 before loading environment variables
download_deploy_files_from_s3

# Load environment variables
if [ -f "$DEPLOY_DIR/.env.deploy" ]; then
  set -a
  . "$DEPLOY_DIR/.env.deploy"
  set +a
fi

# Always resolve SSH_KEY to absolute path after loading .env.deploy
if [ -n "$SSH_KEY" ] && [[ "$SSH_KEY" != /* ]]; then
  SSH_KEY="$DEPLOY_DIR/$SSH_KEY"
fi
export SSH_KEY

# Function to execute SSH commands
execute_ssh() {
  local command="$1"
  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$PUBLIC_IP" "$command"
}

# Function to check Node.js version and install if needed
ensure_node_version() {
  local min_version=${MIN_NODE_VERSION:-18}
  local preferred_version=${PREFERRED_NODE_VERSION:-"lts"}
  
  # Get current Node.js version
  get_node_major_version() {
    node -v 2>/dev/null | sed 's/v//;s/\..*//' || echo "0"
  }

  local current_version=$(get_node_major_version)
  log "Current Node.js version: $(node -v 2>/dev/null || echo 'not installed')"
  log "Required minimum version: ${min_version}"

  # If current version is sufficient, we're done
  if [ "$current_version" -ge "$min_version" ]; then
    success "Node.js version check passed: $(node -v)"
    return 0
  fi

  error "Node.js >= ${min_version} is required. Current version is insufficient."
  return 1
}

# Function to build frontend assets locally
build_frontend_assets() {
  log "Building frontend assets locally..."
  
  # Check Node.js version
  if ! ensure_node_version; then
    error "Node.js version check failed"
    return 1
  fi
  
  cd "$REPO_ROOT"
  
  # Empty out public/build/assets if it exists
  if [ -d "public/build/assets" ]; then
    log "Emptying public/build/assets before build..."
    rm -rf public/build/assets/*
  fi

  # Backup existing .env file if it exists
  if [ -f "$REPO_ROOT/.env" ]; then
    log "Backing up existing .env file..."
    cp "$REPO_ROOT/.env" "$REPO_ROOT/.env.backup"
  fi

  # Copy .env.appprod to .env for the build process
  if [ -f "$DEPLOY_DIR/.env.appprod" ]; then
    cp "$DEPLOY_DIR/.env.appprod" "$REPO_ROOT/.env"
  else
    warning ".env.appprod not found, using .env.example"
    cp "$REPO_ROOT/.env.example" "$REPO_ROOT/.env"
  fi

  # Build assets
  npm ci && npm run build
  local build_status=$?

  # Restore the original .env file if backup exists
  if [ -f "$REPO_ROOT/.env.backup" ]; then
    log "Restoring original .env file..."
    cp "$REPO_ROOT/.env.backup" "$REPO_ROOT/.env"
    rm "$REPO_ROOT/.env.backup"
  else
    # Remove the .env file if no backup existed
    rm -f "$REPO_ROOT/.env"
  fi

  cd "$SCRIPT_DIR"
  
  if [ $build_status -ne 0 ]; then
    error "Frontend build failed"
    return 1
  fi
  
  success "Frontend built successfully"
  return 0
}

# Function to upload static assets to Cloudflare R2
upload_assets_to_r2() {
  log "Uploading static assets to Cloudflare R2..."
  
  if [ -z "$R2_BUCKET_NAME" ] || [ -z "$R2_S3_ENDPOINT" ] || [ -z "$R2_ACCESS_KEY_ID" ] || [ -z "$R2_SECRET_ACCESS_KEY" ]; then
    error "R2 configuration missing. Required: R2_BUCKET_NAME, R2_S3_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY"
    return 1
  fi

  # Set R2 credentials
  export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
  export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"

  # Upload build assets with proper content types
  log "Uploading build assets with proper content types..."
  aws s3 sync "$REPO_ROOT/public/build" "s3://$R2_BUCKET_NAME/build" --endpoint-url "$R2_S3_ENDPOINT" --delete --acl public-read

  # Upload JS files with proper content type
  log "Setting proper content types for JavaScript files..."
  find "$REPO_ROOT/public/build" -name "*.js" -type f | while read -r file; do
    relative_path="${file#$REPO_ROOT/public/}"
    aws s3 cp "$file" "s3://$R2_BUCKET_NAME/$relative_path" --endpoint-url "$R2_S3_ENDPOINT" --content-type "application/javascript" --acl public-read
  done

  # Upload CSS files with proper content type
  log "Setting proper content types for CSS files..."
  find "$REPO_ROOT/public/build" -name "*.css" -type f | while read -r file; do
    relative_path="${file#$REPO_ROOT/public/}"
    aws s3 cp "$file" "s3://$R2_BUCKET_NAME/$relative_path" --endpoint-url "$R2_S3_ENDPOINT" --content-type "text/css" --acl public-read
  done

  # Upload other static assets
  aws s3 sync "$REPO_ROOT/public/fonts" "s3://$R2_BUCKET_NAME/fonts" --endpoint-url "$R2_S3_ENDPOINT" --delete --acl public-read
  aws s3 sync "$REPO_ROOT/public/images" "s3://$R2_BUCKET_NAME/images" --endpoint-url "$R2_S3_ENDPOINT" --delete --acl public-read

  # Restore original AWS credentials if they were set
  if [ -n "$CONFIG_AWS_ACCESS_KEY_ID" ]; then
    export AWS_ACCESS_KEY_ID="$CONFIG_AWS_ACCESS_KEY_ID"
  fi
  if [ -n "$CONFIG_AWS_SECRET_ACCESS_KEY" ]; then
    export AWS_SECRET_ACCESS_KEY="$CONFIG_AWS_SECRET_ACCESS_KEY"
  fi

  success "Static assets uploaded to Cloudflare R2"
  return 0
}

# Function to determine current active environment
get_current_environment() {
  log "Determining current active environment..."
  
  # Query Traefik API to see which service is currently active
  local current_service=$(execute_ssh "curl -s http://localhost:8080/api/rawdata 2>/dev/null | jq -r '.http.services | to_entries[] | select(.value.loadBalancer.servers[0].url | contains(\"nginx_\")) | .key' | head -1" 2>/dev/null || echo "")
  
  if [[ "$current_service" == "web-blue" ]]; then
    echo "blue"
  elif [[ "$current_service" == "web-green" ]]; then
    echo "green"
  else
    # Check which containers are actually running
    local blue_running=$(execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml ps php_blue 2>/dev/null | grep -c 'Up'" || echo "0")
    local green_running=$(execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml ps php_green 2>/dev/null | grep -c 'Up'" || echo "0")
    
    if [[ "$green_running" -gt "0" ]]; then
      warning "Traefik routing unclear, but green containers are running - assuming green is active"
      echo "green"
    elif [[ "$blue_running" -gt "0" ]]; then
      warning "Traefik routing unclear, but blue containers are running - assuming blue is active"
      echo "blue"
    else
      warning "No active environment detected, defaulting to blue"
      echo "blue"
    fi
  fi
}

# Function to get target environment
get_target_environment() {
  local current_env="$1"
  if [[ "$current_env" == "blue" ]]; then
    echo "green"
  else
    echo "blue"
  fi
}

# Function to check if containers are running
check_containers_running() {
  local env="$1"
  local php_running=$(execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml ps php_$env 2>/dev/null | grep -c 'Up'" || echo "0")
  local nginx_running=$(execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml ps nginx_$env 2>/dev/null | grep -c 'Up'" || echo "0")
  
  if [[ "$php_running" -gt "0" && "$nginx_running" -gt "0" ]]; then
    return 0
  else
    return 1
  fi
}

# Function to test environment health
test_environment_health() {
  local env="$1"
  log "Testing health of $env environment..."
  
  # Check if containers are running
  if ! check_containers_running "$env"; then
    error "$env environment containers are not running"
    return 1
  fi
  
  # First test if nginx is responding to basic requests
  log "Testing basic nginx connectivity for $env environment..."
  local basic_attempts=0
  local basic_max_attempts=10
  
  while [ $basic_attempts -lt $basic_max_attempts ]; do
    local basic_status=$(execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml exec -T nginx_$env curl -s -o /dev/null -w '%{http_code}' http://localhost:80/ 2>/dev/null" || echo "000")
    
    if [[ "$basic_status" =~ ^[2-3][0-9][0-9]$ ]]; then
      log "Basic nginx connectivity confirmed for $env environment (HTTP $basic_status)"
      break
    fi
    
    basic_attempts=$((basic_attempts + 1))
    log "Waiting for basic nginx connectivity... (attempt $basic_attempts/$basic_max_attempts)"
    sleep 3
  done
  
  # Test health endpoint with more detailed debugging
  local attempts=0
  local max_attempts=30
  
  while [ $attempts -lt $max_attempts ]; do
    # Check if health endpoint is responding
    local nginx_status=$(execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml exec -T nginx_$env curl -s -o /dev/null -w '%{http_code}' http://localhost:80/health 2>/dev/null" || echo "000")
    
    if [[ "$nginx_status" == "200" ]]; then
      success "$env environment health check passed"
      return 0
    elif [[ "$nginx_status" == "000" ]]; then
      log "Health check attempt $attempts/$max_attempts for $env environment... (nginx not responding)"
    else
      log "Health check attempt $attempts/$max_attempts for $env environment... (HTTP $nginx_status)"
      
      # If we get a non-200 response, let's check what the actual response is
      if [[ $attempts -eq 5 || $attempts -eq 15 || $attempts -eq 25 ]]; then
        log "=== Debugging HTTP $nginx_status response ==="
        execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml exec -T nginx_$env curl -s http://localhost:80/health" || true
        log "=== End debug response ==="
      fi
    fi
    
    attempts=$((attempts + 1))
    sleep 2
  done
  
  # Final diagnostic attempt
  log "Health check failed, running diagnostics..."
  log "=== Nginx logs ==="
  execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml logs --tail=20 nginx_$env" || true
  log "=== PHP logs ==="
  execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml logs --tail=20 php_$env" || true
  log "=== Container status ==="
  execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml ps php_$env nginx_$env" || true
  log "=== Network connectivity test ==="
  execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml exec -T nginx_$env ping -c 2 php_$env" || true
  log "=== Direct PHP-FPM test ==="
  execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml exec -T nginx_$env nc -zv php_$env 9000" || true
  
  error "Health check failed for $env environment after $max_attempts attempts"
  return 1
}

# Function to switch traffic
switch_traffic() {
  local target_env="$1"
  log "Switching traffic to $target_env environment..."
  
  # Update Traefik dynamic configuration using a safer approach
  execute_ssh "cd /opt/portfolio && sed -i \"s/service: web-blue/service: web-$target_env/g; s/service: web-green/service: web-$target_env/g\" docker/traefik-dynamic.yml"
  
  # Wait for Traefik to pick up the configuration change
  log "Waiting for Traefik to update routing..."
  sleep 10
  
  # Verify the switch was successful
  local attempts=0
  local max_attempts=30
  
  while [ $attempts -lt $max_attempts ]; do
    local active_service=$(execute_ssh "curl -s http://localhost:8080/api/rawdata 2>/dev/null | jq -r '.http.services | to_entries[] | select(.value.loadBalancer.servers[0].url | contains(\"nginx_$target_env\")) | .key' | head -1" 2>/dev/null || echo "")
    
    if [[ "$active_service" == "web-$target_env" ]]; then
      success "Traffic successfully switched to $target_env environment"
      return 0
    fi
    
    attempts=$((attempts + 1))
    log "Waiting for traffic switch... (attempt $attempts/$max_attempts)"
    sleep 2
  done
  
  error "Failed to switch traffic to $target_env environment"
  return 1
}

# Function to deploy to target environment
deploy_to_environment() {
  local target_env="$1"
  log "Deploying to $target_env environment..."
  
  # Pull latest code
  execute_ssh "cd /opt/portfolio && git fetch origin && git reset --hard origin/\$(git rev-parse --abbrev-ref HEAD)"
  
  # Download latest environment files if AWS credentials are available
  if [[ -n "$AWS_ACCESS_KEY_ID" && -n "$AWS_SECRET_ACCESS_KEY" && -n "$CONFIG_BUCKET_NAME" ]]; then
    log "Downloading latest environment files from S3..."
    execute_ssh "cd /opt/portfolio && \
      AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
      AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
      aws s3 cp s3://$CONFIG_BUCKET_NAME/secrets/envs/app/.env .env && \
      aws s3 cp s3://$CONFIG_BUCKET_NAME/secrets/envs/docker/.env docker/.env"
  fi
  
  # Upload remaining public files to server (excluding build, fonts, images)
  log "Uploading remaining public files to server..."
  local tmp_sync_dir="$DEPLOY_DIR/public-server-sync"
  rm -rf "$tmp_sync_dir"
  mkdir -p "$tmp_sync_dir"
  cd "$REPO_ROOT/public"
  find . -maxdepth 1 -type f -exec cp {} "$tmp_sync_dir/" \;
  # Always include manifest.json if it exists in build
  test -f "$REPO_ROOT/public/build/manifest.json" && cp "$REPO_ROOT/public/build/manifest.json" "$tmp_sync_dir/"
  cd "$DEPLOY_DIR"
  tar --no-xattrs -czf public-server-files.tar.gz -C "$tmp_sync_dir" .
  scp -o StrictHostKeyChecking=no -i "$SSH_KEY" public-server-files.tar.gz "$REMOTE_USER@$PUBLIC_IP:/opt/portfolio/public-server-files.tar.gz"
  execute_ssh "mkdir -p /opt/portfolio/public && tar xzf /opt/portfolio/public-server-files.tar.gz -C /opt/portfolio/public && rm /opt/portfolio/public-server-files.tar.gz"
  rm -rf "$tmp_sync_dir" public-server-files.tar.gz
  
  # Build and start target environment containers
  log "Building $target_env environment containers..."
  execute_ssh "cd /opt/portfolio && docker compose -f docker/docker-compose.yml build --no-cache php_$target_env nginx_$target_env"
  
  log "Starting $target_env environment containers..."
  execute_ssh "cd /opt/portfolio && docker compose -f docker/docker-compose.yml up -d php_$target_env nginx_$target_env"
  
  # Wait for containers to be ready
  log "Waiting for $target_env containers to be ready..."
  sleep 30
  
  # Check if containers are actually running before proceeding
  local attempts=0
  local max_attempts=10
  while [ $attempts -lt $max_attempts ]; do
    if check_containers_running "$target_env"; then
      log "$target_env containers are running"
      break
    fi
    attempts=$((attempts + 1))
    log "Waiting for $target_env containers to start... (attempt $attempts/$max_attempts)"
    sleep 5
  done
  
  if ! check_containers_running "$target_env"; then
    error "$target_env containers failed to start properly"
    return 1
  fi
  
  # Run Laravel setup commands
  log "Running Laravel setup on $target_env environment..."
  execute_ssh "cd /opt/portfolio && \
    docker compose -f docker/docker-compose.yml exec -T php_$target_env php artisan config:cache && \
    docker compose -f docker/docker-compose.yml exec -T php_$target_env php artisan route:cache && \
    docker compose -f docker/docker-compose.yml exec -T php_$target_env php artisan view:cache && \
    docker compose -f docker/docker-compose.yml exec -T php_$target_env php artisan migrate --force"
  
  # Create storage link if it doesn't exist
  execute_ssh "cd /opt/portfolio && docker compose -f docker/docker-compose.yml exec -T php_$target_env sh -c 'if [ ! -L /var/www/html/public/storage ]; then php artisan storage:link; fi'"
  
  # Test database connectivity from PHP container
  log "Testing database connectivity from $target_env PHP container..."
  local db_attempts=0
  local db_max_attempts=10
  
  while [ $db_attempts -lt $db_max_attempts ]; do
    if execute_ssh "cd /opt/portfolio && docker compose -f docker/docker-compose.yml exec -T php_$target_env php artisan tinker --execute='DB::connection()->getPdo(); echo \"DB OK\";'" 2>/dev/null | grep -q "DB OK"; then
      success "Database connectivity confirmed for $target_env environment"
      break
    fi
    db_attempts=$((db_attempts + 1))
    log "Waiting for database connectivity... (attempt $db_attempts/$db_max_attempts)"
    sleep 3
  done
  
  if [ $db_attempts -eq $db_max_attempts ]; then
    warning "Database connectivity test failed, but continuing deployment"
  fi
  
  # Wait a bit more for Laravel to be fully ready
  log "Waiting for Laravel application to be ready..."
  sleep 15
  
  success "$target_env environment deployed successfully"
}

# Function to cleanup old environment
cleanup_old_environment() {
  local old_env="$1"
  log "Cleaning up old $old_env environment..."
  
  # Stop old environment containers
  execute_ssh "cd /opt/portfolio && docker compose -f docker/docker-compose.yml stop php_$old_env nginx_$old_env"
  
  # Remove old containers (but keep images for quick rollback)
  execute_ssh "cd /opt/portfolio && docker compose -f docker/docker-compose.yml rm -f php_$old_env nginx_$old_env"
  
  success "Old $old_env environment cleaned up"
}

# Function to rollback
rollback() {
  local current_env="$1"
  local failed_env="$2"
  
  error "Deployment failed, rolling back to $current_env environment"
  
  # Revert Traefik configuration using a safer approach
  execute_ssh "cd /opt/portfolio && sed -i \"s/service: web-$failed_env/service: web-$current_env/g\" docker/traefik-dynamic.yml"
  
  # Ensure current environment is running
  execute_ssh "cd /opt/portfolio && docker compose -f docker/docker-compose.yml up -d php_$current_env nginx_$current_env"
  
  # Stop failed environment
  execute_ssh "cd /opt/portfolio && docker compose -f docker/docker-compose.yml stop php_$failed_env nginx_$failed_env"
  
  success "Rollback completed - traffic restored to $current_env environment"
}

# Function to verify deployment
verify_deployment() {
  log "Verifying deployment..."
  
  # Test public endpoints
  local attempts=0
  local max_attempts=10
  
  # Test HTTP endpoint
  while [ $attempts -lt $max_attempts ]; do
    if curl -f -s "http://$PUBLIC_IP" > /dev/null; then
      success "HTTP endpoint is responding"
      break
    fi
    attempts=$((attempts + 1))
    log "Waiting for HTTP endpoint... (attempt $attempts/$max_attempts)"
    sleep 5
  done
  
  # Test HTTPS endpoint
  attempts=0
  while [ $attempts -lt $max_attempts ]; do
    if curl -f -s "https://harun.dev" > /dev/null; then
      success "HTTPS endpoint is responding"
      break
    fi
    attempts=$((attempts + 1))
    log "Waiting for HTTPS endpoint... (attempt $attempts/$max_attempts)"
    sleep 5
  done
  
  success "Deployment verification completed"
}

# Function to purge CDN cache
purge_cdn_cache() {
  if [[ -n "$CLOUDFLARE_ZONE_ID" && -n "$CLOUDFLARE_API_TOKEN" ]]; then
    log "Purging Cloudflare cache..."
    curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data '{"purge_everything":true}'
    success "CDN cache purged"
  else
    warning "Cloudflare credentials not found, skipping cache purge"
  fi
}

# Function to rotate environments (move green to blue)
rotate_environments() {
  local current_active="$1"
  
  if [[ "$current_active" == "green" ]]; then
    log "Rotating: Moving green containers to blue for next deployment cycle..."
    
    # Stop any existing blue containers
    execute_ssh "cd /opt/portfolio && docker compose -f docker/docker-compose.yml stop php_blue nginx_blue || true"
    execute_ssh "cd /opt/portfolio && docker compose -f docker/docker-compose.yml rm -f php_blue nginx_blue || true"
    
    # Tag current green images as blue
    execute_ssh "cd /opt/portfolio && \
      docker tag \$(docker compose -f docker/docker-compose.yml images -q php_green) portfolio-php_blue:latest && \
      docker tag \$(docker compose -f docker/docker-compose.yml images -q nginx_green) portfolio-nginx_blue:latest"
    
    # Start blue containers with the tagged images
    execute_ssh "cd /opt/portfolio && docker compose -f docker/docker-compose.yml up -d php_blue nginx_blue"
    
    # Wait for blue containers to be ready
    sleep 15
    
    # Test blue environment health
    if test_environment_health "blue"; then
      # Switch traffic to blue
      if switch_traffic "blue"; then
        # Clean up green environment
        cleanup_old_environment "green"
        success "Environment rotation completed: green → blue"
      else
        error "Failed to switch traffic to blue during rotation"
        return 1
      fi
    else
      error "Blue environment health check failed during rotation"
      return 1
    fi
  else
    log "Current active environment is blue, no rotation needed"
  fi
}

# Main deployment function
main() {
  local target_env="$1"
  
  log "🚀 Starting Blue-Green Zero-Downtime Deployment"
  
  # Debug information
  log "Script directory: $SCRIPT_DIR"
  log "Deploy directory: $DEPLOY_DIR"
  log "Repository root: $REPO_ROOT"
  log "SSH key path: $SSH_KEY"
  
  # Validate SSH key
  if [[ ! -f "$SSH_KEY" ]]; then
    error "SSH key not found: $SSH_KEY"
    # List files in deploy directory for debugging
    log "Files in deploy directory:"
    ls -la "$DEPLOY_DIR" || true
    exit 1
  fi
  
  # Validate environment files
  if [[ ! -f "$DEPLOY_DIR/.env.deploy" ]]; then
    error ".env.deploy not found: $DEPLOY_DIR/.env.deploy"
    exit 1
  fi
  
  # Validate required environment variables
  if [[ -z "$PUBLIC_IP" ]]; then
    error "PUBLIC_IP not set in environment"
    exit 1
  fi
  
  if [[ -z "$REMOTE_USER" ]]; then
    error "REMOTE_USER not set in environment"
    exit 1
  fi
  
  log "Environment validation passed"
  
  # Check if we're running locally or on the server
  # If we're on the server (in /opt/portfolio), skip local build steps
  if [[ "$SCRIPT_DIR" == *"/opt/portfolio/"* ]]; then
    log "Running on server - skipping local build steps"
    local skip_local_build=true
  else
    log "Running locally - performing build steps"
    local skip_local_build=false
  fi
  
  # Step 1: Build frontend assets locally (only if running locally)
  if [[ "$skip_local_build" == "false" ]]; then
    if ! build_frontend_assets; then
      error "Failed to build frontend assets"
      exit 1
    fi
    
    # Step 2: Upload assets to R2 (only if running locally)
    if ! upload_assets_to_r2; then
      error "Failed to upload assets to R2"
      exit 1
    fi
  else
    log "Skipping frontend build and R2 upload (running on server)"
  fi
  
  # Get current environment
  local current_env=$(get_current_environment)
  log "Current active environment: $current_env"
  
  # Determine target environment
  if [[ -z "$target_env" ]]; then
    target_env=$(get_target_environment "$current_env")
  fi
  log "Target environment: $target_env"
  
  # Validate target environment
  if [[ "$target_env" != "blue" && "$target_env" != "green" ]]; then
    error "Invalid target environment: $target_env. Must be 'blue' or 'green'"
    exit 1
  fi
  
  # Check if target environment has containers running
  if check_containers_running "$target_env"; then
    warning "$target_env environment has containers running, switching to opposite environment"
    if [[ "$target_env" == "green" ]]; then
      target_env="blue"
    else
      target_env="green"
    fi
    log "New target environment: $target_env"
  fi
  
  # Deploy to target environment
  if ! deploy_to_environment "$target_env"; then
    error "Failed to deploy to $target_env environment"
    exit 1
  fi
  
  # Test target environment health
  if ! test_environment_health "$target_env"; then
    error "Health check failed for $target_env environment"
    rollback "$current_env" "$target_env"
    exit 1
  fi
  
  # Switch traffic to target environment
  if ! switch_traffic "$target_env"; then
    error "Failed to switch traffic to $target_env environment"
    rollback "$current_env" "$target_env"
    exit 1
  fi
  
  # Verify deployment
  verify_deployment
  
  # Wait a bit to ensure everything is stable
  log "Waiting for deployment to stabilize..."
  sleep 30
  
  # Test target environment health again after traffic switch
  if ! test_environment_health "$target_env"; then
    error "Health check failed for $target_env environment after traffic switch"
    rollback "$current_env" "$target_env"
    exit 1
  fi
  
  # Cleanup old environment (but don't remove containers yet)
  log "Stopping old $current_env environment containers (keeping for potential rollback)..."
  execute_ssh "cd /opt/portfolio && docker compose -f docker/docker-compose.yml stop php_$current_env nginx_$current_env"
  
  # Final verification
  log "Performing final verification..."
  sleep 15
  if ! test_environment_health "$target_env"; then
    error "Final health check failed, rolling back"
    rollback "$current_env" "$target_env"
    exit 1
  fi
  
  # Now safe to remove old containers
  cleanup_old_environment "$current_env"
  
  # Rotate environments if needed (move green to blue for next cycle)
  if [[ "$target_env" == "green" ]]; then
    log "Preparing for next deployment cycle..."
    rotate_environments "$target_env"
  fi
  
  # Purge CDN cache (only if running locally)
  if [[ "$skip_local_build" == "false" ]]; then
    purge_cdn_cache
  else
    log "Skipping CDN cache purge (running on server)"
  fi
  
  success "🎉 Blue-Green deployment completed successfully!"
  success "Active environment: $target_env"
  success "Site: https://harun.dev"
  success "Traefik Dashboard: http://$PUBLIC_IP:8080"
}

# Run main function with all arguments
main "$@" 