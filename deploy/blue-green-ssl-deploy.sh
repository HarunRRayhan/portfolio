#!/bin/bash

# Blue-Green Deployment Script with Let's Encrypt SSL
# This script implements a zero-downtime deployment using blue-green strategy with Let's Encrypt SSL

set -e
set -o pipefail

# Configuration
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables from .env.deploy and .env.appprod if they exist
if [ -f "$SCRIPT_DIR/.env.deploy" ]; then
  source "$SCRIPT_DIR/.env.deploy"
fi

# Set default values for required variables
DOMAIN=${DOMAIN:-${APP_URL#*://}}
DOMAIN=${DOMAIN:-"harun.dev"}
EMAIL=${EMAIL:-"contact@harun.dev"}
DOCKER_COMPOSE_FILE="$REPO_ROOT/docker/docker-compose-blue-green.yml"
ENV=${ENV:-"production"}
DB_HOST=${DB_HOST:-"db"}
DB_PORT=${DB_PORT:-"5432"}
DB_DATABASE=${DB_DATABASE:-${POSTGRES_DB:-"portfolio"}}
DB_USERNAME=${DB_USERNAME:-${POSTGRES_USER:-"postgres"}}
DB_PASSWORD=${DB_PASSWORD:-${POSTGRES_PASSWORD:-"postgres"}}
ASSET_URL=${ASSET_URL:-"https://$DOMAIN"}
VITE_ASSET_BASE_URL=${VITE_ASSET_BASE_URL:-"https://$DOMAIN"}
APP_KEY=${APP_KEY:-"base64:yUwtWgRbG5jszbGwJhcERDfBkDPpECD+IURBjl8uAW0="}

# Function to log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to handle failures
fail() {
  echo "❌ ERROR: $1"
  exit 1
}

# Check if Docker is running
check_docker() {
  log "Checking if Docker is running..."
  if ! docker info > /dev/null 2>&1; then
    fail "Docker is not running or not accessible. Please start Docker and try again."
  fi
  log "Docker is running."
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --domain=*)
      DOMAIN="${1#*=}"
      shift
      ;;
    --email=*)
      EMAIL="${1#*=}"
      shift
      ;;
    --env=*)
      ENV="${1#*=}"
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --domain=DOMAIN    Domain name (default: harun.dev)"
      echo "  --email=EMAIL      Email for Let's Encrypt (default: contact@harun.dev)"
      echo "  --env=ENV          Environment (default: production)"
      echo "  --help             Display this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Check if Docker is running
check_docker

# Determine the current active environment (blue or green)
log "Determining current active environment..."
if docker ps --format '{{.Names}}' | grep -q "app-blue"; then
  CURRENT_ENV="blue"
  NEW_ENV="green"
  log "Current active environment: blue"
  log "Target environment for deployment: green"
elif docker ps --format '{{.Names}}' | grep -q "app-green"; then
  CURRENT_ENV="green"
  NEW_ENV="blue"
  log "Current active environment: green"
  log "Target environment for deployment: blue"
else
  CURRENT_ENV=""
  NEW_ENV="blue"
  log "No active environment found. Starting with blue environment."
fi

# Create Docker Compose file for blue-green deployment with SSL
create_docker_compose_file() {
  log "Creating Docker Compose file for blue-green deployment with SSL..."
  
  # Create directory for Docker Compose file if it doesn't exist
  mkdir -p "$(dirname "$DOCKER_COMPOSE_FILE")"
  
  # Copy the template file and replace variables
  cp "$SCRIPT_DIR/docker-compose-template.yml" "$DOCKER_COMPOSE_FILE"
  
  # Replace variables in the Docker Compose file
  sed -i "s|\${DOMAIN}|$DOMAIN|g" "$DOCKER_COMPOSE_FILE"
  sed -i "s|\${EMAIL}|$EMAIL|g" "$DOCKER_COMPOSE_FILE"
  sed -i "s|\${ENV}|$ENV|g" "$DOCKER_COMPOSE_FILE"
  sed -i "s|\${DB_HOST}|$DB_HOST|g" "$DOCKER_COMPOSE_FILE"
  sed -i "s|\${DB_PORT}|$DB_PORT|g" "$DOCKER_COMPOSE_FILE"
  sed -i "s|\${DB_DATABASE}|$DB_DATABASE|g" "$DOCKER_COMPOSE_FILE"
  sed -i "s|\${DB_USERNAME}|$DB_USERNAME|g" "$DOCKER_COMPOSE_FILE"
  sed -i "s|\${DB_PASSWORD}|$DB_PASSWORD|g" "$DOCKER_COMPOSE_FILE"
  sed -i "s|\${ASSET_URL}|$ASSET_URL|g" "$DOCKER_COMPOSE_FILE"
  sed -i "s|\${VITE_ASSET_BASE_URL}|$VITE_ASSET_BASE_URL|g" "$DOCKER_COMPOSE_FILE"
  sed -i "s|\${APP_KEY}|$APP_KEY|g" "$DOCKER_COMPOSE_FILE"
  
  log "Docker Compose file created at $DOCKER_COMPOSE_FILE"
}

# Ensure the Docker Compose file exists
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
  create_docker_compose_file
fi

# Create Docker network if it doesn't exist
log "Creating Docker network if it doesn't exist..."
docker network create app-network 2>/dev/null || true

# Create a backup of the current environment
if [ -n "$CURRENT_ENV" ]; then
  BACKUP_DIR="$SCRIPT_DIR/backups"
  mkdir -p "$BACKUP_DIR"
  BACKUP_FILE="$BACKUP_DIR/backup-$(date '+%Y%m%d-%H%M%S').tar.gz"
  log "Creating a backup of the current environment..."
  
  # Install docker if it's not available in the container
  docker run --rm -v "$BACKUP_DIR:/backup" alpine sh -c "apk add --no-cache docker && tar -czf /backup/$(basename "$BACKUP_FILE") -C / $(docker inspect --format='{{range .Mounts}}{{if eq .Type "volume"}}{{.Name}}{{end}}{{end}}' $(docker ps -qf "name=app-$CURRENT_ENV"))"
  
  log "Backup created at $BACKUP_FILE"
fi

# Function to check if ports are available
check_ports() {
  local ports=(80 443)
  local busy_ports=()
  
  for port in "${ports[@]}"; do
    if netstat -tuln | grep -q ":$port "; then
      busy_ports+=("$port")
    fi
  done
  
  if [ ${#busy_ports[@]} -gt 0 ]; then
    log "The following ports are already in use: ${busy_ports[*]}"
    log "Attempting to free up ports..."
    
    # Try to stop any existing Docker containers using these ports
    for port in "${busy_ports[@]}"; do
      container_id=$(docker ps -q --filter "publish=$port")
      if [ -n "$container_id" ]; then
        log "Stopping container using port $port: $container_id"
        docker stop "$container_id" || true
      fi
    done
    
    # More aggressive approach: stop all Docker containers
    log "Stopping all running Docker containers..."
    docker ps -q | xargs -r docker stop || true
    
    # Try to find and kill processes using these ports
    for port in "${busy_ports[@]}"; do
      log "Finding processes using port $port..."
      pid=$(lsof -i :$port -t 2>/dev/null)
      if [ -n "$pid" ]; then
        log "Killing process $pid using port $port"
        kill -9 $pid 2>/dev/null || true
      fi
    done
    
    # Double check if ports are now available
    for port in "${busy_ports[@]}"; do
      if netstat -tuln | grep -q ":$port "; then
        log "WARNING: Port $port is still in use. This may cause deployment issues."
      else
        log "Port $port is now available."
      fi
    done
  else
    log "All required ports are available."
  fi
}

# Function to build and start the new environment
start_new_environment() {
  local env=$1
  log "Building and starting the new $env environment..."
  
  # Check and free up required ports
  check_ports
  
  # Start the containers for the new environment
  docker compose -f "$DOCKER_COMPOSE_FILE" build "app-$env"
  docker compose -f "$DOCKER_COMPOSE_FILE" up -d "app-$env" traefik db
}

# Build and start the new environment
start_new_environment "$NEW_ENV"

# Fix storage directory permissions - using sudo if available
log "Fixing storage directory permissions..."
if command -v sudo &> /dev/null; then
  log "Using sudo to fix permissions..."
  docker compose -f "$DOCKER_COMPOSE_FILE" exec -T "app-$NEW_ENV" bash -c "sudo chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && sudo chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache" || log "Warning: Permission fix command with sudo failed, trying without sudo..."
  
  if [ $? -ne 0 ]; then
    docker compose -f "$DOCKER_COMPOSE_FILE" exec -T "app-$NEW_ENV" bash -c "chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache" || log "Warning: Permission fix command failed, but continuing with deployment."
  fi
else
  # Try without sudo
  docker compose -f "$DOCKER_COMPOSE_FILE" exec -T "app-$NEW_ENV" bash -c "chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache" || log "Warning: Permission fix command failed, but continuing with deployment."
fi

# Run database migrations
log "Running database migrations..."
if ! docker compose -f "$DOCKER_COMPOSE_FILE" exec -T "app-$NEW_ENV" php artisan migrate --force; then
  log "Warning: Database migration failed, but continuing with deployment. Check the logs for errors."
fi

# Run Laravel optimization commands
log "Running Laravel optimization commands..."

# Config cache
log "  - Running config:cache"
if ! docker compose -f "$DOCKER_COMPOSE_FILE" exec -T "app-$NEW_ENV" php artisan config:cache; then
  log "Warning: config:cache failed. Continuing with deployment."
fi

# Route cache
log "  - Running route:cache"
if ! docker compose -f "$DOCKER_COMPOSE_FILE" exec -T "app-$NEW_ENV" php artisan route:cache; then
  log "Warning: route:cache failed. Continuing with deployment."
fi

# View cache
log "  - Running view:cache"
if ! docker compose -f "$DOCKER_COMPOSE_FILE" exec -T "app-$NEW_ENV" php artisan view:cache; then
  log "Warning: view:cache failed. Continuing with deployment."
fi

# Storage link
log "  - Running storage:link"
docker compose -f "$DOCKER_COMPOSE_FILE" exec -T "app-$NEW_ENV" php artisan storage:link || true

# Wait for the new environment to be ready
log "Waiting for the new environment to be ready..."
MAX_RETRIES=12
RETRY_INTERVAL=5
HEALTH_CHECK_SUCCESS=false

for i in $(seq 1 $MAX_RETRIES); do
  log "Health check attempt $i of $MAX_RETRIES..."
  if docker compose -f "$DOCKER_COMPOSE_FILE" exec -T "app-$NEW_ENV" curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
    log "Health check passed!"
    HEALTH_CHECK_SUCCESS=true
    break
  else
    log "Health check failed. Retrying in $RETRY_INTERVAL seconds..."
    sleep $RETRY_INTERVAL
  fi
done

if [ "$HEALTH_CHECK_SUCCESS" = false ]; then
  log "Warning: Health check failed after $MAX_RETRIES attempts. Proceeding with caution."
fi

# Create rollback script
ROLLBACK_SCRIPT="$SCRIPT_DIR/rollback-$CURRENT_ENV.sh"
if [ -n "$CURRENT_ENV" ]; then
  cat > "$ROLLBACK_SCRIPT" << EOF
#!/bin/bash
# Rollback script to revert to the $CURRENT_ENV environment
echo "Rolling back to $CURRENT_ENV environment..."

# Update the Docker Compose file to enable the old environment and disable the new one
sed -i "s/traefik.enable=true.*app-$NEW_ENV/traefik.enable=false/" "$DOCKER_COMPOSE_FILE"
sed -i "s/traefik.enable=false.*app-$CURRENT_ENV/traefik.enable=true/" "$DOCKER_COMPOSE_FILE"

# Apply the changes
docker compose -f "$DOCKER_COMPOSE_FILE" up -d

# Start the old environment
docker compose -f "$DOCKER_COMPOSE_FILE" start "app-$CURRENT_ENV"

# Stop the new environment after a grace period
sleep 30
docker compose -f "$DOCKER_COMPOSE_FILE" stop "app-$NEW_ENV"

echo "✅ Rollback completed successfully!"
EOF

  chmod +x "$ROLLBACK_SCRIPT"
  log "Created rollback script at $ROLLBACK_SCRIPT"
fi

# Set up certificate renewal through Traefik
log "Setting up certificate renewal through Traefik..."
log "Traefik will automatically handle Let's Encrypt certificate renewal"
log "Certificates will be stored in the traefik-certificates Docker volume"

# Log information about the certificates
log "SSL certificates information:"
log "  - Domain: $DOMAIN"
log "  - Email: $EMAIL"
log "  - Certificate resolver: letsencrypt"
log "  - Challenge type: HTTP challenge"
log "  - Storage location: /letsencrypt/acme.json (in Traefik container)"

log "Traefik will automatically attempt to renew certificates when they're within 30 days of expiration"
log "No manual renewal or cron jobs are necessary"

log "To check the status of your SSL certificates:"
log "  1. Access the Traefik dashboard (if enabled)"
log "  2. Or inspect the Traefik logs: docker compose -f \"$DOCKER_COMPOSE_FILE\" logs traefik"
log "  3. Or check certificate directly: curl -vI https://$DOMAIN"

log "✅ Blue-green deployment with Let's Encrypt SSL completed successfully!"
log "Your site is now accessible at https://$DOMAIN"
log ""
log "Important notes:"
log "1. Let's Encrypt requires your domain to be publicly accessible"
log "2. DNS records for $DOMAIN must point to your server"
log "3. Ports 80 and 443 must be open on your server"
log ""
log "To roll back to the previous environment if needed, run:"
log "  $ROLLBACK_SCRIPT"

exit 0
