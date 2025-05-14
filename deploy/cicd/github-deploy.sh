#!/bin/bash

# GitHub Actions Deployment Script
# This script is executed by GitHub Actions to deploy the application

set -e
set -o pipefail

# Get absolute path to script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
APP_DIR="${APP_DIR:-/opt/portfolio}"
DOCKER_DIR="${APP_DIR}/docker"
CI_DIR="${DOCKER_DIR}/ci"

# Validate required environment variables first, before any other operations
echo "Validating required environment variables..."
REQUIRED_VARS=("POSTGRES_DB" "POSTGRES_USER" "POSTGRES_PASSWORD" "R2_BUCKET_NAME" "R2_S3_ENDPOINT" "R2_ACCESS_KEY_ID" "R2_SECRET_ACCESS_KEY" "CLOUDFLARE_ZONE_ID" "CLOUDFLARE_API_TOKEN")
MISSING_VARS=""

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS="$MISSING_VARS $var"
  fi
done

if [ ! -z "$MISSING_VARS" ]; then
  echo "ERROR: Missing required environment variables:$MISSING_VARS"
  echo "Please ensure all required environment variables are set in the GitHub repository secrets."
  exit 1
fi

echo "All required environment variables are present."

# Environment variables
DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-production}"
BRANCH_NAME="${BRANCH_NAME:-main}"

# Set up logging
LOG_DIR="${APP_DIR}/logs"
# Create log directory if it doesn't exist and ensure we have permission
mkdir -p "$LOG_DIR" 2>/dev/null || {
  echo "Warning: Cannot create log directory at $LOG_DIR, using /tmp for logs instead"
  LOG_DIR="/tmp"
}
LOG_FILE="$LOG_DIR/github-deploy-${DEPLOYMENT_ENV}.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "==============================================="
echo "   🚀 GitHub Actions Deployment Script 🚀"
echo "==============================================="
echo "Started at: $(date)"
echo "Environment: $DEPLOYMENT_ENV"
echo "Branch: $BRANCH_NAME"

# 1. Ensure all required directories exist
echo "Step 1: Ensuring required directories exist"
mkdir -p "${DOCKER_DIR}/ci"
mkdir -p "${APP_DIR}/logs" 2>/dev/null || echo "Note: Using temporary directory for logs instead"

# 2. Clone or update the repository
echo "Step 2: Updating repository"
cd "$APP_DIR"

# Checkout the specific branch
git fetch origin
git checkout $BRANCH_NAME
git pull origin $BRANCH_NAME

# 3. Ensure all CI scripts are executable
echo "Step 3: Making CI scripts executable"
chmod +x "${DOCKER_DIR}/ci/"*.sh 2>/dev/null || true
chmod +x "${DEPLOY_DIR}/cicd/ci-deploy.sh" 2>/dev/null || true

# Ensure proper ownership of files
echo "Ensuring proper ownership of files"
sudo chown -R $(whoami):$(whoami) "${APP_DIR}" 2>/dev/null || true

# 4. Create environment-specific configuration
echo "Step 4: Creating environment-specific configuration"
ENV_FILE="${APP_DIR}/.env.${DEPLOYMENT_ENV}"

# Make sure we can write to the environment file location
touch "$ENV_FILE" 2>/dev/null || {
  echo "Warning: Cannot write to $ENV_FILE, using alternate location"
  ENV_FILE="${APP_DIR}/docker/.env.${DEPLOYMENT_ENV}"
  # Try docker directory
  touch "$ENV_FILE" 2>/dev/null || {
    echo "Warning: Cannot write to $ENV_FILE either, using /tmp"
    ENV_FILE="/tmp/.env.${DEPLOYMENT_ENV}"
  }
}

# Create or update environment-specific .env file
cat > "$ENV_FILE" << EOF
# Environment: ${DEPLOYMENT_ENV}
# Branch: ${BRANCH_NAME}
# Generated at: $(date)

# Database configuration
POSTGRES_DB=${POSTGRES_DB}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# Cloudflare R2 configuration
R2_BUCKET_NAME=${R2_BUCKET_NAME}
R2_S3_ENDPOINT=${R2_S3_ENDPOINT}
R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}
R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}

# Cloudflare configuration
CLOUDFLARE_ZONE_ID=${CLOUDFLARE_ZONE_ID}
CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}

# Docker resource limits
MIN_APP_INSTANCES=1
MAX_APP_INSTANCES=2
APP_CPU_LIMIT=0.6
APP_MEMORY_LIMIT=300M
NGINX_CPU_LIMIT=0.3
NGINX_MEMORY_LIMIT=150M
DB_CPU_LIMIT=0.8
DB_MEMORY_LIMIT=450M
MAX_APP_CPU_LIMIT=0.8
MAX_APP_MEMORY_LIMIT=400M
MAX_NGINX_CPU_LIMIT=0.5
MAX_NGINX_MEMORY_LIMIT=200M
MAX_DB_CPU_LIMIT=1.0
MAX_DB_MEMORY_LIMIT=600M
EOF

# Copy environment file to .env.deploy for the deployment script
# Make sure we can write to the destination
DEPLOY_ENV_FILE="${APP_DIR}/.env.deploy"
touch "$DEPLOY_ENV_FILE" 2>/dev/null || {
  echo "Warning: Cannot write to $DEPLOY_ENV_FILE, using alternate location"
  DEPLOY_ENV_FILE="${APP_DIR}/docker/.env.deploy"
  # Try docker directory
  touch "$DEPLOY_ENV_FILE" 2>/dev/null || {
    echo "Warning: Cannot write to $DEPLOY_ENV_FILE either, using /tmp"
    DEPLOY_ENV_FILE="/tmp/.env.deploy"
  }
}

# Copy the environment file
cp "$ENV_FILE" "$DEPLOY_ENV_FILE"

# 5. Run the CI deployment script
echo "Step 5: Running CI deployment script"
# Pass the environment file location to the CI script
export ENV_FILE_PATH="$DEPLOY_ENV_FILE"

# Run the CI deployment script with environment variables
DEPLOYMENT_ENV="$DEPLOYMENT_ENV" \
BRANCH_NAME="$BRANCH_NAME" \
POSTGRES_DB="$POSTGRES_DB" \
POSTGRES_USER="$POSTGRES_USER" \
POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
R2_BUCKET_NAME="$R2_BUCKET_NAME" \
R2_S3_ENDPOINT="$R2_S3_ENDPOINT" \
R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
CLOUDFLARE_ZONE_ID="$CLOUDFLARE_ZONE_ID" \
CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" \
"${DEPLOY_DIR}/cicd/ci-deploy.sh"

# Check if the deployment was successful
if [ $? -ne 0 ]; then
  echo "Error: Deployment failed. Check the logs for details."
  exit 1
fi

# 6. Save deployment information
echo "Step 6: Saving deployment information"
DEPLOY_INFO_FILE="${DEPLOY_DIR}/deployments/${DEPLOYMENT_ENV}-latest.txt"
mkdir -p "${DEPLOY_DIR}/deployments"

cat > "$DEPLOY_INFO_FILE" << EOF
Environment: ${DEPLOYMENT_ENV}
Branch: ${BRANCH_NAME}
Deployed at: $(date)
Deployment successful: Yes
EOF

echo "==============================================="
echo "   ✅ GitHub Actions Deployment Completed ✅"
echo "==============================================="
echo "Environment: $DEPLOYMENT_ENV"
echo "Branch: $BRANCH_NAME"
echo "Completed at: $(date)"

exit 0