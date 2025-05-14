#!/bin/bash

# Prepare deployment script for CI/CD
# This script prepares the Docker configuration for zero-downtime deployment

set -e

# Get absolute path to script directory
APP_DIR="${APP_DIR:-/opt/portfolio}"
DOCKER_DIR="${APP_DIR}/docker"
DEPLOY_DIR="${APP_DIR}/deploy"
CI_DIR="${DOCKER_DIR}/ci"

# Set up logging
LOG_DIR="${DEPLOY_DIR}/log"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/prepare-deployment.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "==============================================="
echo "   🚀 Preparing Docker Deployment 🚀"
echo "==============================================="
echo "Started at: $(date)"

# Create a timestamp for unique container naming
TIMESTAMP=$(date +%Y%m%d%H%M%S)
echo "Using timestamp: $TIMESTAMP for deployment"

# Create docker-compose-new.yml for the new deployment
echo "Creating new docker-compose file for deployment"
cp "${CI_DIR}/docker-compose-template.yml" "${DOCKER_DIR}/docker-compose-new.yml"

# Replace TIMESTAMP placeholder with actual timestamp
sed -i "s/TIMESTAMP/${TIMESTAMP}/g" "${DOCKER_DIR}/docker-compose-new.yml"

# Create nginx configuration template for the new deployment
echo "Creating new nginx configuration template"
cat > "${DOCKER_DIR}/nginx-template.conf" << EOF
server {
    listen 80;
    server_name _;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name _;

    ssl_certificate /etc/nginx/ssl/harun.dev.crt;
    ssl_certificate_key /etc/nginx/ssl/harun.dev.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    root /var/www/html/public;
    index index.php;

    # Serve static files directly
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        try_files \$uri =404;
    }

    # Serve PHP files through FastCGI
    location ~ \.php$ {
        try_files \$uri =404;
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass app_TIMESTAMP:9000;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        fastcgi_param PATH_INFO \$fastcgi_path_info;
        fastcgi_read_timeout 300;
    }

    # Route all other requests to index.php
    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    # Deny access to .htaccess files
    location ~ /\.ht {
        deny all;
    }
}
EOF

# Replace TIMESTAMP placeholder with actual timestamp
sed -i "s/TIMESTAMP/${TIMESTAMP}/g" "${DOCKER_DIR}/nginx-template.conf"

echo "==============================================="
echo "   ✅ Deployment Preparation Completed ✅"
echo "==============================================="
echo "Completed at: $(date)"
echo "Timestamp: $TIMESTAMP"

# Output the timestamp for use by other scripts
echo "$TIMESTAMP"

exit 0