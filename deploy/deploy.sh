#!/bin/bash

# Load environment variables
if [ -f "$(dirname "$0")/.env.deploy" ]; then
  set -a
  . "$(dirname "$0")/.env.deploy"
  set +a
fi

# Configuration
# REMOTE_USER, REMOTE_HOST, SSH_KEY, APP_DIR are now loaded from .env.deploy

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Function to execute SSH commands
execute_ssh() {
    ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "$1"
}

# Function to clone or update the git repository on the server
clone_or_update_repo() {
    execute_ssh "if [ ! -d $APP_DIR/.git ]; then \
        if [ -d $APP_DIR ]; then \
            rm -rf $APP_DIR/* $APP_DIR/.[!.]* $APP_DIR/..?* 2>/dev/null || true; \
        else \
            mkdir -p $APP_DIR; \
        fi; \
        git clone --branch $GIT_BRANCH $GIT_REPO $APP_DIR; \
    else \
        cd $APP_DIR && git fetch origin && git checkout $GIT_BRANCH && git pull origin $GIT_BRANCH; \
    fi"
}

echo -e "${GREEN}Starting deployment...${NC}"

# Create .env file
echo -e "${GREEN}Creating .env file...${NC}"
cat > .env << EOL
APP_NAME=Laravel
APP_ENV=production
APP_KEY=base64:$(openssl rand -base64 32)
APP_DEBUG=false
APP_URL=https://harun.dev

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=portfolio
DB_USERNAME=portfolio
DB_PASSWORD=$(openssl rand -base64 16)

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=mt1

VITE_APP_NAME="${APP_NAME}"
VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="${PUSHER_HOST}"
VITE_PUSHER_PORT="${PUSHER_PORT}"
VITE_PUSHER_SCHEME="${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"
EOL

# Clone or update repo on server
echo -e "${GREEN}Cloning or updating repository on server...${NC}"
clone_or_update_repo

# Copy .env file
echo -e "${GREEN}Copying .env file...${NC}"
scp -i "$SSH_KEY" .env "$REMOTE_USER@$REMOTE_HOST:$APP_DIR/.env"

# Execute deployment commands
echo -e "${GREEN}Executing deployment commands...${NC}"
execute_ssh "cd $APP_DIR && \
    docker-compose -f docker/docker-compose.yml down && \
    docker-compose -f docker/docker-compose.yml build --no-cache && \
    docker-compose -f docker/docker-compose.yml up -d && \
    docker-compose -f docker/docker-compose.yml exec -T app composer install --no-dev --optimize-autoloader && \
    docker-compose -f docker/docker-compose.yml exec -T app php artisan key:generate --force && \
    docker-compose -f docker/docker-compose.yml exec -T app php artisan config:cache && \
    docker-compose -f docker/docker-compose.yml exec -T app php artisan route:cache && \
    docker-compose -f docker/docker-compose.yml exec -T app php artisan view:cache && \
    docker-compose -f docker/docker-compose.yml exec -T app php artisan migrate --force && \
    docker-compose -f docker/docker-compose.yml exec -T app php artisan storage:link && \
    docker-compose -f docker/docker-compose.yml exec -T app chown -R ubuntu:ubuntu storage bootstrap/cache"

echo -e "${GREEN}Deployment completed!${NC}" 