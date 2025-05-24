#!/bin/bash

# Upload Environment Files to S3
# This script uploads .env.appprod and .env.deploy to S3 for automated deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo -e "${GREEN}🚀 Environment File Upload Script${NC}"
echo "=================================="

# Load environment variables from .env.deploy
if [ -f "$SCRIPT_DIR/.env.deploy" ]; then
  echo "Loading configuration from .env.deploy..."
  set -a
  . "$SCRIPT_DIR/.env.deploy"
  set +a
else
  echo -e "${RED}Error: .env.deploy file not found${NC}"
  exit 1
fi

# Check required variables
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ] || [ -z "$CONFIG_BUCKET_NAME" ]; then
  echo -e "${RED}Error: Missing required AWS credentials or CONFIG_BUCKET_NAME${NC}"
  echo "Please ensure .env.deploy contains:"
  echo "  - AWS_ACCESS_KEY_ID"
  echo "  - AWS_SECRET_ACCESS_KEY"
  echo "  - CONFIG_BUCKET_NAME"
  exit 1
fi

# Set AWS credentials
export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY

echo "Using S3 bucket: $CONFIG_BUCKET_NAME"
echo ""

# Upload app environment file
if [ -f "$SCRIPT_DIR/.env.appprod" ]; then
  echo -e "${YELLOW}Uploading app environment file...${NC}"
  aws s3 cp "$SCRIPT_DIR/.env.appprod" "s3://$CONFIG_BUCKET_NAME/secrets/envs/app/.env"
  echo -e "${GREEN}✅ App environment uploaded successfully${NC}"
else
  echo -e "${RED}❌ .env.appprod file not found${NC}"
  exit 1
fi

# Upload docker environment file
if [ -f "$SCRIPT_DIR/.env.deploy" ]; then
  echo -e "${YELLOW}Uploading docker environment file...${NC}"
  aws s3 cp "$SCRIPT_DIR/.env.deploy" "s3://$CONFIG_BUCKET_NAME/secrets/envs/docker/.env"
  echo -e "${GREEN}✅ Docker environment uploaded successfully${NC}"
else
  echo -e "${RED}❌ .env.deploy file not found${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}🎉 All environment files uploaded successfully!${NC}"
echo ""
echo "Files uploaded to:"
echo "  📁 s3://$CONFIG_BUCKET_NAME/secrets/envs/app/.env"
echo "  📁 s3://$CONFIG_BUCKET_NAME/secrets/envs/docker/.env"
echo ""
echo "Next deployment will automatically use these files from S3."

# Verify uploads
echo -e "${YELLOW}Verifying uploads...${NC}"
aws s3 ls "s3://$CONFIG_BUCKET_NAME/secrets/envs/" --recursive

echo ""
echo -e "${GREEN}✅ Upload verification complete${NC}" 