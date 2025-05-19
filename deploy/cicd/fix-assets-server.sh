#!/bin/bash

# Script to fix missing assets on the server by copying from CDN

set -e

# Function to log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "========== FIXING MISSING ASSETS =========="

# Create a directory for the assets
log "Creating assets directory..."
mkdir -p /opt/portfolio/public/build

# Create a script to download assets from CDN
log "Creating download script..."
cat > /tmp/download_assets.sh << 'EOF'
#!/bin/bash

# Function to download a file
download_file() {
  local url=$1
  local output=$2
  mkdir -p $(dirname "$output")
  curl -s "$url" -o "$output"
  echo "Downloaded $url to $output"
}

# Create build directory if it doesn't exist
mkdir -p /opt/portfolio/public/build

# Download the missing JavaScript files
download_file "https://cdn.harun.dev/build/assets/app-Da8wAWVQ.js" "/opt/portfolio/public/build/assets/app-Da8wAWVQ.js"
download_file "https://cdn.harun.dev/build/assets/lightbulb-CtE1EmiV.js" "/opt/portfolio/public/build/assets/lightbulb-CtE1EmiV.js"
download_file "https://cdn.harun.dev/build/assets/index-CtH7B-FF.js" "/opt/portfolio/public/build/assets/index-CtH7B-FF.js"
download_file "https://cdn.harun.dev/build/assets/imageUtils-s6dGOMcb.js" "/opt/portfolio/public/build/assets/imageUtils-s6dGOMcb.js"
download_file "https://cdn.harun.dev/build/assets/Homepage-COXbJRbH.js" "/opt/portfolio/public/build/assets/Homepage-COXbJRbH.js"
download_file "https://cdn.harun.dev/build/assets/Footer-Bbj_9hU1.js" "/opt/portfolio/public/build/assets/Footer-Bbj_9hU1.js"
download_file "https://cdn.harun.dev/build/assets/ErrorBoundary-axCO5jZX.js" "/opt/portfolio/public/build/assets/ErrorBoundary-axCO5jZX.js"
download_file "https://cdn.harun.dev/build/assets/cloud-Df0lFAS6.js" "/opt/portfolio/public/build/assets/cloud-Df0lFAS6.js"
download_file "https://cdn.harun.dev/build/assets/card-BUnnDFS8.js" "/opt/portfolio/public/build/assets/card-BUnnDFS8.js"
download_file "https://cdn.harun.dev/build/assets/app-rWNYI99B.css" "/opt/portfolio/public/build/assets/app-rWNYI99B.css"

# Download manifest.json
download_file "https://cdn.harun.dev/build/manifest.json" "/opt/portfolio/public/build/manifest.json"

# Set proper permissions
chmod -R 755 /opt/portfolio/public/build
chown -R 1000:1000 /opt/portfolio/public/build
EOF

# Make the download script executable
log "Making download script executable..."
chmod +x /tmp/download_assets.sh

# Run the download script
log "Running download script..."
/tmp/download_assets.sh

# Get the latest container ID
CONTAINER_ID=$(docker ps -q --filter "name=portfolio-app" | head -n 1)

if [ -z "$CONTAINER_ID" ]; then
  log "No running portfolio container found!"
  exit 1
fi

log "Working with container: $CONTAINER_ID"

# Restart the container
log "Restarting container..."
docker restart $CONTAINER_ID

# Wait for container to restart
log "Waiting for container to restart..."
sleep 5

# Clear Laravel cache
log "Clearing Laravel cache..."
docker exec $CONTAINER_ID sh -c 'cd /var/www/html && php artisan view:clear'

# Test local connectivity
log "Testing local connectivity..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 || echo "Connection failed")
log "HTTP status on localhost:80: $HTTP_STATUS"

if [[ "$HTTP_STATUS" == "Connection failed" || "$HTTP_STATUS" == "000" ]]; then
  log "⚠️ Cannot connect to localhost:80"
elif [[ "$HTTP_STATUS" == "200" ]]; then
  log "✅ Successfully connected to localhost:80"
else
  log "⚠️ Received HTTP status $HTTP_STATUS from localhost:80"
fi

log "========== ASSETS FIX COMPLETE =========="
