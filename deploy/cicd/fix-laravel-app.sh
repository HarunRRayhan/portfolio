#!/bin/bash

# Script to fix Laravel application issues

set -e

# Function to log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "========== FIXING LARAVEL APPLICATION =========="

# Get the latest container ID
CONTAINER_ID=$(docker ps -q --filter "name=portfolio-app" | head -n 1)

if [ -z "$CONTAINER_ID" ]; then
  log "No running portfolio container found!"
  exit 1
fi

log "Working with container: $CONTAINER_ID"

# Create a diagnostic script to check Laravel errors
log "Creating Laravel diagnostic script..."
docker exec $CONTAINER_ID sh -c 'cat > /var/www/html/public/diagnose.php << EOF
<?php
error_reporting(E_ALL);
ini_set("display_errors", 1);

echo "<h1>Laravel Diagnostic Tool</h1>";

// Check PHP version
echo "<h2>PHP Version</h2>";
echo "<p>PHP Version: " . phpversion() . "</p>";

// Check extensions
echo "<h2>Required Extensions</h2>";
\$required_extensions = ["pdo", "pdo_pgsql", "mbstring", "tokenizer", "xml", "ctype", "json", "bcmath"];
foreach (\$required_extensions as \$ext) {
    echo "<p>" . \$ext . ": " . (extension_loaded(\$ext) ? "Loaded" : "Not loaded") . "</p>";
}

// Check environment file
echo "<h2>Environment File</h2>";
if (file_exists("/var/www/html/.env")) {
    echo "<p>.env file exists</p>";
    \$env_content = file_get_contents("/var/www/html/.env");
    \$env_lines = explode("\n", \$env_content);
    echo "<pre>";
    foreach (\$env_lines as \$line) {
        if (strpos(\$line, "PASSWORD") !== false || strpos(\$line, "KEY") !== false) {
            echo preg_replace("/=.*/", "=*****", \$line) . "\n";
        } else {
            echo \$line . "\n";
        }
    }
    echo "</pre>";
} else {
    echo "<p>.env file does not exist</p>";
}

// Check storage permissions
echo "<h2>Storage Permissions</h2>";
\$storage_paths = [
    "/var/www/html/storage",
    "/var/www/html/storage/framework",
    "/var/www/html/storage/framework/cache",
    "/var/www/html/storage/framework/sessions",
    "/var/www/html/storage/framework/views",
    "/var/www/html/storage/logs",
    "/var/www/html/bootstrap/cache"
];

foreach (\$storage_paths as \$path) {
    \$is_writable = is_writable(\$path);
    echo "<p>" . \$path . ": " . (\$is_writable ? "Writable" : "Not writable") . "</p>";
}

// Check database connection
echo "<h2>Database Connection</h2>";
try {
    \$dbconn = pg_connect("host=localhost port=5432 dbname=portfolio user=portfolio password=CO601jkELC5h0pDlqVNbSQ==");
    if (\$dbconn) {
        echo "<p>Successfully connected to PostgreSQL!</p>";
        pg_close(\$dbconn);
    } else {
        echo "<p>Failed to connect to PostgreSQL.</p>";
    }
} catch (Exception \$e) {
    echo "<p>Error: " . \$e->getMessage() . "</p>";
}

// Check Laravel logs
echo "<h2>Laravel Logs</h2>";
\$log_file = "/var/www/html/storage/logs/laravel.log";
if (file_exists(\$log_file)) {
    echo "<p>Log file exists</p>";
    \$log_content = file_get_contents(\$log_file);
    \$log_lines = explode("\n", \$log_content);
    \$last_lines = array_slice(\$log_lines, -20);
    echo "<pre>";
    foreach (\$last_lines as \$line) {
        echo htmlspecialchars(\$line) . "\n";
    }
    echo "</pre>";
} else {
    echo "<p>Log file does not exist</p>";
}
EOF'

# Fix Laravel storage permissions
log "Fixing Laravel storage permissions..."
docker exec $CONTAINER_ID sh -c 'mkdir -p /var/www/html/storage/framework/{sessions,views,cache,cache/data} /var/www/html/storage/logs /var/www/html/bootstrap/cache && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache'

# Create a fresh .env file
log "Creating fresh .env file..."
docker exec $CONTAINER_ID sh -c 'cat > /var/www/html/.env << EOF
APP_NAME=Portfolio
APP_ENV=production
APP_KEY=base64:yUwtWgRbG5jszbGwJhcERDfBkDPpECD+IURBjl8uAW0=
APP_DEBUG=true
APP_URL=https://harun.dev

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=portfolio
DB_USERNAME=portfolio
DB_PASSWORD=CO601jkELC5h0pDlqVNbSQ==

SESSION_DRIVER=file
SESSION_LIFETIME=120

CACHE_DRIVER=file
QUEUE_CONNECTION=sync

ASSET_URL=https://cdn.harun.dev
EOF'

# Clear Laravel cache
log "Clearing Laravel cache..."
docker exec $CONTAINER_ID sh -c 'cd /var/www/html && php artisan config:clear && php artisan cache:clear && php artisan view:clear && php artisan route:clear' || log "Failed to clear Laravel cache"

# Check Laravel logs
log "Checking Laravel logs..."
docker exec $CONTAINER_ID sh -c 'cat /var/www/html/storage/logs/laravel.log 2>/dev/null || echo "No log file found"' | tail -n 20

# Run the diagnostic script
log "Running diagnostic script..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/diagnose.php || echo "Connection failed")
log "Diagnostic script HTTP status: $HTTP_STATUS"

if [[ "$HTTP_STATUS" == "200" ]]; then
  log "✅ Diagnostic script accessible"
  DIAGNOSTIC_RESULT=$(curl -s http://localhost/diagnose.php || echo "Connection failed")
  echo "$DIAGNOSTIC_RESULT" > /tmp/laravel-diagnostic.html
  log "Diagnostic results saved to /tmp/laravel-diagnostic.html"
else
  log "⚠️ Diagnostic script returned status $HTTP_STATUS"
fi

# Create a simplified index.php for testing
log "Creating simplified index.php for testing..."
docker exec $CONTAINER_ID sh -c 'cp /var/www/html/public/index.php /var/www/html/public/index.php.bak && cat > /var/www/html/public/index.php << EOF
<?php
error_reporting(E_ALL);
ini_set("display_errors", 1);

require __DIR__."/../vendor/autoload.php";

\$app = require_once __DIR__."/../bootstrap/app.php";

try {
    \$kernel = \$app->make(Illuminate\\Contracts\\Http\\Kernel::class);
    \$response = \$kernel->handle(
        \$request = Illuminate\\Http\\Request::capture()
    );
    \$response->send();
    \$kernel->terminate(\$request, \$response);
} catch (Exception \$e) {
    echo "<h1>Laravel Error</h1>";
    echo "<pre>" . \$e->getMessage() . "\n" . \$e->getTraceAsString() . "</pre>";
}
EOF'

# Restart the container
log "Restarting container..."
docker restart $CONTAINER_ID

# Wait for container to restart
log "Waiting for container to restart..."
sleep 5

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

log "========== LARAVEL APPLICATION FIX COMPLETE =========="
