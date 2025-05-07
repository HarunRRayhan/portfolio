#!/bin/bash

set -e
set -o pipefail

# Get absolute path to script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

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

# 1. Start
step 1 "Running terraform apply -auto-approve"
cd "$SCRIPT_DIR/terraform"
terraform apply -auto-approve
success "Terraform apply completed."

# 2. Extract outputs
step 2 "Extracting Terraform outputs"
terraform output -json > ../terraform-outputs.json
cd "$SCRIPT_DIR"
PUBLIC_IP=$(jq -r '.public_ip.value' terraform-outputs.json)
PRIVATE_KEY=$(jq -r '.private_key.value' terraform-outputs.json)
success "Extracted outputs: PUBLIC_IP=$PUBLIC_IP"

# 3. Update .env.deploy
step 3 "Updating .env.deploy with new PUBLIC_IP"
update_env_deploy "$PUBLIC_IP"
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