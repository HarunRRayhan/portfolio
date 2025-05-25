#!/bin/bash

set -e
set -o pipefail

# Get absolute path to script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "==============================================="
echo "   📤 Upload Deploy Files to S3 📤"
echo "==============================================="

# Load environment variables from .env.deploy
if [ -f "$SCRIPT_DIR/.env.deploy" ]; then
  set -a
  . "$SCRIPT_DIR/.env.deploy"
  set +a
else
  echo "Error: .env.deploy file not found"
  exit 1
fi

# Check required variables
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ] || [ -z "$CONFIG_BUCKET_NAME" ]; then
  echo "Error: Missing required environment variables:"
  echo "  AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:+set}"
  echo "  AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY:+set}"
  echo "  CONFIG_BUCKET_NAME: ${CONFIG_BUCKET_NAME:+set}"
  exit 1
fi

export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY

echo "Using CONFIG_BUCKET_NAME: $CONFIG_BUCKET_NAME"

# Upload .env.deploy file
echo "Uploading .env.deploy to S3..."
if aws s3 cp "$SCRIPT_DIR/.env.deploy" "s3://$CONFIG_BUCKET_NAME/secrets/envs/docker/.env"; then
  echo "✅ Successfully uploaded .env.deploy to s3://$CONFIG_BUCKET_NAME/secrets/envs/docker/.env"
else
  echo "❌ Failed to upload .env.deploy to S3"
  exit 1
fi

# Upload SSH key if it exists
if [ -f "$SCRIPT_DIR/portfolio-key.pem" ]; then
  echo "Uploading SSH key to S3..."
  if aws s3 cp "$SCRIPT_DIR/portfolio-key.pem" "s3://$CONFIG_BUCKET_NAME/key/ssh/portfolio-key.pem"; then
    echo "✅ Successfully uploaded SSH key to s3://$CONFIG_BUCKET_NAME/key/ssh/portfolio-key.pem"
  else
    echo "❌ Failed to upload SSH key to S3"
    exit 1
  fi
else
  echo "⚠️  SSH key file (portfolio-key.pem) not found, skipping upload"
fi

echo ""
echo "🎉 Upload completed successfully!"
echo ""
echo "Files uploaded:"
echo "  - .env.deploy → s3://$CONFIG_BUCKET_NAME/secrets/envs/docker/.env"
if [ -f "$SCRIPT_DIR/portfolio-key.pem" ]; then
  echo "  - portfolio-key.pem → s3://$CONFIG_BUCKET_NAME/key/ssh/portfolio-key.pem"
fi 