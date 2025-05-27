#!/bin/bash

# Blue-Green Zero-Downtime Deployment Script
# This script implements a comprehensive blue-green deployment strategy with:
# - Smart environment detection and rotation
# - NPM build and Cloudflare R2 asset upload
# - Health checks and automatic rollback
# - Environment rotation after successful deployment

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
# If running on server, look for env file in app directory
if [[ "$PWD" == *"/opt/portfolio"* ]] || [[ "$HOME" == "/home/ubuntu" ]]; then
  ENV_FILE="/opt/portfolio/deploy/.env.deploy"
fi

if [ -f "$ENV_FILE" ]; then
  set -a
  . "$ENV_FILE"
  set +a
else
  error "Environment file not found: $ENV_FILE"
  exit 1
fi

# Always resolve SSH_KEY to absolute path after loading .env.deploy
if [ -n "$SSH_KEY" ] && [[ "$SSH_KEY" != /* ]]; then
  # If running on server, look for SSH key in app directory
  if [[ "$PWD" == *"/opt/portfolio"* ]] || [[ "$HOME" == "/home/ubuntu" ]]; then
    SSH_KEY="/opt/portfolio/deploy/$SSH_KEY"
  else
    SSH_KEY="$DEPLOY_DIR/$SSH_KEY"
  fi
fi
export SSH_KEY

# Validate required environment variables
REQUIRED_VARS=(
  "PUBLIC_IP"
  "REMOTE_USER"
  "SSH_KEY"
  "APP_DIR"
  "R2_BUCKET_NAME"
  "R2_S3_ENDPOINT"
  "R2_ACCESS_KEY_ID"
  "R2_SECRET_ACCESS_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    error "Required environment variable $var is not set"
    exit 1
  fi
done

# Validate SSH key exists and has correct permissions
if [ ! -f "$SSH_KEY" ]; then
  error "SSH key not found: $SSH_KEY"
  exit 1
fi

if [ "$(stat -f %A "$SSH_KEY" 2>/dev/null || stat -c %a "$SSH_KEY" 2>/dev/null)" != "600" ]; then
  warning "SSH key permissions are not 600, fixing..."
  chmod 600 "$SSH_KEY"
fi

# Function to execute SSH commands with proper error handling
execute_ssh() {
  local command="$1"
  local max_retries=3
  local retry_count=0
  
  # Strip any color codes from the command to prevent parsing issues
  command=$(echo "$command" | sed 's/\x1b\[[0-9;]*m//g')
  
  while [ $retry_count -lt $max_retries ]; do
    # Use bash -c to properly handle complex commands and avoid color code issues
    if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 -i "$SSH_KEY" "$REMOTE_USER@$PUBLIC_IP" "$command"; then
      return 0
    else
      retry_count=$((retry_count + 1))
      if [ $retry_count -lt $max_retries ]; then
        warning "SSH command failed, retrying ($retry_count/$max_retries)..."
        sleep 5
      else
        error "SSH command failed after $max_retries attempts"
        return 1
      fi
    fi
  done
}

# Function to download latest environment files from S3 (server only)
download_latest_env_files_from_s3() {
  local context=$(detect_execution_context)
  if [ "$context" = "local" ]; then
    log "Skipping S3 environment file download on local machine"
    return 0
  fi

  log "Downloading latest environment files from S3..."
  
  # Check if AWS credentials are available
  if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ] || [ -z "$CONFIG_BUCKET_NAME" ]; then
    warning "AWS credentials or CONFIG_BUCKET_NAME not available, using existing local files"
    return 0
  fi
  
  export AWS_ACCESS_KEY_ID
  export AWS_SECRET_ACCESS_KEY
  
  # Install AWS CLI if not present
  if ! command -v aws &> /dev/null; then
    log "Installing AWS CLI..."
    curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip'
    sudo apt-get update && sudo apt-get install -y unzip
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf awscliv2.zip aws
  fi
  
  # Download app environment file
  log "Downloading app environment file from S3..."
  if aws s3 cp "s3://$CONFIG_BUCKET_NAME/secrets/envs/app/.env" "$APP_DIR/.env" 2>/dev/null; then
    log "Successfully downloaded app environment file from S3"
  else
    warning "Failed to download app environment file from S3, using existing file"
  fi
  
  # Download docker environment file
  log "Downloading docker environment file from S3..."
  if aws s3 cp "s3://$CONFIG_BUCKET_NAME/secrets/envs/docker/.env" "$APP_DIR/docker/.env" 2>/dev/null; then
    log "Successfully downloaded docker environment file from S3"
    
    # Also update the deploy .env.deploy file
    cp "$APP_DIR/docker/.env" "$DEPLOY_DIR/.env.deploy"
    
    # Reload environment variables after downloading updated .env.deploy
    set -a
    . "$DEPLOY_DIR/.env.deploy"
    set +a
    
    log "Environment variables reloaded from updated S3 files"
  else
    warning "Failed to download docker environment file from S3, using existing file"
  fi
  
  # Generate .env.db for the db service
  log "Generating .env.db for db service..."
  grep -E '^(POSTGRES_DB|POSTGRES_USER|POSTGRES_PASSWORD)=' "$APP_DIR/docker/.env" > "$APP_DIR/docker/.env.db" 2>/dev/null || true
  chmod 600 "$APP_DIR/docker/.env.db" 2>/dev/null || true
  
  success "Environment files updated from S3"
}

# Function to detect execution context
detect_execution_context() {
  if [[ "$PWD" == *"/opt/portfolio"* ]] || [[ "$HOME" == "/home/ubuntu" ]]; then
    echo "server"
  else
    echo "local"
  fi
}

# Function to check Node.js version and install if needed (local only)
ensure_node_version() {
  local context=$(detect_execution_context)
  if [ "$context" = "server" ]; then
    log "Skipping Node.js operations on server"
    return 0
  fi

  local min_version=18
  local current_version=$(node -v 2>/dev/null | sed 's/v//;s/\..*//' || echo "0")
  
  if [ "$current_version" -ge "$min_version" ]; then
    log "Node.js version check passed: $(node -v)"
    return 0
  fi

  error "Node.js >= $min_version is required. Current: $(node -v 2>/dev/null || echo 'not installed')"
  return 1
}

# Function to build frontend assets (local only)
build_frontend_assets() {
  local context=$(detect_execution_context)
  if [ "$context" = "server" ]; then
    log "Skipping frontend build on server"
    return 0
  fi

  log "Building frontend assets..."
  cd "$REPO_ROOT"
  
  # Backup and setup .env for build
  if [ -f ".env" ]; then
    cp ".env" ".env.backup"
  fi
  
  if [ -f "$DEPLOY_DIR/.env.appprod" ]; then
    cp "$DEPLOY_DIR/.env.appprod" ".env"
  else
    error ".env.appprod not found for build process"
    return 1
  fi
  
  # Build assets
  npm ci && npm run build
  local build_status=$?
  
  # Restore original .env
  if [ -f ".env.backup" ]; then
    mv ".env.backup" ".env"
  else
    rm -f ".env"
  fi
  
  cd "$SCRIPT_DIR"
  
  if [ $build_status -ne 0 ]; then
    error "Frontend build failed"
    return 1
  fi
  
  success "Frontend assets built successfully"
  return 0
}

# Function to backup current assets before deployment (local only)
backup_current_assets() {
  local context=$(detect_execution_context)
  if [ "$context" = "server" ]; then
    log "Skipping asset backup on server"
    return 0
  fi

  log "Creating backup of current assets..."
  
  # Store current AWS credentials
  local original_access_key="$AWS_ACCESS_KEY_ID"
  local original_secret_key="$AWS_SECRET_ACCESS_KEY"
  
  # Set R2 credentials
  export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
  export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
  
  # Create backup with timestamp
  local backup_timestamp=$(date +%Y%m%d-%H%M%S)
  
  # Backup current build assets
  aws s3 sync "s3://$R2_BUCKET_NAME/build" "s3://$R2_BUCKET_NAME/backups/$backup_timestamp/build" \
    --endpoint-url "$R2_S3_ENDPOINT" || warning "Failed to backup build assets"
  
  # Store backup timestamp for potential rollback
  echo "$backup_timestamp" > /tmp/asset_backup_timestamp
  
  # Restore original AWS credentials
  export AWS_ACCESS_KEY_ID="$original_access_key"
  export AWS_SECRET_ACCESS_KEY="$original_secret_key"
  
  success "Asset backup created: $backup_timestamp"
  return 0
}

# Function to upload assets to Cloudflare R2 (local only)
upload_assets_to_r2() {
  local context=$(detect_execution_context)
  if [ "$context" = "server" ]; then
    log "Skipping R2 upload on server"
    return 0
  fi

  log "Uploading assets to Cloudflare R2..."
  
  # Store current AWS credentials
  local original_access_key="$AWS_ACCESS_KEY_ID"
  local original_secret_key="$AWS_SECRET_ACCESS_KEY"
  
  # Set R2 credentials
  export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
  export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
  
  # Upload build assets
  aws s3 sync "$REPO_ROOT/public/build" "s3://$R2_BUCKET_NAME/build" \
    --endpoint-url "$R2_S3_ENDPOINT" --delete --acl public-read
  
  # Upload with proper content types
  find "$REPO_ROOT/public/build" -name "*.js" -type f | while read -r file; do
    relative_path="${file#$REPO_ROOT/public/}"
    aws s3 cp "$file" "s3://$R2_BUCKET_NAME/$relative_path" \
      --endpoint-url "$R2_S3_ENDPOINT" --content-type "application/javascript" --acl public-read
  done
  
  find "$REPO_ROOT/public/build" -name "*.css" -type f | while read -r file; do
    relative_path="${file#$REPO_ROOT/public/}"
    aws s3 cp "$file" "s3://$R2_BUCKET_NAME/$relative_path" \
      --endpoint-url "$R2_S3_ENDPOINT" --content-type "text/css" --acl public-read
  done
  
  # Upload other static assets
  aws s3 sync "$REPO_ROOT/public/fonts" "s3://$R2_BUCKET_NAME/fonts" \
    --endpoint-url "$R2_S3_ENDPOINT" --delete --acl public-read
  aws s3 sync "$REPO_ROOT/public/images" "s3://$R2_BUCKET_NAME/images" \
    --endpoint-url "$R2_S3_ENDPOINT" --delete --acl public-read
  
  # Restore original AWS credentials
  export AWS_ACCESS_KEY_ID="$original_access_key"
  export AWS_SECRET_ACCESS_KEY="$original_secret_key"
  
  success "Assets uploaded to Cloudflare R2"
  return 0
}

# Function to restore assets from backup (local only)
restore_assets_from_backup() {
  local context=$(detect_execution_context)
  if [ "$context" = "server" ]; then
    log "Skipping asset restoration on server"
    return 0
  fi

  if [ ! -f /tmp/asset_backup_timestamp ]; then
    warning "No asset backup timestamp found, skipping asset restoration"
    return 0
  fi

  local backup_timestamp=$(cat /tmp/asset_backup_timestamp)
  log "Restoring assets from backup: $backup_timestamp"
  
  # Store current AWS credentials
  local original_access_key="$AWS_ACCESS_KEY_ID"
  local original_secret_key="$AWS_SECRET_ACCESS_KEY"
  
  # Set R2 credentials
  export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
  export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
  
  # Restore build assets from backup
  aws s3 sync "s3://$R2_BUCKET_NAME/backups/$backup_timestamp/build" "s3://$R2_BUCKET_NAME/build" \
    --endpoint-url "$R2_S3_ENDPOINT" --delete --acl public-read
  
  # Restore original AWS credentials
  export AWS_ACCESS_KEY_ID="$original_access_key"
  export AWS_SECRET_ACCESS_KEY="$original_secret_key"
  
  # Clean up backup timestamp
  rm -f /tmp/asset_backup_timestamp
  
  success "Assets restored from backup: $backup_timestamp"
  return 0
}

# Function to detect current active environment via Traefik
detect_active_environment() {
  # Try to get Traefik configuration
  local traefik_config=$(execute_ssh "cd $APP_DIR && curl -s http://localhost:8080/api/http/services 2>/dev/null || echo 'failed'")
  
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
  local blue_status=$(execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml ps nginx_blue --format '{{.State}}' 2>/dev/null || echo 'not_running'")
  local green_status=$(execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml ps nginx_green --format '{{.State}}' 2>/dev/null || echo 'not_running'")
  
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
  
  execute_ssh "cd $APP_DIR && git fetch origin && git checkout features/deploy-with-traefik && git pull origin features/deploy-with-traefik"
  
  # Ensure routes file is up to date by copying from local
  log "Ensuring routes file is synchronized..."
  scp -o StrictHostKeyChecking=no -i "$SSH_KEY" "$REPO_ROOT/routes/web.php" "$REMOTE_USER@$PUBLIC_IP:$APP_DIR/routes/web.php"
  
  success "Repository synchronized"
}

# Function to deploy to target environment
deploy_to_environment() {
  local target_env="$1"
  
  log "Deploying to $target_env environment..."
  
  # Sync repository first
  sync_repository
  
  # Build and start containers for target environment
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml build php_$target_env nginx_$target_env"
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml up -d php_$target_env nginx_$target_env"
  
  # Wait for containers to be ready
  log "Waiting for $target_env containers to be ready..."
  sleep 10
  
  # Copy routes file into container and clear caches
  execute_ssh "cd $APP_DIR && docker cp routes/web.php php_$target_env:/var/www/html/routes/web.php"
  
  # Ensure storage directories exist and have proper permissions
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T php_$target_env sh -c 'mkdir -p /var/www/html/storage/framework/cache /var/www/html/storage/framework/sessions /var/www/html/storage/framework/views /var/www/html/storage/framework/testing'"
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T php_$target_env chown -R www-data:www-data /var/www/html/storage"
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T php_$target_env chmod -R 775 /var/www/html/storage"
  
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T php_$target_env php artisan cache:clear"
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T php_$target_env php artisan route:clear"
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T php_$target_env php artisan config:clear"
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T php_$target_env php artisan route:cache"
  
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
    local nginx_status=$(execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T nginx_$target_env curl -s -o /dev/null -w '%{http_code}' http://localhost:80/ 2>/dev/null || echo '000'")
    
    if [[ "$nginx_status" =~ ^[2-3][0-9][0-9]$ ]]; then
      # Test health endpoint
      local health_status=$(execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T nginx_$target_env curl -s -o /dev/null -w '%{http_code}' http://localhost:80/health 2>/dev/null || echo '000'")
      
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
        local manifest_content=$(execute_ssh "cd $APP_DIR && cat public/build/manifest.json" 2>/dev/null || echo '{}')
        
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
  execute_ssh "cd $APP_DIR && sed -i \"s/service: web-blue/service: web-${target_env}/g; s/service: web-green/service: web-${target_env}/g\" docker/traefik-dynamic.yml"
  
  # Restart Traefik to pick up the new configuration
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml restart traefik"
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
  execute_ssh "cd $APP_DIR && docker tag docker-php_$target_env docker-php_$current_env"
  execute_ssh "cd $APP_DIR && docker tag docker-nginx_$target_env docker-nginx_$current_env"
  
  # Stop and remove old current environment containers
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml stop php_$current_env nginx_$current_env || true"
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml rm -f php_$current_env nginx_$current_env || true"
  
  # Start new current environment containers
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml up -d php_$current_env nginx_$current_env"
  
  # Wait for containers to be ready
  sleep 10
  
  # Copy routes file into current environment container and ensure storage directories
  execute_ssh "cd $APP_DIR && docker cp routes/web.php php_$current_env:/var/www/html/routes/web.php"
  
  # Ensure storage directories exist and have proper permissions
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T php_$current_env sh -c 'mkdir -p /var/www/html/storage/framework/cache /var/www/html/storage/framework/sessions /var/www/html/storage/framework/views /var/www/html/storage/framework/testing'"
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T php_$current_env chown -R www-data:www-data /var/www/html/storage"
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T php_$current_env chmod -R 775 /var/www/html/storage"
  
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T php_$current_env php artisan cache:clear"
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T php_$current_env php artisan route:clear"
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T php_$current_env php artisan config:clear"
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T php_$current_env php artisan route:cache"
  
  # Switch traffic to the new current environment
  switch_traffic "$current_env"
  
  # Clean up old target environment
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml stop php_$target_env nginx_$target_env || true"
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml rm -f php_$target_env nginx_$target_env || true"
  
  success "Environment rotation completed: $target_env -> $current_env"
}

# Function to rollback deployment
rollback_deployment() {
  local failed_env="$1"
  local current_env="$2"
  
  error "Deployment failed, initiating rollback..."
  
  # Restore assets from backup first
  restore_assets_from_backup
  
  # Stop failed environment containers
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml stop php_$failed_env nginx_$failed_env || true"
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml rm -f php_$failed_env nginx_$failed_env || true"
  
  # Ensure current environment is running
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml up -d php_$current_env nginx_$current_env"
  
  # Copy routes file into current environment container and clear caches
  execute_ssh "cd $APP_DIR && docker cp routes/web.php php_$current_env:/var/www/html/routes/web.php"
  
  # Ensure storage directories exist and have proper permissions
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T php_$current_env sh -c 'mkdir -p /var/www/html/storage/framework/cache /var/www/html/storage/framework/sessions /var/www/html/storage/framework/views /var/www/html/storage/framework/testing'"
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T php_$current_env chown -R www-data:www-data /var/www/html/storage"
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T php_$current_env chmod -R 775 /var/www/html/storage"
  
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T php_$current_env php artisan cache:clear"
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T php_$current_env php artisan route:clear"
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T php_$current_env php artisan config:clear"
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T php_$current_env php artisan route:cache"
  
  # Revert Traefik configuration
  execute_ssh "cd $APP_DIR && sed -i \"s/service: web-${failed_env}/service: web-${current_env}/g\" docker/traefik-dynamic.yml"
  
  # Restart Traefik to pick up the reverted configuration
  execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml restart traefik"
  sleep 5
  
  # Purge CDN cache to ensure restored assets are served
  purge_cdn_cache
  
  # Wait for rollback to take effect
  sleep 10
  
  # Verify rollback health
  local rollback_health=$(execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml exec -T nginx_$current_env curl -s -o /dev/null -w '%{http_code}' http://localhost:80/health 2>/dev/null || echo '000'")
  
  if [ "$rollback_health" = "200" ]; then
    success "Rollback completed successfully. Traffic restored to $current_env environment."
  else
    error "Rollback health check failed. Manual intervention may be required."
  fi
}

# Function to verify asset synchronization
verify_asset_synchronization() {
  local context=$(detect_execution_context)
  if [ "$context" = "server" ]; then
    log "Skipping asset synchronization verification on server"
    return 0
  fi

  log "Verifying asset synchronization between manifest and R2..."
  
  # Store current AWS credentials
  local original_access_key="$AWS_ACCESS_KEY_ID"
  local original_secret_key="$AWS_SECRET_ACCESS_KEY"
  
  # Set R2 credentials
  export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
  export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
  
  # Check a few key assets from manifest
  local manifest_file="$REPO_ROOT/public/build/manifest.json"
  if [ ! -f "$manifest_file" ]; then
    error "Manifest file not found: $manifest_file"
    return 1
  fi
  
  # Extract a few asset filenames from manifest
  local css_file=$(grep -o '"assets/app-[^"]*\.css"' "$manifest_file" | head -1 | tr -d '"')
  local js_file=$(grep -o '"assets/app-[^"]*\.js"' "$manifest_file" | head -1 | tr -d '"')
  
  if [ -n "$css_file" ] && [ -n "$js_file" ]; then
    # Check if these files exist in R2
    local css_exists=$(aws s3 ls "s3://$R2_BUCKET_NAME/build/$css_file" --endpoint-url "$R2_S3_ENDPOINT" 2>/dev/null | wc -l)
    local js_exists=$(aws s3 ls "s3://$R2_BUCKET_NAME/build/$js_file" --endpoint-url "$R2_S3_ENDPOINT" 2>/dev/null | wc -l)
    
    if [ "$css_exists" -gt 0 ] && [ "$js_exists" -gt 0 ]; then
      success "Asset synchronization verified - manifest and R2 are in sync"
    else
      error "Asset synchronization failed - manifest references files not in R2"
      log "CSS file ($css_file) exists in R2: $css_exists"
      log "JS file ($js_file) exists in R2: $js_exists"
      return 1
    fi
  else
    warning "Could not extract asset filenames from manifest for verification"
  fi
  
  # Restore original AWS credentials
  export AWS_ACCESS_KEY_ID="$original_access_key"
  export AWS_SECRET_ACCESS_KEY="$original_secret_key"
  
  return 0
}

# Function to purge CDN cache
purge_cdn_cache() {
  if [ -z "$CLOUDFLARE_ZONE_ID" ] || [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    warning "Skipping Cloudflare CDN purge - missing credentials"
    return 0
  fi
  
  log "Purging Cloudflare CDN cache..."
  
  local result=$(curl -s -X POST \
    "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}')
  
  if echo "$result" | grep -q '"success":true'; then
    success "Cloudflare cache purged successfully"
  else
    warning "Failed to purge Cloudflare cache: $result"
  fi
}

# Main deployment function
main() {
  log "Starting blue-green deployment..."
  
  local context=$(detect_execution_context)
  
  if [ "$context" = "local" ]; then
    # Local execution: build assets and upload to R2
    log "Running on local machine - building and uploading assets..."
    
    # Check Node.js version
    if ! ensure_node_version; then
      exit 1
    fi
    
    # Backup current assets before deployment
    if ! backup_current_assets; then
      warning "Failed to backup current assets, continuing deployment..."
    fi
    
    # Build frontend assets
    if ! build_frontend_assets; then
      exit 1
    fi
    
    # Upload assets to R2
    if ! upload_assets_to_r2; then
      exit 1
    fi
    
    # Verify asset synchronization
    if ! verify_asset_synchronization; then
      exit 1
    fi
    
    log "Assets built and uploaded successfully. Now executing deployment on server..."
    
    # Copy updated manifest.json to server
    scp -o StrictHostKeyChecking=no -i "$SSH_KEY" "$REPO_ROOT/public/build/manifest.json" "$REMOTE_USER@$PUBLIC_IP:$APP_DIR/public/build/manifest.json"
    
    # Execute the same script on the server
    scp -o StrictHostKeyChecking=no -i "$SSH_KEY" "$0" "$REMOTE_USER@$PUBLIC_IP:/tmp/blue-green-deploy.sh"
    execute_ssh "chmod +x /tmp/blue-green-deploy.sh && cd $APP_DIR && /tmp/blue-green-deploy.sh"
    
    success "Blue-green deployment completed successfully!"
    log "🔗 Site: https://harun.dev"
    log "🔧 Traefik dashboard: http://$PUBLIC_IP:8080"
    
    return 0
  fi
  
  # Server execution: deploy containers only
  log "Running on server - deploying containers..."
  
  # Download latest environment files from S3
  download_latest_env_files_from_s3
  
  # Detect current active environment
  log "Detecting current active environment..."
  local current_env=$(detect_active_environment)
  log "Current active environment: $current_env"
  
  # Handle case where no environment is running
  if [ "$current_env" = "none" ]; then
    log "No environment currently running, starting with green as baseline"
    current_env="green"
    # Ensure green environment is running
    execute_ssh "cd $APP_DIR && docker compose -f docker/docker-compose.yml up -d php_green nginx_green"
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
  
  # Purge CDN cache
  purge_cdn_cache
  
  success "Blue-green deployment completed successfully!"
  log "Site is now running on the rotated environment"
  log "🔗 Site: https://harun.dev"
  log "🔧 Traefik dashboard: http://$PUBLIC_IP:8080"
}

# Run main function
main "$@" 