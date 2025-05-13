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

SCRIPT_START_TIME=$(date +%s)
echo -e "\n==============================================="
echo -e "   🚀 Harun's Portfolio Infra Provision Script 🚀"
echo -e "===============================================\n"
echo "Started at: $(date)"

STEP_TIMES=()

step() {
  STEP_NUM=$1
  STEP_NAME="$2"
  echo -e "\n++++++++++++++++++++++++++++++++++++++++++++++"
  printf '+++   STEP %d: %s   +++\n' "$STEP_NUM" "$STEP_NAME"
  echo -e "++++++++++++++++++++++++++++++++++++++++++++++\n"
  STEP_START_TIME=$(date +%s)
}

success() {
  echo "$1"
  STEP_END_TIME=$(date +%s)
  STEP_DURATION=$((STEP_END_TIME - STEP_START_TIME))
  echo "Step took $STEP_DURATION seconds.\n"
  STEP_TIMES+=("$STEP_DURATION")
}

fail() {
  echo "$1"
  STEP_END_TIME=$(date +%s)
  STEP_DURATION=$((STEP_END_TIME - STEP_START_TIME))
  echo "Step took $STEP_DURATION seconds.\n"
  STEP_TIMES+=("$STEP_DURATION")
}

print_total_time() {
  SCRIPT_END_TIME=$(date +%s)
  TOTAL_DURATION=$((SCRIPT_END_TIME - SCRIPT_START_TIME))
  echo -e "\n==============================================="
  echo -e "   🎉 Infrastructure provisioned in $TOTAL_DURATION seconds! 🎉"
  echo -e "===============================================\n"
  for i in $(seq 1 ${#STEP_TIMES[@]}); do
    echo "Step $i took: ${STEP_TIMES[$((i-1))]:-N/A} seconds"
  done
}

update_env_deploy() {
    local ip="$1"
    if [ -f "$SCRIPT_DIR/.env.deploy" ]; then
        if grep -q '^PUBLIC_IP=' "$SCRIPT_DIR/.env.deploy"; then
            sed -i '' "s|^PUBLIC_IP=.*|PUBLIC_IP=$ip|" "$SCRIPT_DIR/.env.deploy"
        else
            echo "PUBLIC_IP=$ip" >> "$SCRIPT_DIR/.env.deploy"
        fi
    else
        echo "PUBLIC_IP=$ip" > "$SCRIPT_DIR/.env.deploy"
    fi
}

update_env_asset_urls() {
    local vite_asset_base_url="$1"
    local asset_url="$2"
    if [ -f "$SCRIPT_DIR/.env.deploy" ]; then
        if grep -q '^VITE_ASSET_BASE_URL=' "$SCRIPT_DIR/.env.deploy"; then
            sed -i '' "s|^VITE_ASSET_BASE_URL=.*|VITE_ASSET_BASE_URL=$vite_asset_base_url|" "$SCRIPT_DIR/.env.deploy"
        else
            echo "VITE_ASSET_BASE_URL=$vite_asset_base_url" >> "$SCRIPT_DIR/.env.deploy"
        fi
        if grep -q '^ASSET_URL=' "$SCRIPT_DIR/.env.deploy"; then
            sed -i '' "s|^ASSET_URL=.*|ASSET_URL=$asset_url|" "$SCRIPT_DIR/.env.deploy"
        else
            echo "ASSET_URL=$asset_url" >> "$SCRIPT_DIR/.env.deploy"
        fi
    else
        echo "VITE_ASSET_BASE_URL=$vite_asset_base_url" > "$SCRIPT_DIR/.env.deploy"
        echo "ASSET_URL=$asset_url" >> "$SCRIPT_DIR/.env.deploy"
    fi
}

update_portfolio_key() {
    local private_key="$1"
    echo "$private_key" > "$SCRIPT_DIR/portfolio-key.pem"
    chmod 600 "$SCRIPT_DIR/portfolio-key.pem"
}

wait_for_ssh() {
    local ip="$1"
    local key="$2"
    local max_attempts=30
    local attempt=1
    
    echo "Waiting for SSH to become available on $ip..."
    while [ $attempt -le $max_attempts ]; do
        if ssh -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=5 -i "$key" ubuntu@$ip echo "SSH is available"; then
            return 0
        fi
        echo "Attempt $attempt/$max_attempts: SSH not yet available, waiting..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    echo "SSH did not become available after $max_attempts attempts."
    return 1
}

# 1. Apply Terraform
step 1 "Applying Terraform"
cd "$SCRIPT_DIR/terraform"

# Load required variables from .env.deploy
if [ -f "$SCRIPT_DIR/.env.deploy" ]; then
    R2_BUCKET_NAME=$(grep '^R2_BUCKET_NAME=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"')
    CLOUDFLARE_ACCOUNT_ID=$(grep '^CLOUDFLARE_ACCOUNT_ID=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"')
    TF_S3_BACKEND_BUCKET=$(grep '^TF_S3_BACKEND_BUCKET=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"')
fi

if [ -z "$R2_BUCKET_NAME" ] || [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo "Error: R2_BUCKET_NAME and CLOUDFLARE_ACCOUNT_ID must be set in .env.deploy"
    exit 1
fi

echo "[DEBUG] R2_BUCKET_NAME: '$R2_BUCKET_NAME'"
echo "[DEBUG] CLOUDFLARE_ACCOUNT_ID: '$CLOUDFLARE_ACCOUNT_ID'"
echo "[DEBUG] TF_S3_BACKEND_BUCKET: '$TF_S3_BACKEND_BUCKET'"

# Initialize Terraform with S3 backend configuration
echo "[INFO] Using Terraform S3 backend bucket: $TF_S3_BACKEND_BUCKET"
terraform init -reconfigure \
  -backend-config="bucket=$TF_S3_BACKEND_BUCKET" \
  -backend-config="region=us-east-1" \
  -backend-config="key=terraform.tfstate"
INIT_STATUS=$?
if [ $INIT_STATUS -ne 0 ]; then
  echo "[ERROR] Terraform init failed with status $INIT_STATUS" >&2
  exit $INIT_STATUS
fi

echo "[INFO] Running terraform apply with r2_bucket_name=$R2_BUCKET_NAME, cloudflare_account_id=$CLOUDFLARE_ACCOUNT_ID"
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
