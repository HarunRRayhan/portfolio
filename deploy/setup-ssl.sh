#!/bin/bash

# Load environment variables
if [ -f "$(dirname "$0")/.env.deploy" ]; then
  set -a
  . "$(dirname "$0")/.env.deploy"
  set +a
fi

# Server details
# SERVER_IP and SERVER_USER are now loaded from .env.deploy

# SSH into server and set up SSL
ssh -i terraform/portfolio-key.pem $SERVER_USER@$SERVER_IP << 'ENDSSH'
# Update and install certbot for Ubuntu
sudo apt-get update -y
sudo apt-get install -y certbot

# Stop any running nginx
sudo systemctl stop nginx || true

# Obtain SSL certificate using standalone mode
sudo certbot certonly --standalone -d harun.dev --non-interactive --agree-tos --email harun@harun.dev

# Create SSL directory for Docker
sudo mkdir -p /opt/portfolio/ssl
sudo cp /etc/letsencrypt/live/harun.dev/fullchain.pem /opt/portfolio/ssl/harun.dev.crt
sudo cp /etc/letsencrypt/live/harun.dev/privkey.pem /opt/portfolio/ssl/harun.dev.key
sudo chown -R ubuntu:ubuntu /opt/portfolio/ssl

# Stop nginx (Docker will handle it)
sudo systemctl stop nginx || true
ENDSSH

echo "SSL certificates have been set up!" 