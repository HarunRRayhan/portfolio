#!/bin/bash

set -e
set -o pipefail

# Get absolute path to script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Set up logging
LOG_DIR="$SCRIPT_DIR/log"
mkdir -p "$LOG_DIR"
if [ -f "$LOG_DIR/infra-create.log" ]; then
  mv "$LOG_DIR/infra-create.log" "$LOG_DIR/infra-create-$(date '+%Y%m%d-%H%M%S').log"
fi
LOG_FILE="$LOG_DIR/infra-create.log"
exec > >(tee -a "$LOG_FILE") 2>&1

# Colors for output
GREEN='\033[0;32m'
CYAN='\033[1;36m'
MAGENTA='\033[1;35m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_START_TIME=$(date +%s)
echo -e "\n${MAGENTA}==============================================="
echo -e "   🚀 Harun's Portfolio Infra Provision Script 🚀"
echo -e "===============================================${NC}\n"
echo "Started at: $(date)"

STEP_TIMES=()

step() {
  STEP_NUM=$1
  STEP_NAME="$2"
  echo -e "\n${CYAN}++++++++++++++++++++++++++++++++++++++++++++++"
  printf '+++   STEP %d: %s   +++\n' "$STEP_NUM" "$STEP_NAME"
  echo -e "++++++++++++++++++++++++++++++++++++++++++++++${NC}\n"
  STEP_START_TIME=$(date +%s)
}

success() {
  echo -e "${GREEN}$1${NC}"
  STEP_END_TIME=$(date +%s)
  STEP_DURATION=$((STEP_END_TIME - STEP_START_TIME))
  echo -e "${YELLOW}Step took $STEP_DURATION seconds.${NC}\n"
  STEP_TIMES+=("$STEP_DURATION")
}

fail() {
  echo -e "${RED}$1${NC}"
  STEP_END_TIME=$(date +%s)
  STEP_DURATION=$((STEP_END_TIME - STEP_START_TIME))
  echo -e "${YELLOW}Step took $STEP_DURATION seconds.${NC}\n"
  STEP_TIMES+=("$STEP_DURATION")
}

print_total_time() {
  SCRIPT_END_TIME=$(date +%s)
  TOTAL_DURATION=$((SCRIPT_END_TIME - SCRIPT_START_TIME))
  echo -e "\n${MAGENTA}==============================================="
  echo -e "   🎉 Infrastructure provisioned in $TOTAL_DURATION seconds! 🎉"
  echo -e "===============================================${NC}\n"
  for i in $(seq 1 ${#STEP_TIMES[@]}); do
    echo "Step $i took: ${STEP_TIMES[$((i-1))]:-N/A} seconds"
  done
}

update_env_deploy() {
    local ip="$1"
    sed -i '' "s/^PUBLIC_IP=.*/PUBLIC_IP=$ip/" "$SCRIPT_DIR/.env.deploy"
}

update_portfolio_key() {
    local key="$1"
    echo -e "$key" > "$SCRIPT_DIR/portfolio-key.pem"
    chmod 600 "$SCRIPT_DIR/portfolio-key.pem"
}

update_env_asset_urls() {
    local vite_url="$1"
    local asset_url="$2"
    if grep -q '^VITE_ASSET_BASE_URL=' "$SCRIPT_DIR/.env.deploy"; then
        sed -i '' "s|^VITE_ASSET_BASE_URL=.*|VITE_ASSET_BASE_URL=$vite_url|" "$SCRIPT_DIR/.env.deploy"
    else
        echo "VITE_ASSET_BASE_URL=$vite_url" >> "$SCRIPT_DIR/.env.deploy"
    fi
    if grep -q '^ASSET_URL=' "$SCRIPT_DIR/.env.deploy"; then
        sed -i '' "s|^ASSET_URL=.*|ASSET_URL=$asset_url|" "$SCRIPT_DIR/.env.deploy"
    else
        echo "ASSET_URL=$asset_url" >> "$SCRIPT_DIR/.env.deploy"
    fi
}

wait_for_ssh() {
    local ip="$1"
    local key_file="$2"
    local user="ubuntu"
    echo -e "${YELLOW}[INFO] Waiting for SSH to become available at $ip...${NC}"
    sleep 120
    while ! ssh -o StrictHostKeyChecking=no -i "$key_file" -o ConnectTimeout=10 $user@$ip 'echo SSH is up' 2>/dev/null; do
        echo -e "${YELLOW}[WARN] SSH not available yet. Retrying in 60 seconds...${NC}"
        sleep 60
    done
    echo -e "${GREEN}[INFO] SSH is now available.${NC}"
}

# Extract R2 and Cloudflare variables for Terraform
R2_BUCKET_NAME=$(grep '^R2_BUCKET_NAME=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"')
CLOUDFLARE_ACCOUNT_ID=$(grep '^CLOUDFLARE_ACCOUNT_ID=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"')
CLOUDFLARE_ZONE_ID=$(grep '^CLOUDFLARE_ZONE_ID=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"')
CLOUDFLARE_API_TOKEN=$(grep '^CLOUDFLARE_API_TOKEN=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"')

echo "[DEBUG] R2_BUCKET_NAME: '$R2_BUCKET_NAME'"
echo "[DEBUG] CLOUDFLARE_ACCOUNT_ID: '$CLOUDFLARE_ACCOUNT_ID'"
echo "[DEBUG] CLOUDFLARE_ZONE_ID: '$CLOUDFLARE_ZONE_ID'"
echo "[DEBUG] CLOUDFLARE_API_TOKEN: '$CLOUDFLARE_API_TOKEN'"

if [ -z "$R2_BUCKET_NAME" ] || [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo "[ERROR] R2_BUCKET_NAME or CLOUDFLARE_ACCOUNT_ID is empty. Check your .env.deploy file."
  exit 1
fi

# 1. Start
step 1 "Running terraform apply -auto-approve"
cd "$SCRIPT_DIR/terraform"
echo "[DEBUG] Running: terraform apply -auto-approve -var=\"r2_bucket_name=$R2_BUCKET_NAME\" -var=\"cloudflare_account_id=$CLOUDFLARE_ACCOUNT_ID\""
terraform apply -auto-approve \
  -var="r2_bucket_name=$R2_BUCKET_NAME" \
  -var="cloudflare_account_id=$CLOUDFLARE_ACCOUNT_ID"
APPLY_STATUS=$?
if [ $APPLY_STATUS -ne 0 ]; then
  echo "[ERROR] Terraform apply failed with status $APPLY_STATUS" >&2
  exit $APPLY_STATUS
fi
success "Terraform apply completed."

# 2. Extract outputs
step 2 "Extracting Terraform outputs"
terraform output -json > "$SCRIPT_DIR/terraform-outputs.json"
PUBLIC_IP=$(jq -r '.public_ip.value' "$SCRIPT_DIR/terraform-outputs.json")
PRIVATE_KEY=$(jq -r '.private_key.value' "$SCRIPT_DIR/terraform-outputs.json")
VITE_ASSET_BASE_URL=$(jq -r '.vite_asset_base_url.value' "$SCRIPT_DIR/terraform-outputs.json")
ASSET_URL=$(jq -r '.asset_url.value' "$SCRIPT_DIR/terraform-outputs.json")
success "Extracted outputs: PUBLIC_IP=$PUBLIC_IP, VITE_ASSET_BASE_URL=$VITE_ASSET_BASE_URL, ASSET_URL=$ASSET_URL"
cd "$SCRIPT_DIR"

# 3. Update .env.deploy
step 3 "Updating .env.deploy with new PUBLIC_IP and asset URLs"
update_env_deploy "$PUBLIC_IP"
update_env_asset_urls "$VITE_ASSET_BASE_URL" "$ASSET_URL"
# Always ensure VITE_ASSET_BASE_URL and ASSET_URL are present in .env.deploy
if grep -q '^VITE_ASSET_BASE_URL=' "$SCRIPT_DIR/.env.deploy"; then
    sed -i '' "s|^VITE_ASSET_BASE_URL=.*|VITE_ASSET_BASE_URL=$VITE_ASSET_BASE_URL|" "$SCRIPT_DIR/.env.deploy"
else
    echo "VITE_ASSET_BASE_URL=$VITE_ASSET_BASE_URL" >> "$SCRIPT_DIR/.env.deploy"
fi
if grep -q '^ASSET_URL=' "$SCRIPT_DIR/.env.deploy"; then
    sed -i '' "s|^ASSET_URL=.*|ASSET_URL=$ASSET_URL|" "$SCRIPT_DIR/.env.deploy"
else
    echo "ASSET_URL=$ASSET_URL" >> "$SCRIPT_DIR/.env.deploy"
fi
success ".env.deploy updated."

# 4. Update portfolio-key.pem
step 4 "Updating portfolio-key.pem with new private key"
update_portfolio_key "$PRIVATE_KEY"
success "portfolio-key.pem updated."

# 5. Wait for SSH
step 5 "Waiting for SSH to become available"
wait_for_ssh "$PUBLIC_IP" "$SCRIPT_DIR/portfolio-key.pem"
success "SSH is available."

print_total_time
