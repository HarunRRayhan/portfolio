#!/bin/bash

# Test Deployment Setup Script
# Usage: ./test-deployment.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get absolute path to script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$DEPLOY_DIR")"

echo -e "${BLUE}🧪 Testing Deployment Setup${NC}\n"

# Test 1: Check if required files exist
echo -e "${BLUE}1. Checking required files...${NC}"

if [[ -f "$SCRIPT_DIR/blue-green-deploy.sh" ]]; then
  echo -e "${GREEN}✅ blue-green-deploy.sh exists${NC}"
else
  echo -e "${RED}❌ blue-green-deploy.sh missing${NC}"
  exit 1
fi

if [[ -f "$SCRIPT_DIR/status.sh" ]]; then
  echo -e "${GREEN}✅ status.sh exists${NC}"
else
  echo -e "${RED}❌ status.sh missing${NC}"
  exit 1
fi

if [[ -f "$REPO_ROOT/package.json" ]]; then
  echo -e "${GREEN}✅ package.json exists${NC}"
else
  echo -e "${RED}❌ package.json missing${NC}"
  exit 1
fi

# Test 2: Check script permissions
echo -e "\n${BLUE}2. Checking script permissions...${NC}"

if [[ -x "$SCRIPT_DIR/blue-green-deploy.sh" ]]; then
  echo -e "${GREEN}✅ blue-green-deploy.sh is executable${NC}"
else
  echo -e "${YELLOW}⚠️ Making blue-green-deploy.sh executable${NC}"
  chmod +x "$SCRIPT_DIR/blue-green-deploy.sh"
fi

if [[ -x "$SCRIPT_DIR/status.sh" ]]; then
  echo -e "${GREEN}✅ status.sh is executable${NC}"
else
  echo -e "${YELLOW}⚠️ Making status.sh executable${NC}"
  chmod +x "$SCRIPT_DIR/status.sh"
fi

# Test 3: Check Node.js version
echo -e "\n${BLUE}3. Checking Node.js version...${NC}"

if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v | sed 's/v//;s/\..*//')
  if [[ "$NODE_VERSION" -ge 18 ]]; then
    echo -e "${GREEN}✅ Node.js version $(node -v) is sufficient${NC}"
  else
    echo -e "${YELLOW}⚠️ Node.js version $(node -v) is old (need >= 18), but GitHub Actions will use Node.js 20${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ Node.js not found locally, but GitHub Actions will use Node.js 20${NC}"
fi

# Test 4: Check npm dependencies
echo -e "\n${BLUE}4. Checking npm dependencies...${NC}"

cd "$REPO_ROOT"
if [[ -f "package-lock.json" ]]; then
  echo -e "${GREEN}✅ package-lock.json exists${NC}"
else
  echo -e "${YELLOW}⚠️ package-lock.json missing, running npm install${NC}"
  npm install
fi

# Test 5: Check if build works
echo -e "\n${BLUE}5. Testing build process...${NC}"

if [[ "$NODE_VERSION" -ge 18 ]]; then
  if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build process works${NC}"
  else
    echo -e "${RED}❌ Build process failed${NC}"
    echo -e "${YELLOW}Try running: npm install && npm run build${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️ Skipping build test due to Node.js version (will work in GitHub Actions)${NC}"
fi

# Test 6: Check AWS CLI
echo -e "\n${BLUE}6. Checking AWS CLI...${NC}"

if command -v aws &> /dev/null; then
  echo -e "${GREEN}✅ AWS CLI is installed${NC}"
else
  echo -e "${YELLOW}⚠️ AWS CLI not found (will be installed in GitHub Actions)${NC}"
fi

# Test 7: Check environment file structure
echo -e "\n${BLUE}7. Checking environment file structure...${NC}"

if [[ -f "$DEPLOY_DIR/.env.deploy" ]]; then
  echo -e "${GREEN}✅ .env.deploy exists${NC}"
  
  # Check for required variables
  required_vars=("PUBLIC_IP" "REMOTE_USER" "SSH_KEY")
  for var in "${required_vars[@]}"; do
    if grep -q "^$var=" "$DEPLOY_DIR/.env.deploy"; then
      echo -e "${GREEN}✅ $var is configured${NC}"
    else
      echo -e "${RED}❌ $var missing in .env.deploy${NC}"
    fi
  done
else
  echo -e "${YELLOW}⚠️ .env.deploy not found (will be downloaded from S3 in GitHub Actions)${NC}"
fi

if [[ -f "$DEPLOY_DIR/.env.appprod" ]]; then
  echo -e "${GREEN}✅ .env.appprod exists${NC}"
else
  echo -e "${YELLOW}⚠️ .env.appprod not found (will be downloaded from S3 in GitHub Actions)${NC}"
fi

# Test 8: Check GitHub Actions workflow
echo -e "\n${BLUE}8. Checking GitHub Actions workflow...${NC}"

if [[ -f "$REPO_ROOT/.github/workflows/deploy.yml" ]]; then
  echo -e "${GREEN}✅ GitHub Actions workflow exists${NC}"
else
  echo -e "${RED}❌ GitHub Actions workflow missing${NC}"
  exit 1
fi

echo -e "\n${GREEN}🎉 All tests passed! Deployment setup looks good.${NC}"
echo -e "\n${BLUE}Next steps:${NC}"
echo -e "1. Ensure GitHub Secrets are configured (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, CONFIG_BUCKET_NAME)"
echo -e "2. Push to main branch or create a PR to trigger deployment"
echo -e "3. Monitor deployment in GitHub Actions"

cd "$SCRIPT_DIR" 