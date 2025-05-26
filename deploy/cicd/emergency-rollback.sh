#!/bin/bash

# Emergency Rollback Script
# Use this to immediately rollback to a working state

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

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

# Load environment variables
if [ -f "$DEPLOY_DIR/.env.deploy" ]; then
  set -a
  . "$DEPLOY_DIR/.env.deploy"
  set +a
fi

# Always resolve SSH_KEY to absolute path
if [ -n "$SSH_KEY" ] && [[ "$SSH_KEY" != /* ]]; then
  SSH_KEY="$DEPLOY_DIR/$SSH_KEY"
fi

# Function to execute SSH commands
execute_ssh() {
  local command="$1"
  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$PUBLIC_IP" "$command"
}

log "🚨 EMERGENCY ROLLBACK - Fixing broken deployment"

# Step 1: Check current container status
log "Checking current container status..."
execute_ssh "cd /opt/portfolio && docker compose -f docker/docker-compose.yml ps"

# Step 2: Determine which environment to rollback to
log "Determining rollback target..."
blue_running=$(execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml ps php_blue 2>/dev/null | grep -c 'Up'" || echo "0")
green_running=$(execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml ps php_green 2>/dev/null | grep -c 'Up'" || echo "0")

if [[ "$blue_running" -gt "0" ]]; then
  ROLLBACK_ENV="blue"
  log "Rolling back to BLUE environment"
elif [[ "$green_running" -gt "0" ]]; then
  ROLLBACK_ENV="green"  
  log "Rolling back to GREEN environment"
else
  # Start blue as default
  ROLLBACK_ENV="blue"
  log "No containers running, starting BLUE environment as default"
  execute_ssh "cd /opt/portfolio && docker compose -f docker/docker-compose.yml up -d php_blue nginx_blue"
  sleep 30
fi

# Step 3: Fix Traefik configuration
log "Fixing Traefik configuration to point to $ROLLBACK_ENV..."
execute_ssh "cd /opt/portfolio && cp docker/traefik-dynamic.yml docker/traefik-dynamic.yml.backup"
execute_ssh "cd /opt/portfolio && cat > docker/traefik-dynamic.yml << 'EOF'
http:
  services:
    web-$ROLLBACK_ENV:
      loadBalancer:
        servers:
          - url: \"http://nginx_$ROLLBACK_ENV:80\"

  routers:
    web:
      rule: \"Host(\`harun.dev\`) || Host(\`www.harun.dev\`)\"
      service: web-$ROLLBACK_ENV
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt
    web-insecure:
      rule: \"Host(\`harun.dev\`) || Host(\`www.harun.dev\`)\"
      service: web-$ROLLBACK_ENV
      entryPoints:
        - web
      middlewares:
        - redirect-to-https

  middlewares:
    redirect-to-https:
      redirectScheme:
        scheme: https
        permanent: true
EOF"

# Step 4: Ensure rollback environment is healthy
log "Ensuring $ROLLBACK_ENV environment is running and healthy..."
execute_ssh "cd /opt/portfolio && docker compose -f docker/docker-compose.yml up -d php_$ROLLBACK_ENV nginx_$ROLLBACK_ENV"

# Wait for containers to be ready
sleep 30

# Step 5: Test health
log "Testing $ROLLBACK_ENV environment health..."
for i in {1..10}; do
  if execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml exec -T nginx_$ROLLBACK_ENV curl -f -s http://localhost:80/ > /dev/null"; then
    success "$ROLLBACK_ENV environment is responding"
    break
  fi
  log "Waiting for $ROLLBACK_ENV environment... (attempt $i/10)"
  sleep 5
done

# Step 6: Stop other environment
OTHER_ENV="green"
if [[ "$ROLLBACK_ENV" == "green" ]]; then
  OTHER_ENV="blue"
fi

log "Stopping $OTHER_ENV environment..."
execute_ssh "cd /opt/portfolio && docker compose -f docker/docker-compose.yml stop php_$OTHER_ENV nginx_$OTHER_ENV || true"

# Step 7: Test public endpoints
log "Testing public endpoints..."
if curl -f -s --max-time 30 "https://harun.dev" > /dev/null; then
  success "✅ HTTPS endpoint is responding"
else
  warning "⚠️ HTTPS endpoint test failed"
fi

if curl -f -s --max-time 30 "http://$PUBLIC_IP" > /dev/null; then
  success "✅ HTTP endpoint is responding"
else
  warning "⚠️ HTTP endpoint test failed"
fi

success "🎉 Emergency rollback completed!"
success "Active environment: $ROLLBACK_ENV"
success "Site: https://harun.dev"
success "Traefik Dashboard: http://$PUBLIC_IP:8080"

log "Next steps:"
log "1. Check the site: https://harun.dev"
log "2. Review logs: docker compose -f docker/docker-compose.yml logs php_$ROLLBACK_ENV nginx_$ROLLBACK_ENV"
log "3. Fix the deployment issues before next deployment" 