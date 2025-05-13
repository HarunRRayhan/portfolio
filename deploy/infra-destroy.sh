#!/bin/bash

set -e
set -o pipefail

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

# Colors for output
GREEN='\033[0;32m'
CYAN='\033[1;36m'
MAGENTA='\033[1;35m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_START_TIME=$(date +%s)
echo -e "\n${MAGENTA}==============================================="
echo -e "   🧹 Harun's Portfolio Infra Destruction Script 🧹"
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
}

warning() {
  echo -e "${YELLOW}$1${NC}"
}

error() {
  echo -e "${RED}$1${NC}" >&2
}

end_step() {
  STEP_END_TIME=$(date +%s)
  STEP_DURATION=$((STEP_END_TIME - STEP_START_TIME))
  STEP_TIMES+=("$STEP_DURATION")
  warning "Step took $STEP_DURATION seconds."
}

# Extract variables from .env.deploy
step 1 "Extracting environment variables"
R2_BUCKET_NAME=$(grep '^R2_BUCKET_NAME=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"')
CLOUDFLARE_ACCOUNT_ID=$(grep '^CLOUDFLARE_ACCOUNT_ID=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"')
CLOUDFLARE_API_TOKEN=$(grep '^CLOUDFLARE_API_TOKEN=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"')
TF_S3_BACKEND_BUCKET=$(grep '^TF_S3_BACKEND_BUCKET=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"')

echo "[DEBUG] R2_BUCKET_NAME: '$R2_BUCKET_NAME'"
echo "[DEBUG] CLOUDFLARE_ACCOUNT_ID: '$CLOUDFLARE_ACCOUNT_ID'"
echo "[DEBUG] TF_S3_BACKEND_BUCKET: '$TF_S3_BACKEND_BUCKET'"
end_step

# Run terraform destroy
step 2 "Running terraform destroy"
cd "$SCRIPT_DIR/terraform"

# Initialize Terraform with S3 backend configuration
echo "[INFO] Using Terraform S3 backend bucket: $TF_S3_BACKEND_BUCKET"
terraform init \
  -backend-config="bucket=$TF_S3_BACKEND_BUCKET"
INIT_STATUS=$?
if [ $INIT_STATUS -ne 0 ]; then
  error "Terraform init failed with status $INIT_STATUS"
  exit $INIT_STATUS
fi

terraform destroy -auto-approve \
  -var="r2_bucket_name=$R2_BUCKET_NAME" \
  -var="cloudflare_account_id=$CLOUDFLARE_ACCOUNT_ID"

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

echo -e "\n${MAGENTA}==============================================="
echo -e "   🎉 Infrastructure destroyed in $TOTAL_DURATION seconds! 🎉"
echo -e "===============================================${NC}\n"

# Print step durations
for i in "${!STEP_TIMES[@]}"; do
  echo "Step $((i+1)) took: ${STEP_TIMES[$i]} seconds"
done