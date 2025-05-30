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

# Function to download .env.deploy from S3
download_env_deploy_from_s3() {
  echo "Downloading .env.deploy from S3..."
  
  # First, try to load basic AWS credentials from local .env.deploy if it exists
  if [ -f "$SCRIPT_DIR/.env.deploy" ]; then
    AWS_ACCESS_KEY_ID=$(grep '^AWS_ACCESS_KEY_ID=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"' || true)
    AWS_SECRET_ACCESS_KEY=$(grep '^AWS_SECRET_ACCESS_KEY=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"' || true)
    CONFIG_BUCKET_NAME=$(grep '^CONFIG_BUCKET_NAME=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"' || true)
  fi
  
  if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ] || [ -z "$CONFIG_BUCKET_NAME" ]; then
    echo "Missing AWS credentials or CONFIG_BUCKET_NAME, using local .env.deploy file"
    return 1
  fi
  
  export AWS_ACCESS_KEY_ID
  export AWS_SECRET_ACCESS_KEY
  
  # Download .env.deploy from S3
  if aws s3 cp "s3://$CONFIG_BUCKET_NAME/secrets/envs/docker/.env" "$SCRIPT_DIR/.env.deploy.s3" 2>/dev/null; then
    echo "Successfully downloaded .env.deploy from S3"
    mv "$SCRIPT_DIR/.env.deploy.s3" "$SCRIPT_DIR/.env.deploy"
    return 0
  else
    echo "Failed to download .env.deploy from S3, using local file if available"
    return 1
  fi
}

# Function to upload .env.deploy and SSH key to S3
upload_files_to_s3() {
  local public_ip="$1"
  echo "Uploading updated .env.deploy and SSH key to S3..."
  
  if [ -z "$CONFIG_BUCKET_NAME" ]; then
    echo "CONFIG_BUCKET_NAME not set, skipping S3 upload"
    return 1
  fi
  
  # Upload updated .env.deploy
  if aws s3 cp "$SCRIPT_DIR/.env.deploy" "s3://$CONFIG_BUCKET_NAME/secrets/envs/docker/.env" 2>/dev/null; then
    echo "Successfully uploaded updated .env.deploy to S3"
  else
    echo "Failed to upload .env.deploy to S3"
  fi
  
  # Upload SSH key
  if [ -f "$SCRIPT_DIR/portfolio-key.pem" ]; then
    if aws s3 cp "$SCRIPT_DIR/portfolio-key.pem" "s3://$CONFIG_BUCKET_NAME/key/ssh/portfolio-key.pem" 2>/dev/null; then
      echo "Successfully uploaded SSH key to S3"
    else
      echo "Failed to upload SSH key to S3"
    fi
  else
    echo "SSH key file not found, skipping upload"
  fi
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

# 0. Download .env.deploy from S3
step 0 "Downloading .env.deploy from S3"
download_env_deploy_from_s3
success ".env.deploy downloaded from S3 (or using local fallback)"

# After loading .env.deploy, export all relevant variables
if [ -f "$SCRIPT_DIR/.env.deploy" ]; then
  while IFS='=' read -r key value; do
    # Only export non-empty, non-commented variables
    if [[ ! "$key" =~ ^# ]] && [[ -n "$key" ]] && [[ -n "$value" ]]; then
      export "$key"="${value//\"/}"
    fi
  done < <(grep -v '^#' "$SCRIPT_DIR/.env.deploy" | grep '=')
fi
# Now all variables are exported for terraform commands

# Extract and export all required variables from .env.deploy
for var in aws_region aws_access_key aws_secret_key aws_lightsail_blueprint_id aws_lightsail_bundle_id cloudflare_api_token cloudflare_zone_id domain_name db_password r2_bucket_name cloudflare_account_id; do
  value=$(grep -E "^${var}=" "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"' || true)
  if [ -n "$value" ]; then
    export $var="$value"
  fi
  value_uc=$(grep -E "^$(echo $var | awk '{print toupper($0)}')=" "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"' || true)
  if [ -z "$value" ] && [ -n "$value_uc" ]; then
    export $var="$value_uc"
  fi
  unset value value_uc
done

# Map required Terraform variables to .env.deploy variable names with TF_VAR_ prefix
export TF_VAR_aws_region="us-east-1"
export TF_VAR_aws_access_key="$AWS_ACCESS_KEY_ID"
export TF_VAR_aws_secret_key="$AWS_SECRET_ACCESS_KEY"
export TF_VAR_aws_lightsail_blueprint_id="ubuntu_22_04"
export TF_VAR_aws_lightsail_bundle_id="micro_3_0"
export TF_VAR_cloudflare_api_token="$CLOUDFLARE_API_TOKEN"
export TF_VAR_cloudflare_zone_id="$CLOUDFLARE_ZONE_ID"
export TF_VAR_domain_name="harun.dev"
export TF_VAR_db_password="$POSTGRES_PASSWORD"
export TF_VAR_r2_bucket_name="$R2_BUCKET_NAME"
export TF_VAR_cloudflare_account_id="$CLOUDFLARE_ACCOUNT_ID"

# No need to build TF_VAR_ARGS, just run terraform apply -auto-approve

# 1. Apply Terraform
step 1 "Applying Terraform"
cd "$SCRIPT_DIR/terraform"

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

echo "[INFO] Running terraform apply with r2_bucket_name=$R2_BUCKET_NAME, cloudflare_account_id=$CLOUDFLARE_ACCOUNT_ID, cloudflare_api_token=$CLOUDFLARE_API_TOKEN, aws_access_key_id=$AWS_ACCESS_KEY_ID, aws_secret_access_key=$AWS_SECRET_ACCESS_KEY, tf_s3_backend_bucket=$TF_S3_BACKEND_BUCKET"
terraform apply -auto-approve
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

# 6. Upload updated files to S3
step 6 "Uploading updated .env.deploy and SSH key to S3"
upload_files_to_s3 "$PUBLIC_IP"
success "Files uploaded to S3."

print_total_time
