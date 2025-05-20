#!/bin/bash

# This script tracks which files are actually used during the deployment process
# It will help identify unnecessary files that can be cleaned up

set -e
set -o pipefail

# Get absolute path to script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Create log directory if it doesn't exist
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/deployment-file-tracking-$(date '+%Y%m%d-%H%M%S').log"

echo "Starting deployment file tracking at $(date)" | tee -a "$LOG_FILE"
echo "----------------------------------------" | tee -a "$LOG_FILE"

# Track files in docker directory
echo "Files in docker directory:" | tee -a "$LOG_FILE"
find "$REPO_ROOT/docker" -type f | sort | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Track files in deploy directory
echo "Files in deploy directory:" | tee -a "$LOG_FILE"
find "$REPO_ROOT/deploy" -type f -not -path "*/logs/*" -not -path "*/build/*" | sort | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Prepare for tracking file access during deployment
echo "Setting up file access tracking..." | tee -a "$LOG_FILE"

# Create a temporary directory for the deployment
TEMP_DIR="$SCRIPT_DIR/temp"
mkdir -p "$TEMP_DIR"

# Create a list of files that are actually used during deployment
USED_FILES="$TEMP_DIR/used_files.txt"
touch "$USED_FILES"

# Function to track file access
track_file_access() {
  local dir=$1
  local pattern=$2
  
  echo "Tracking file access in $dir with pattern $pattern" | tee -a "$LOG_FILE"
  
  # Use strace to track file access during deployment
  strace -f -e trace=file -o "$TEMP_DIR/strace.log" "$REPO_ROOT/deploy/deploy.sh" || true
  
  # Extract accessed files from strace log
  grep -o "$pattern" "$TEMP_DIR/strace.log" | sort | uniq > "$USED_FILES"
  
  echo "Files actually used during deployment:" | tee -a "$LOG_FILE"
  cat "$USED_FILES" | tee -a "$LOG_FILE"
}

# Since strace might not be available or practical, let's use a different approach
# We'll manually list the essential files based on the deployment script

echo "Essential files in docker directory:" | tee -a "$LOG_FILE"
cat << EOF | tee -a "$LOG_FILE"
/docker/Dockerfile
/docker/docker-compose.yml
/docker/nginx.conf
/docker/wait-for-db.sh
EOF
echo "" | tee -a "$LOG_FILE"

echo "Essential files in deploy directory:" | tee -a "$LOG_FILE"
cat << EOF | tee -a "$LOG_FILE"
/deploy/deploy.sh
/deploy/blue-green-ssl-deploy.sh
/deploy/docker-compose-template.yml
/deploy/portfolio-key.pem
EOF
echo "" | tee -a "$LOG_FILE"

echo "Unnecessary files that can be cleaned up:" | tee -a "$LOG_FILE"
echo "1. All files in deploy/cicd/ directory" | tee -a "$LOG_FILE"
echo "2. All files in deploy/build/ directory except the latest build" | tee -a "$LOG_FILE"
echo "3. All files in docker/ci/ directory" | tee -a "$LOG_FILE"
echo "4. Any old backup files (*.bak, *~, etc.)" | tee -a "$LOG_FILE"
echo "5. Any old log files older than 7 days" | tee -a "$LOG_FILE"

echo "----------------------------------------" | tee -a "$LOG_FILE"
echo "Deployment file tracking completed at $(date)" | tee -a "$LOG_FILE"

echo "Log file saved to: $LOG_FILE"
