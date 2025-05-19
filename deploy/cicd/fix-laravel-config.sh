#!/bin/bash

# Script to fix Laravel configuration files directly

set -e

# Function to log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "========== FIXING LARAVEL CONFIGURATION =========="

# Get the latest container ID
CONTAINER_ID=$(docker ps -q --filter "name=portfolio-app" | head -n 1)

if [ -z "$CONTAINER_ID" ]; then
  log "No running portfolio container found!"
  exit 1
fi

log "Working with container: $CONTAINER_ID"

# Directly modify the database configuration file
log "Modifying database configuration file..."
docker exec $CONTAINER_ID sh -c 'cat > /var/www/html/config/database.php << EOF
<?php

return [
    "default" => env("DB_CONNECTION", "pgsql"),
    "connections" => [
        "pgsql" => [
            "driver" => "pgsql",
            "host" => "localhost",
            "port" => 5432,
            "database" => "portfolio",
            "username" => "portfolio",
            "password" => "CO601jkELC5h0pDlqVNbSQ==",
            "charset" => "utf8",
            "prefix" => "",
            "prefix_indexes" => true,
            "search_path" => "public",
            "sslmode" => "prefer",
        ],
    ],
    "migrations" => "migrations",
    "redis" => [
        "client" => "phpredis",
        "options" => [
            "cluster" => env("REDIS_CLUSTER", "redis"),
            "prefix" => env("REDIS_PREFIX", "portfolio_database_"),
        ],
        "default" => [
            "url" => env("REDIS_URL"),
            "host" => env("REDIS_HOST", "127.0.0.1"),
            "password" => env("REDIS_PASSWORD"),
            "port" => env("REDIS_PORT", "6379"),
            "database" => env("REDIS_DB", "0"),
        ],
        "cache" => [
            "url" => env("REDIS_URL"),
            "host" => env("REDIS_HOST", "127.0.0.1"),
            "password" => env("REDIS_PASSWORD"),
            "port" => env("REDIS_PORT", "6379"),
            "database" => env("REDIS_CACHE_DB", "1"),
        ],
    ],
];
EOF'

# Create a test file to verify PHP is working
log "Creating a test PHP file..."
docker exec $CONTAINER_ID sh -c 'cat > /var/www/html/public/test.php << EOF
<?php
echo "PHP is working!";
// Test PostgreSQL connection
try {
    \$dbconn = pg_connect("host=localhost port=5432 dbname=portfolio user=portfolio password=CO601jkELC5h0pDlqVNbSQ==");
    if (\$dbconn) {
        echo "<br>Successfully connected to PostgreSQL!";
        pg_close(\$dbconn);
    } else {
        echo "<br>Failed to connect to PostgreSQL.";
    }
} catch (Exception \$e) {
    echo "<br>Error: " . \$e->getMessage();
}
EOF'

# Fix permissions
log "Fixing permissions..."
docker exec $CONTAINER_ID sh -c 'chown -R www-data:www-data /var/www/html'

# Restart the container
log "Restarting container..."
docker restart $CONTAINER_ID

# Wait for container to restart
log "Waiting for container to restart..."
sleep 5

# Test the test.php file
log "Testing PHP functionality..."
TEST_RESULT=$(curl -s http://localhost/test.php || echo "Connection failed")
log "Test result: $TEST_RESULT"

# Test local connectivity to main site
log "Testing local connectivity to main site..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 || echo "Connection failed")
log "HTTP status on localhost:80: $HTTP_STATUS"

if [[ "$HTTP_STATUS" == "Connection failed" || "$HTTP_STATUS" == "000" ]]; then
  log "⚠️ Cannot connect to localhost:80"
elif [[ "$HTTP_STATUS" == "200" ]]; then
  log "✅ Successfully connected to localhost:80"
else
  log "⚠️ Received HTTP status $HTTP_STATUS from localhost:80"
fi

# Check if PostgreSQL is listening on the correct port
log "Checking PostgreSQL port..."
POSTGRES_PORT=$(ss -tunlp | grep 5432 || echo "Not found")
log "PostgreSQL port status: $POSTGRES_PORT"

# Check if PostgreSQL is accepting connections from localhost
log "Testing PostgreSQL connectivity..."
POSTGRES_TEST=$(sudo -u postgres psql -c "SELECT 1;" || echo "Connection failed")
log "PostgreSQL test result: $POSTGRES_TEST"

# Modify pg_hba.conf to allow connections from Docker
log "Updating PostgreSQL configuration to allow connections from Docker..."
sudo -u postgres sh -c 'cat >> /etc/postgresql/14/main/pg_hba.conf << EOF
# Allow connections from Docker containers
host    all             all             172.17.0.0/16           md5
host    all             all             127.0.0.1/32            md5
EOF'

# Restart PostgreSQL
log "Restarting PostgreSQL..."
systemctl restart postgresql

# Wait for PostgreSQL to restart
log "Waiting for PostgreSQL to restart..."
sleep 5

# Test PostgreSQL connectivity again
log "Testing PostgreSQL connectivity after restart..."
POSTGRES_TEST=$(sudo -u postgres psql -c "SELECT 1;" || echo "Connection failed")
log "PostgreSQL test result after restart: $POSTGRES_TEST"

log "========== LARAVEL CONFIGURATION FIX COMPLETE =========="
