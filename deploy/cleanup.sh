#!/bin/bash

# This script cleans up unnecessary files from the docker and deploy directories
# It keeps only the essential files needed for deployment

set -e
set -o pipefail

# Get absolute path to script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Create backup directory
BACKUP_DIR="$SCRIPT_DIR/backups/cleanup-$(date '+%Y%m%d-%H%M%S')"
mkdir -p "$BACKUP_DIR"

echo "Starting cleanup process at $(date)"
echo "Creating backup at $BACKUP_DIR"

# Function to backup and remove a directory
backup_and_remove_dir() {
  local dir=$1
  local backup_path="$BACKUP_DIR/$(basename "$dir")"
  
  if [ -d "$dir" ]; then
    echo "Backing up $dir to $backup_path"
    mkdir -p "$backup_path"
    cp -r "$dir"/* "$backup_path/" 2>/dev/null || true
    
    echo "Removing $dir"
    rm -rf "$dir"
  fi
}

# Function to backup and remove a file
backup_and_remove_file() {
  local file=$1
  local backup_path="$BACKUP_DIR/$(basename "$file")"
  
  if [ -f "$file" ]; then
    echo "Backing up $file to $backup_path"
    cp "$file" "$backup_path" 2>/dev/null || true
    
    echo "Removing $file"
    rm -f "$file"
  fi
}

# Clean up docker directory
echo "Cleaning up docker directory..."

# Backup the entire docker directory first
mkdir -p "$BACKUP_DIR/docker"
cp -r "$REPO_ROOT/docker"/* "$BACKUP_DIR/docker/" 2>/dev/null || true

# Remove unnecessary files and directories in docker
if [ -d "$REPO_ROOT/docker/ci" ]; then
  backup_and_remove_dir "$REPO_ROOT/docker/ci"
fi

# Keep only essential files in docker directory
mkdir -p "$BACKUP_DIR/docker_files"
find "$REPO_ROOT/docker" -type f -not -name "Dockerfile" -not -name "docker-compose.yml" -not -name "nginx.conf" -not -name "wait-for-db.sh" | while read file; do
  rel_path=${file#"$REPO_ROOT/docker/"}
  backup_path="$BACKUP_DIR/docker_files/$rel_path"
  mkdir -p "$(dirname "$backup_path")"
  cp "$file" "$backup_path" 2>/dev/null || true
  rm -f "$file"
done

# Clean up deploy directory
echo "Cleaning up deploy directory..."

# Backup cicd directory
if [ -d "$SCRIPT_DIR/cicd" ]; then
  backup_and_remove_dir "$SCRIPT_DIR/cicd"
fi

# Clean up build directory - keep only the latest build
if [ -d "$SCRIPT_DIR/build" ]; then
  echo "Cleaning up build directory - keeping only the latest build..."
  
  # Find the latest build file
  latest_build=$(find "$SCRIPT_DIR/build" -name "build-*.tar.gz" -type f -printf "%T@ %p\n" | sort -n | tail -1 | cut -d' ' -f2-)
  
  if [ -n "$latest_build" ]; then
    echo "Latest build file: $latest_build"
    
    # Backup and remove all other build files
    mkdir -p "$BACKUP_DIR/build"
    find "$SCRIPT_DIR/build" -name "build-*.tar.gz" -type f -not -path "$latest_build" | while read file; do
      cp "$file" "$BACKUP_DIR/build/" 2>/dev/null || true
      rm -f "$file"
    done
  else
    echo "No build files found."
  fi
fi

# Clean up old log files (older than 7 days)
echo "Cleaning up old log files (older than 7 days)..."
if [ -d "$SCRIPT_DIR/log" ]; then
  mkdir -p "$BACKUP_DIR/old_logs"
  find "$SCRIPT_DIR/log" -name "*.log" -type f -mtime +7 | while read file; do
    cp "$file" "$BACKUP_DIR/old_logs/" 2>/dev/null || true
    rm -f "$file"
  done
fi

# Remove backup files
echo "Removing backup files (*.bak, *~, etc.)..."
find "$REPO_ROOT/docker" "$SCRIPT_DIR" -name "*.bak" -o -name "*~" -o -name "*.old" | while read file; do
  backup_path="$BACKUP_DIR/backup_files/$(basename "$file")"
  mkdir -p "$(dirname "$backup_path")"
  cp "$file" "$backup_path" 2>/dev/null || true
  rm -f "$file"
done

# Keep only essential files in deploy directory
echo "Keeping only essential files in deploy directory..."
essential_files=(
  "$SCRIPT_DIR/deploy.sh"
  "$SCRIPT_DIR/blue-green-ssl-deploy.sh"
  "$SCRIPT_DIR/docker-compose-template.yml"
  "$SCRIPT_DIR/portfolio-key.pem"
)

# Create a list of files to keep
touch "$BACKUP_DIR/keep_files.txt"
for file in "${essential_files[@]}"; do
  if [ -f "$file" ]; then
    echo "$(basename "$file")" >> "$BACKUP_DIR/keep_files.txt"
  fi
done

echo "Cleanup process completed at $(date)"
echo "Backup saved at $BACKUP_DIR"
echo ""
echo "Essential files kept in docker directory:"
echo "- Dockerfile"
echo "- docker-compose.yml"
echo "- nginx.conf"
echo "- wait-for-db.sh"
echo ""
echo "Essential files kept in deploy directory:"
echo "- deploy.sh"
echo "- blue-green-ssl-deploy.sh"
echo "- docker-compose-template.yml"
echo "- portfolio-key.pem"
echo ""
echo "If you need to restore any files, they are available in the backup directory:"
echo "$BACKUP_DIR"
