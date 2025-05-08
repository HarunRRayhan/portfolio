#!/bin/bash
set -e
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Extract variables from .env.deploy
R2_BUCKET_NAME=$(grep '^R2_BUCKET_NAME=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"')
CLOUDFLARE_ACCOUNT_ID=$(grep '^CLOUDFLARE_ACCOUNT_ID=' "$SCRIPT_DIR/.env.deploy" | cut -d '=' -f2- | tr -d '"')

echo "[DEBUG] R2_BUCKET_NAME: '$R2_BUCKET_NAME'"
echo "[DEBUG] CLOUDFLARE_ACCOUNT_ID: '$CLOUDFLARE_ACCOUNT_ID'"

cd "$SCRIPT_DIR/terraform"
terraform destroy -auto-approve \
  -var="r2_bucket_name=$R2_BUCKET_NAME" \
  -var="cloudflare_account_id=$CLOUDFLARE_ACCOUNT_ID" 