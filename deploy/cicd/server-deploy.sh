#!/bin/bash

# Server-Only Blue-Green Deployment Script
# This script is designed to run on the server and handles only container deployment
# Asset building and uploading should be handled by GitHub Actions before calling this script

set -e
set -o pipefail

# Get script directory and deployment directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$DEPLOY_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Load environment variables
ENV_FILE="$DEPLOY_DIR/.env.deploy"
if [ -f "$ENV_FILE" ]; then
  set -a
  . "$ENV_FILE"
  set +a
else
  error "Environment file not found: $ENV_FILE"
  exit 1
fi

# Validate required environment variables
REQUIRED_VARS=(
  "PUBLIC_IP"
  "REMOTE_USER"
  "APP_DIR"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    error "Required environment variable $var is not set"
    exit 1
  fi
done

# Function to detect current active environment via Traefik
detect_active_environment() {
  # Try to get Traefik configuration
  local traefik_config=$(curl -s http://localhost:8080/api/http/services 2>/dev/null || echo 'failed')
  
  if [[ "$traefik_config" != "failed" ]] && echo "$traefik_config" | grep -q "web-blue"; then
    if echo "$traefik_config" | grep -q '"loadBalancer":{"servers":\[{"url":"http://nginx_blue:80"}'; then
      echo "blue"
      return 0
    fi
  fi
  
  if [[ "$traefik_config" != "failed" ]] && echo "$traefik_config" | grep -q "web-green"; then
    if echo "$traefik_config" | grep -q '"loadBalancer":{"servers":\[{"url":"http://nginx_green:80"}'; then
      echo "green"
      return 0
    fi
  fi
  
  # Fallback: check container status
  local blue_status=$(docker compose -f docker/docker-compose.yml ps nginx_blue --format '{{.State}}' 2>/dev/null || echo 'not_running')
  local green_status=$(docker compose -f docker/docker-compose.yml ps nginx_green --format '{{.State}}' 2>/dev/null || echo 'not_running')
  
  if [[ "$blue_status" == "running" ]] && [[ "$green_status" != "running" ]]; then
    echo "blue"
  elif [[ "$green_status" == "running" ]] && [[ "$blue_status" != "running" ]]; then
    echo "green"
  elif [[ "$green_status" == "running" ]] && [[ "$blue_status" == "running" ]]; then
    # If both are running, check which one is active via Traefik or default to green
    echo "green"
  else
    # If neither are running, start with green as the baseline
    echo "none"
  fi
}

# Function to determine target environment
determine_target_environment() {
  local current_env="$1"
  
  # Always deploy to the opposite environment
  if [ "$current_env" = "blue" ]; then
    echo "green"
  else
    echo "blue"
  fi
}

# Function to sync repository on server
sync_repository() {
  log "Syncing repository on server..."
  
  git fetch origin && git checkout features/deploy-with-traefik && git pull origin features/deploy-with-traefik
  
  # Ensure routes file is up to date by copying from local
  log "Ensuring routes file is synchronized..."
  
  success "Repository synchronized"
}

# Function to deploy to target environment
deploy_to_environment() {
  local target_env="$1"
  
  log "Deploying to $target_env environment..."
  
  # Sync repository first
  sync_repository
  
  # Build and start containers for target environment
  docker compose -f docker/docker-compose.yml build php_$target_env nginx_$target_env
  docker compose -f docker/docker-compose.yml up -d php_$target_env nginx_$target_env
  
  # Wait for containers to be ready
  log "Waiting for $target_env containers to be ready..."
  sleep 10
  
  # Copy routes file into container and clear caches
  docker cp routes/web.php php_$target_env:/var/www/html/routes/web.php
  
  # Ensure storage directories exist and have proper permissions
  docker compose -f docker/docker-compose.yml exec -T php_$target_env sh -c 'mkdir -p /var/www/html/storage/framework/cache /var/www/html/storage/framework/sessions /var/www/html/storage/framework/views /var/www/html/storage/framework/testing'
  docker compose -f docker/docker-compose.yml exec -T php_$target_env chown -R www-data:www-data /var/www/html/storage
  docker compose -f docker/docker-compose.yml exec -T php_$target_env chmod -R 775 /var/www/html/storage
  
  docker compose -f docker/docker-compose.yml exec -T php_$target_env php artisan cache:clear
  docker compose -f docker/docker-compose.yml exec -T php_$target_env php artisan route:clear
  docker compose -f docker/docker-compose.yml exec -T php_$target_env php artisan config:clear
  docker compose -f docker/docker-compose.yml exec -T php_$target_env php artisan route:cache
  
  success "$target_env environment deployed successfully"
}

# Function to perform health checks
perform_health_checks() {
  local target_env="$1"
  local max_attempts=30
  local attempt=1
  
  log "Performing health checks on $target_env environment..."
  
  while [ $attempt -le $max_attempts ]; do
    # Test basic nginx connectivity
    local nginx_status=$(docker compose -f docker/docker-compose.yml exec -T nginx_$target_env curl -s -o /dev/null -w '%{http_code}' http://localhost:80/ 2>/dev/null || echo '000')
    
    if [[ "$nginx_status" =~ ^[2-3][0-9][0-9]$ ]]; then
      # Test health endpoint
      local health_status=$(docker compose -f docker/docker-compose.yml exec -T nginx_$target_env curl -s -o /dev/null -w '%{http_code}' http://localhost:80/health 2>/dev/null || echo '000')
      
      if [ "$health_status" = "200" ]; then
        success "Health checks passed for $target_env environment"
        return 0
      fi
    fi
    
    log "Health check attempt $attempt/$max_attempts failed (nginx: $nginx_status), retrying..."
    sleep 5
    attempt=$((attempt + 1))
  done
  
  error "Health checks failed for $target_env environment after $max_attempts attempts"
  return 1
}

# Function to perform comprehensive site verification
perform_site_verification() {
  local max_attempts=10
  local attempt=1
  
  log "Performing comprehensive site verification..."
  
  while [ $attempt -le $max_attempts ]; do
    # Test main site
    local site_status=$(curl -s -o /dev/null -w '%{http_code}' "https://harun.dev" 2>/dev/null || echo '000')
    
    if [ "$site_status" = "200" ]; then
      # Test health endpoint
      local health_status=$(curl -s -o /dev/null -w '%{http_code}' "https://harun.dev/health" 2>/dev/null || echo '000')
      
      if [ "$health_status" = "200" ]; then
        # Get asset filenames from the server's manifest file
        local manifest_content=$(cat public/build/manifest.json 2>/dev/null || echo '{}')
        
        if [ "$manifest_content" != "{}" ]; then
          # Extract CSS and JS filenames from manifest
          local css_file=$(echo "$manifest_content" | grep -o '"assets/app-[^"]*\.css"' | head -1 | tr -d '"')
          local js_file=$(echo "$manifest_content" | grep -o '"assets/app-[^"]*\.js"' | head -1 | tr -d '"')
          
          if [ -n "$css_file" ] && [ -n "$js_file" ]; then
            # Test actual assets referenced in the server's manifest
            local css_status=$(curl -s -o /dev/null -w '%{http_code}' "https://cdn.harun.dev/build/$css_file" 2>/dev/null || echo '000')
            local js_status=$(curl -s -o /dev/null -w '%{http_code}' "https://cdn.harun.dev/build/$js_file" 2>/dev/null || echo '000')
            
            if [ "$css_status" = "200" ] && [ "$js_status" = "200" ]; then
              success "Site verification passed - all components working"
              log "✅ Main site: $site_status"
              log "✅ Health endpoint: $health_status" 
              log "✅ CSS assets ($css_file): $css_status"
              log "✅ JS assets ($js_file): $js_status"
              return 0
            else
              log "Asset verification failed (CSS $css_file: $css_status, JS $js_file: $js_status)"
            fi
          else
            log "Could not extract asset filenames from server manifest"
          fi
        else
          log "Could not retrieve manifest from server"
        fi
      else
        log "Health endpoint failed: $health_status"
      fi
    else
      log "Main site failed: $site_status"
    fi
    
    log "Site verification attempt $attempt/$max_attempts failed, retrying..."
    sleep 10
    attempt=$((attempt + 1))
  done
  
  error "Site verification failed after $max_attempts attempts"
  return 1
}

# Function to switch traffic to target environment
switch_traffic() {
  local target_env="$1"
  local max_attempts=30
  local attempt=1
  
  log "Switching traffic to $target_env environment..."
  
  # Update Traefik dynamic configuration
  sed -i "s/service: web-blue/service: web-${target_env}/g; s/service: web-green/service: web-${target_env}/g" docker/traefik-dynamic.yml
  
  # Restart Traefik to pick up the new configuration
  docker compose -f docker/docker-compose.yml restart traefik
  sleep 5
  
  # Wait for traffic switch to take effect and verify
  while [ $attempt -le $max_attempts ]; do
    sleep 2
    
    # Check if traffic is being routed to the target environment
    local public_response=$(curl -s -o /dev/null -w '%{http_code}' "https://harun.dev/health" 2>/dev/null || echo '000')
    
    if [ "$public_response" = "200" ]; then
      success "Traffic successfully switched to $target_env environment"
      return 0
    fi
    
    log "Traffic switch verification attempt $attempt/$max_attempts..."
    attempt=$((attempt + 1))
  done
  
  error "Failed to verify traffic switch to $target_env environment"
  return 1
}

# Function to perform environment rotation
perform_environment_rotation() {
  local current_env="$1"
  local target_env="$2"
  
  log "Performing environment rotation: $target_env -> $current_env"
  
  # Tag current target images as current environment
  docker tag docker-php_$target_env docker-php_$current_env
  docker tag docker-nginx_$target_env docker-nginx_$current_env
  
  # Stop and remove old current environment containers
  docker compose -f docker/docker-compose.yml stop php_$current_env nginx_$current_env || true
  docker compose -f docker/docker-compose.yml rm -f php_$current_env nginx_$current_env || true
  
  # Start new current environment containers
  docker compose -f docker/docker-compose.yml up -d php_$current_env nginx_$current_env
  
  # Wait for containers to be ready
  sleep 10
  
  # Copy routes file into current environment container and ensure storage directories
  docker cp routes/web.php php_$current_env:/var/www/html/routes/web.php
  
  # Ensure storage directories exist and have proper permissions
  docker compose -f docker/docker-compose.yml exec -T php_$current_env sh -c 'mkdir -p /var/www/html/storage/framework/cache /var/www/html/storage/framework/sessions /var/www/html/storage/framework/views /var/www/html/storage/framework/testing'
  docker compose -f docker/docker-compose.yml exec -T php_$current_env chown -R www-data:www-data /var/www/html/storage
  docker compose -f docker/docker-compose.yml exec -T php_$current_env chmod -R 775 /var/www/html/storage
  
  docker compose -f docker/docker-compose.yml exec -T php_$current_env php artisan cache:clear
  docker compose -f docker/docker-compose.yml exec -T php_$current_env php artisan route:clear
  docker compose -f docker/docker-compose.yml exec -T php_$current_env php artisan config:clear
  docker compose -f docker/docker-compose.yml exec -T php_$current_env php artisan route:cache
  
  # Switch traffic to the new current environment
  switch_traffic "$current_env"
  
  # Clean up old target environment
  docker compose -f docker/docker-compose.yml stop php_$target_env nginx_$target_env || true
  docker compose -f docker/docker-compose.yml rm -f php_$target_env nginx_$target_env || true
  
  success "Environment rotation completed: $target_env -> $current_env"
}

# Function to rollback deployment
rollback_deployment() {
  local failed_env="$1"
  local current_env="$2"
  
  error "Deployment failed, initiating rollback..."
  
  # Stop failed environment containers
  docker compose -f docker/docker-compose.yml stop php_$failed_env nginx_$failed_env || true
  docker compose -f docker/docker-compose.yml rm -f php_$failed_env nginx_$failed_env || true
  
  # Ensure current environment is running
  docker compose -f docker/docker-compose.yml up -d php_$current_env nginx_$current_env
  
  # Copy routes file into current environment container and clear caches
  docker cp routes/web.php php_$current_env:/var/www/html/routes/web.php
  
  # Ensure storage directories exist and have proper permissions
  docker compose -f docker/docker-compose.yml exec -T php_$current_env sh -c 'mkdir -p /var/www/html/storage/framework/cache /var/www/html/storage/framework/sessions /var/www/html/storage/framework/views /var/www/html/storage/framework/testing'
  docker compose -f docker/docker-compose.yml exec -T php_$current_env chown -R www-data:www-data /var/www/html/storage
  docker compose -f docker/docker-compose.yml exec -T php_$current_env chmod -R 775 /var/www/html/storage
  
  docker compose -f docker/docker-compose.yml exec -T php_$current_env php artisan cache:clear
  docker compose -f docker/docker-compose.yml exec -T php_$current_env php artisan route:clear
  docker compose -f docker/docker-compose.yml exec -T php_$current_env php artisan config:clear
  docker compose -f docker/docker-compose.yml exec -T php_$current_env php artisan route:cache
  
  # Revert Traefik configuration
  sed -i "s/service: web-${failed_env}/service: web-${current_env}/g" docker/traefik-dynamic.yml
  
  # Restart Traefik to pick up the reverted configuration
  docker compose -f docker/docker-compose.yml restart traefik
  sleep 5
  
  # Wait for rollback to take effect
  sleep 10
  
  # Verify rollback health
  local rollback_health=$(docker compose -f docker/docker-compose.yml exec -T nginx_$current_env curl -s -o /dev/null -w '%{http_code}' http://localhost:80/health 2>/dev/null || echo '000')
  
  if [ "$rollback_health" = "200" ]; then
    success "Rollback completed successfully. Traffic restored to $current_env environment."
  else
    error "Rollback health check failed. Manual intervention may be required."
  fi
}

# Main deployment function
main() {
  log "Starting server-only blue-green deployment..."
  
  # Detect current active environment
  log "Detecting current active environment..."
  local current_env=$(detect_active_environment)
  log "Current active environment: $current_env"
  
  # Handle case where no environment is running
  if [ "$current_env" = "none" ]; then
    log "No environment currently running, starting with green as baseline"
    current_env="green"
    # Ensure green environment is running
    docker compose -f docker/docker-compose.yml up -d php_green nginx_green
    sleep 10
  fi
  
  # Determine target environment
  local target_env=$(determine_target_environment "$current_env")
  log "Target deployment environment: $target_env"
  
  # Deploy to target environment
  if ! deploy_to_environment "$target_env"; then
    error "Failed to deploy to $target_env environment"
    exit 1
  fi
  
  # Perform health checks
  if ! perform_health_checks "$target_env"; then
    rollback_deployment "$target_env" "$current_env"
    exit 1
  fi
  
  # Switch traffic to target environment
  if ! switch_traffic "$target_env"; then
    rollback_deployment "$target_env" "$current_env"
    exit 1
  fi
  
  # Perform comprehensive site verification
  if ! perform_site_verification; then
    rollback_deployment "$target_env" "$current_env"
    exit 1
  fi
  
  # Perform environment rotation
  if ! perform_environment_rotation "$current_env" "$target_env"; then
    warning "Environment rotation failed, but deployment is successful"
  fi
  
  success "Server-only blue-green deployment completed successfully!"
  log "Site is now running on the rotated environment"
  log "🔗 Site: https://harun.dev"
  log "🔧 Traefik dashboard: http://$PUBLIC_IP:8080"
}

# Run main function
main "$@" 