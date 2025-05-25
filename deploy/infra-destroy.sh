#!/bin/bash

set -e
set -o pipefail
# Removed set -x to reduce verbose logging

# Get absolute path to script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Set up logging
LOG_DIR="$SCRIPT_DIR/log"
mkdir -p "$LOG_DIR"
if [ -f "$LOG_DIR/infra-destroy.log" ]; then
  mv "$LOG_DIR/infra-destroy.log" "$LOG_DIR/infra-destroy-$(date '+%Y%m%d-%H%M%S').log"
fi
LOG_FILE="$LOG_DIR/infra-destroy.log"
exec > >(tee -a "$LOG_FILE") 2>&1

SCRIPT_START_TIME=$(date +%s)
echo -e "\n==============================================="
echo -e "   🧹 Harun's Portfolio Infra Destruction Script 🧹"
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
}

warning() {
  echo "$1"
}

error() {
  echo "$1" >&2
}

end_step() {
  STEP_END_TIME=$(date +%s)
  STEP_DURATION=$((STEP_END_TIME - STEP_START_TIME))
  STEP_TIMES+=("$STEP_DURATION")
  warning "Step took $STEP_DURATION seconds."
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

# 0. Download .env.deploy from S3
step 0 "Downloading .env.deploy from S3"
download_env_deploy_from_s3
end_step

# Extract variables from .env.deploy
step 1 "Extracting environment variables"
R2_BUCKET_NAME=$(grep '^R2_BUCKET_NAME=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"')
CLOUDFLARE_ACCOUNT_ID=$(grep '^CLOUDFLARE_ACCOUNT_ID=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"')
CLOUDFLARE_API_TOKEN=$(grep '^CLOUDFLARE_API_TOKEN=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"')
TF_S3_BACKEND_BUCKET=$(grep '^TF_S3_BACKEND_BUCKET=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"')
AWS_ACCESS_KEY_ID=$(grep '^AWS_ACCESS_KEY_ID=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"')
AWS_SECRET_ACCESS_KEY=$(grep '^AWS_SECRET_ACCESS_KEY=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"')

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

export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
export R2_BUCKET_NAME
export CLOUDFLARE_ACCOUNT_ID
export TF_S3_BACKEND_BUCKET
export CLOUDFLARE_API_TOKEN

echo "[DEBUG] R2_BUCKET_NAME: '$R2_BUCKET_NAME'"
echo "[DEBUG] CLOUDFLARE_ACCOUNT_ID: '$CLOUDFLARE_ACCOUNT_ID'"
echo "[DEBUG] TF_S3_BACKEND_BUCKET: '$TF_S3_BACKEND_BUCKET'"
end_step

echo "[DEBUG] Completed step 1, proceeding to step 2..."  # Debug after step 1

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

# No need to build TF_VAR_ARGS, just run terraform destroy -auto-approve

# Run terraform destroy
step 2 "Running terraform destroy"
cd "$SCRIPT_DIR/terraform"

# Initialize Terraform with S3 backend configuration
echo "[INFO] Using Terraform S3 backend bucket: $TF_S3_BACKEND_BUCKET"
terraform init -reconfigure \
  -backend-config="bucket=$TF_S3_BACKEND_BUCKET" \
  -backend-config="region=us-east-1" \
  -backend-config="key=terraform.tfstate"
INIT_STATUS=$?
if [ $INIT_STATUS -ne 0 ]; then
  error "Terraform init failed with status $INIT_STATUS"
  exit $INIT_STATUS
fi

terraform destroy -auto-approve

DESTROY_STATUS=$?
if [ $DESTROY_STATUS -ne 0 ]; then
  error "Terraform destroy failed with status $DESTROY_STATUS"
  exit $DESTROY_STATUS
fi
success "Infrastructure successfully destroyed."
end_step

# Calculate total execution time
SCRIPT_END_TIME=$(date +%s)
TOTAL_DURATION=$((SCRIPT_END_TIME - SCRIPT_START_TIME))

echo -e "\n==============================================="
echo -e "   🎉 Infrastructure destroyed in $TOTAL_DURATION seconds! 🎉"
echo -e "===============================================\n"

# Print step durations
for i in "${!STEP_TIMES[@]}"; do
  echo "Step $((i+1)) took: ${STEP_TIMES[$i]} seconds"
done
