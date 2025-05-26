#!/bin/bash

# Blue-Green Deployment Status Script
# Usage: ./status.sh

set -e

# Get absolute path to script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment variables
if [ -f "$DEPLOY_DIR/.env.deploy" ]; then
  set -a
  . "$DEPLOY_DIR/.env.deploy"
  set +a
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to execute SSH commands
execute_ssh() {
  local command="$1"
  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$PUBLIC_IP" "$command"
}

echo -e "${BLUE}🔍 Blue-Green Deployment Status${NC}"
echo -e "${BLUE}================================${NC}\n"

# Check if we can connect to the server
if ! execute_ssh "echo 'Connection successful'" > /dev/null 2>&1; then
  echo -e "${RED}❌ Cannot connect to server $PUBLIC_IP${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Server connection: OK${NC}"
echo -e "${CYAN}📍 Server: $PUBLIC_IP${NC}\n"

# Get current active environment from Traefik
echo -e "${BLUE}🔄 Checking active environment...${NC}"
ACTIVE_SERVICE=$(execute_ssh "curl -s http://localhost:8080/api/rawdata 2>/dev/null | jq -r '.http.services | to_entries[] | select(.value.loadBalancer.servers[0].url | contains(\"nginx_\")) | .key' | head -1" 2>/dev/null || echo "unknown")

if [[ "$ACTIVE_SERVICE" == "web-blue" ]]; then
  ACTIVE_ENV="blue"
  INACTIVE_ENV="green"
elif [[ "$ACTIVE_SERVICE" == "web-green" ]]; then
  ACTIVE_ENV="green"
  INACTIVE_ENV="blue"
else
  # Check which containers are actually running
  BLUE_RUNNING=$(execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml ps php_blue 2>/dev/null | grep -c 'Up'" || echo "0")
  GREEN_RUNNING=$(execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml ps php_green 2>/dev/null | grep -c 'Up'" || echo "0")
  
  if [[ "$GREEN_RUNNING" -gt "0" ]]; then
    ACTIVE_ENV="green"
    INACTIVE_ENV="blue"
  elif [[ "$BLUE_RUNNING" -gt "0" ]]; then
    ACTIVE_ENV="blue"
    INACTIVE_ENV="green"
  else
    ACTIVE_ENV="unknown"
    INACTIVE_ENV="unknown"
  fi
fi

echo -e "${GREEN}🟢 Active Environment: ${ACTIVE_ENV}${NC}"
echo -e "${YELLOW}🟡 Inactive Environment: ${INACTIVE_ENV}${NC}\n"

# Check container status
echo -e "${BLUE}📦 Container Status${NC}"
echo -e "${BLUE}==================${NC}"

CONTAINER_STATUS=$(execute_ssh "cd /opt/portfolio && docker compose -f docker/docker-compose.yml ps --format 'table {{.Name}}\t{{.Status}}\t{{.Ports}}'")
echo "$CONTAINER_STATUS"
echo ""

# Enhanced container analysis
echo -e "${PURPLE}🔍 Container Analysis${NC}"
echo -e "${PURPLE}=====================${NC}"

# Check blue environment
BLUE_PHP_STATUS=$(execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml ps php_blue 2>/dev/null | grep -o 'Up\|Exited\|Down'" || echo "Not Found")
BLUE_NGINX_STATUS=$(execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml ps nginx_blue 2>/dev/null | grep -o 'Up\|Exited\|Down'" || echo "Not Found")

# Check green environment
GREEN_PHP_STATUS=$(execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml ps php_green 2>/dev/null | grep -o 'Up\|Exited\|Down'" || echo "Not Found")
GREEN_NGINX_STATUS=$(execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml ps nginx_green 2>/dev/null | grep -o 'Up\|Exited\|Down'" || echo "Not Found")

# Display blue environment status
if [[ "$BLUE_PHP_STATUS" == "Up" && "$BLUE_NGINX_STATUS" == "Up" ]]; then
  echo -e "${GREEN}🔵 Blue Environment: RUNNING${NC}"
elif [[ "$BLUE_PHP_STATUS" == "Not Found" && "$BLUE_NGINX_STATUS" == "Not Found" ]]; then
  echo -e "${YELLOW}🔵 Blue Environment: NOT DEPLOYED${NC}"
else
  echo -e "${RED}🔵 Blue Environment: PARTIAL/FAILED${NC}"
fi

# Display green environment status
if [[ "$GREEN_PHP_STATUS" == "Up" && "$GREEN_NGINX_STATUS" == "Up" ]]; then
  echo -e "${GREEN}🟢 Green Environment: RUNNING${NC}"
elif [[ "$GREEN_PHP_STATUS" == "Not Found" && "$GREEN_NGINX_STATUS" == "Not Found" ]]; then
  echo -e "${YELLOW}🟢 Green Environment: NOT DEPLOYED${NC}"
else
  echo -e "${RED}🟢 Green Environment: PARTIAL/FAILED${NC}"
fi

echo ""

# Check health endpoints
echo -e "${BLUE}🏥 Health Check Status${NC}"
echo -e "${BLUE}======================${NC}"

# Test main health endpoint
HEALTH_RESPONSE=$(execute_ssh "curl -s -w '%{http_code}' http://localhost/health" 2>/dev/null || echo "000")
HEALTH_CODE="${HEALTH_RESPONSE: -3}"
if [[ "$HEALTH_CODE" == "200" ]]; then
  echo -e "${GREEN}✅ Main health endpoint: OK${NC}"
else
  echo -e "${RED}❌ Main health endpoint: FAILED (HTTP $HEALTH_CODE)${NC}"
fi

# Test blue environment health (if containers exist)
if [[ "$BLUE_PHP_STATUS" == "Up" && "$BLUE_NGINX_STATUS" == "Up" ]]; then
  if execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml exec -T nginx_blue curl -f -s http://localhost:80/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Blue environment health: OK${NC}"
  else
    echo -e "${RED}❌ Blue environment health: FAILED${NC}"
  fi
else
  echo -e "${YELLOW}⏸️  Blue environment: NOT RUNNING${NC}"
fi

# Test green environment health (if containers exist)
if [[ "$GREEN_PHP_STATUS" == "Up" && "$GREEN_NGINX_STATUS" == "Up" ]]; then
  if execute_ssh "docker compose -f /opt/portfolio/docker/docker-compose.yml exec -T nginx_green curl -f -s http://localhost:80/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Green environment health: OK${NC}"
  else
    echo -e "${RED}❌ Green environment health: FAILED${NC}"
  fi
else
  echo -e "${YELLOW}⏸️  Green environment: NOT RUNNING${NC}"
fi

echo ""

# Check public endpoints
echo -e "${BLUE}🌐 Public Endpoint Status${NC}"
echo -e "${BLUE}=========================${NC}"

# Test HTTP endpoint
if curl -f -s "http://$PUBLIC_IP" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ HTTP endpoint (http://$PUBLIC_IP): OK${NC}"
else
  echo -e "${RED}❌ HTTP endpoint (http://$PUBLIC_IP): FAILED${NC}"
fi

# Test HTTPS endpoint
if curl -f -s "https://harun.dev" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ HTTPS endpoint (https://harun.dev): OK${NC}"
else
  echo -e "${RED}❌ HTTPS endpoint (https://harun.dev): FAILED${NC}"
fi

echo ""

# Show Traefik routing information
echo -e "${BLUE}🚦 Traefik Routing Configuration${NC}"
echo -e "${BLUE}================================${NC}"

TRAEFIK_CONFIG=$(execute_ssh "curl -s http://localhost:8080/api/rawdata 2>/dev/null | jq -r '.http.services | to_entries[] | select(.key | startswith(\"web-\")) | \"\\(.key): \\(.value.loadBalancer.servers[0].url)\"'" 2>/dev/null || echo "Unable to fetch Traefik configuration")
echo "$TRAEFIK_CONFIG"

echo ""

# Show deployment readiness
echo -e "${PURPLE}🎯 Deployment Readiness${NC}"
echo -e "${PURPLE}=======================${NC}"

# Determine next deployment target
if [[ "$ACTIVE_ENV" == "blue" ]]; then
  NEXT_TARGET="green"
elif [[ "$ACTIVE_ENV" == "green" ]]; then
  NEXT_TARGET="blue"
else
  NEXT_TARGET="green"
fi

# Check if target environment is clear for deployment
if [[ "$NEXT_TARGET" == "blue" ]]; then
  if [[ "$BLUE_PHP_STATUS" == "Up" || "$BLUE_NGINX_STATUS" == "Up" ]]; then
    echo -e "${YELLOW}⚠️  Next target ($NEXT_TARGET) has running containers - deployment will switch to opposite environment${NC}"
  else
    echo -e "${GREEN}✅ Next target ($NEXT_TARGET) is clear for deployment${NC}"
  fi
elif [[ "$NEXT_TARGET" == "green" ]]; then
  if [[ "$GREEN_PHP_STATUS" == "Up" || "$GREEN_NGINX_STATUS" == "Up" ]]; then
    echo -e "${YELLOW}⚠️  Next target ($NEXT_TARGET) has running containers - deployment will switch to opposite environment${NC}"
  else
    echo -e "${GREEN}✅ Next target ($NEXT_TARGET) is clear for deployment${NC}"
  fi
fi

echo ""

# Show recent deployment information
echo -e "${BLUE}📋 Recent Deployment Info${NC}"
echo -e "${BLUE}=========================${NC}"

# Get git information
GIT_INFO=$(execute_ssh "cd /opt/portfolio && git log --oneline -1 && echo 'Branch:' \$(git rev-parse --abbrev-ref HEAD)" 2>/dev/null || echo "Unable to fetch git information")
echo "$GIT_INFO"

echo ""

# Show useful links
echo -e "${BLUE}🔗 Useful Links${NC}"
echo -e "${BLUE}===============${NC}"
echo -e "${CYAN}🌍 Production Site: https://harun.dev${NC}"
echo -e "${CYAN}📊 Traefik Dashboard: http://$PUBLIC_IP:8080${NC}"
echo -e "${CYAN}🏥 Health Endpoint: http://$PUBLIC_IP/health${NC}"

echo ""

# Show quick commands
echo -e "${BLUE}⚡ Quick Commands${NC}"
echo -e "${BLUE}=================${NC}"
echo -e "${CYAN}Auto-deploy (smart target selection):${NC} ./deploy/cicd/blue-green-deploy.sh"
echo -e "${CYAN}Deploy to blue:${NC} ./deploy/cicd/blue-green-deploy.sh blue"
echo -e "${CYAN}Deploy to green:${NC} ./deploy/cicd/blue-green-deploy.sh green"
echo -e "${CYAN}View all logs:${NC} ssh -i $SSH_KEY $REMOTE_USER@$PUBLIC_IP 'cd /opt/portfolio && docker compose -f docker/docker-compose.yml logs -f'"
echo -e "${CYAN}View active environment logs:${NC} ssh -i $SSH_KEY $REMOTE_USER@$PUBLIC_IP 'cd /opt/portfolio && docker compose -f docker/docker-compose.yml logs -f php_$ACTIVE_ENV nginx_$ACTIVE_ENV'"

echo ""

# Show deployment strategy summary
echo -e "${PURPLE}📋 Deployment Strategy Summary${NC}"
echo -e "${PURPLE}==============================${NC}"
echo -e "${CYAN}1. NPM build and R2 upload (local)${NC}"
echo -e "${CYAN}2. Smart environment detection${NC}"
echo -e "${CYAN}3. Deploy to available environment${NC}"
echo -e "${CYAN}4. Health checks and validation${NC}"
echo -e "${CYAN}5. Zero-downtime traffic switch${NC}"
echo -e "${CYAN}6. Environment rotation (green → blue)${NC}"
echo -e "${CYAN}7. CDN cache purge${NC}"

echo ""
echo -e "${GREEN}✨ Status check completed!${NC}" 