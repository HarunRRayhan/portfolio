#!/bin/bash

# SSL Certificate Manager for Let's Encrypt with S3 Storage
# Handles generation, storage, retrieval, and auto-renewal of SSL certificates

set -e
set -o pipefail

# Get script directory
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Load environment variables
if [ -f "$SCRIPT_DIR/.env.deploy" ]; then
  set -a
  . "$SCRIPT_DIR/.env.deploy"
  set +a
fi

# Configuration
DOMAIN=${DOMAIN:-"harun.dev"}
EMAIL=${TRAEFIK_ACME_EMAIL:-"me@harun.dev"}
S3_BUCKET=${CONFIG_BUCKET_NAME}
S3_PREFIX="ssl-certificates"
TRAEFIK_DIR="/opt/portfolio/docker"
ACME_FILE="$TRAEFIK_DIR/letsencrypt/acme.json"
CERT_DIR="/opt/portfolio/ssl"

# Certificate file paths (extracted from Traefik ACME)
CERT_FILE="$CERT_DIR/$DOMAIN.crt"
KEY_FILE="$CERT_DIR/$DOMAIN.key"
CHAIN_FILE="$CERT_DIR/$DOMAIN-chain.crt"
FULLCHAIN_FILE="$CERT_DIR/$DOMAIN-fullchain.crt"

# S3 paths
S3_CERT_PATH="s3://$S3_BUCKET/$S3_PREFIX/$DOMAIN"
S3_ACME_PATH="s3://$S3_BUCKET/$S3_PREFIX/traefik-acme.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if certificate exists and is valid
check_certificate_validity() {
    local cert_file="$1"
    local days_threshold=${2:-30}
    
    if [ ! -f "$cert_file" ]; then
        return 1
    fi
    
    # Check if certificate is valid and not expiring soon
    local expiry_date=$(openssl x509 -in "$cert_file" -noout -enddate | cut -d= -f2)
    local expiry_epoch=$(date -d "$expiry_date" +%s)
    local current_epoch=$(date +%s)
    local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
    
    if [ $days_until_expiry -gt $days_threshold ]; then
        log "Certificate valid for $days_until_expiry more days"
        return 0
    else
        warning "Certificate expires in $days_until_expiry days (threshold: $days_threshold)"
        return 1
    fi
}

# Download Traefik ACME data from S3
download_acme_from_s3() {
    log "Checking for existing Traefik ACME data in S3..."
    
    # Check if ACME data exists in S3
    if aws s3 ls "$S3_ACME_PATH" >/dev/null 2>&1; then
        log "Found Traefik ACME data in S3, downloading..."
        
        # Create Traefik letsencrypt directory
        sudo mkdir -p "$(dirname "$ACME_FILE")"
        
        # Download ACME file
        aws s3 cp "$S3_ACME_PATH" "/tmp/acme.json" 2>/dev/null || return 1
        
        # Move to final location with proper permissions
        sudo mv "/tmp/acme.json" "$ACME_FILE"
        sudo chmod 600 "$ACME_FILE"
        sudo chown root:root "$ACME_FILE"
        
        success "Traefik ACME data downloaded from S3"
        
        # Extract certificates for nginx/other services if needed
        extract_certificates_from_acme
        return 0
    else
        log "No Traefik ACME data found in S3"
        return 1
    fi
}

# Download individual certificate files from S3 (fallback)
download_certificate_from_s3() {
    log "Checking for individual certificate files in S3..."
    
    # Check if certificate exists in S3
    if aws s3 ls "$S3_CERT_PATH/" >/dev/null 2>&1; then
        log "Found certificate files in S3, downloading..."
        
        # Create local cert directory
        sudo mkdir -p "$CERT_DIR"
        
        # Download certificate files
        aws s3 cp "$S3_CERT_PATH/cert.pem" "/tmp/$DOMAIN.crt" 2>/dev/null || return 1
        aws s3 cp "$S3_CERT_PATH/privkey.pem" "/tmp/$DOMAIN.key" 2>/dev/null || return 1
        aws s3 cp "$S3_CERT_PATH/chain.pem" "/tmp/$DOMAIN-chain.crt" 2>/dev/null || return 1
        aws s3 cp "$S3_CERT_PATH/fullchain.pem" "/tmp/$DOMAIN-fullchain.crt" 2>/dev/null || return 1
        
        # Move to final location with proper permissions
        sudo mv "/tmp/$DOMAIN.crt" "$CERT_FILE"
        sudo mv "/tmp/$DOMAIN.key" "$KEY_FILE"
        sudo mv "/tmp/$DOMAIN-chain.crt" "$CHAIN_FILE"
        sudo mv "/tmp/$DOMAIN-fullchain.crt" "$FULLCHAIN_FILE"
        
        # Set proper permissions
        sudo chmod 600 "$KEY_FILE"
        sudo chmod 644 "$CERT_FILE" "$CHAIN_FILE" "$FULLCHAIN_FILE"
        sudo chown root:root "$CERT_FILE" "$KEY_FILE" "$CHAIN_FILE" "$FULLCHAIN_FILE"
        
        success "Certificate files downloaded from S3"
        return 0
    else
        log "No certificate files found in S3"
        return 1
    fi
}

# Upload Traefik ACME data to S3
upload_acme_to_s3() {
    log "Uploading Traefik ACME data to S3..."
    
    if [ -f "$ACME_FILE" ]; then
        # Upload ACME file to S3
        aws s3 cp "$ACME_FILE" "$S3_ACME_PATH"
        
        # Upload metadata
        echo "{\"domain\":\"$DOMAIN\",\"uploaded\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"source\":\"traefik-acme\"}" | aws s3 cp - "$S3_CERT_PATH/acme-metadata.json"
        
        success "Traefik ACME data uploaded to S3"
        return 0
    else
        warning "Traefik ACME file not found: $ACME_FILE"
        return 1
    fi
}

# Upload individual certificate files to S3
upload_certificate_to_s3() {
    log "Uploading certificate files to S3..."
    
    if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
        # Upload certificate files to S3
        aws s3 cp "$CERT_FILE" "$S3_CERT_PATH/cert.pem"
        aws s3 cp "$KEY_FILE" "$S3_CERT_PATH/privkey.pem"
        aws s3 cp "$CHAIN_FILE" "$S3_CERT_PATH/chain.pem"
        aws s3 cp "$FULLCHAIN_FILE" "$S3_CERT_PATH/fullchain.pem"
        
        # Upload metadata
        echo "{\"domain\":\"$DOMAIN\",\"generated\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"expires\":\"$(openssl x509 -in "$CERT_FILE" -noout -enddate | cut -d= -f2)\"}" | aws s3 cp - "$S3_CERT_PATH/metadata.json"
        
        success "Certificate files uploaded to S3"
        return 0
    else
        warning "Certificate files not found for upload"
        return 1
    fi
}

# Extract certificates from Traefik ACME JSON
extract_certificates_from_acme() {
    log "Extracting certificates from Traefik ACME data..."
    
    if [ ! -f "$ACME_FILE" ]; then
        warning "Traefik ACME file not found: $ACME_FILE"
        return 1
    fi
    
    # Create cert directory
    sudo mkdir -p "$CERT_DIR"
    
    # Install jq if not present
    if ! command -v jq &> /dev/null; then
        log "Installing jq for JSON parsing..."
        sudo apt-get update && sudo apt-get install -y jq
    fi
    
    # Extract certificate data using jq
    if sudo jq -r ".le.Certificates[] | select(.domain.main==\"$DOMAIN\") | .certificate" "$ACME_FILE" | base64 -d > "/tmp/$DOMAIN.crt" 2>/dev/null; then
        sudo jq -r ".le.Certificates[] | select(.domain.main==\"$DOMAIN\") | .key" "$ACME_FILE" | base64 -d > "/tmp/$DOMAIN.key" 2>/dev/null
        
        # Move to final location
        sudo mv "/tmp/$DOMAIN.crt" "$CERT_FILE"
        sudo mv "/tmp/$DOMAIN.key" "$KEY_FILE"
        
        # Create chain and fullchain files
        sudo cp "$CERT_FILE" "$FULLCHAIN_FILE"
        sudo cp "$CERT_FILE" "$CHAIN_FILE"
        
        # Set proper permissions
        sudo chmod 600 "$KEY_FILE"
        sudo chmod 644 "$CERT_FILE" "$CHAIN_FILE" "$FULLCHAIN_FILE"
        sudo chown root:root "$CERT_FILE" "$KEY_FILE" "$CHAIN_FILE" "$FULLCHAIN_FILE"
        
        success "Certificates extracted from Traefik ACME data"
        return 0
    else
        warning "Could not extract certificates for domain $DOMAIN from ACME data"
        return 1
    fi
}

# Check if Traefik is running
check_traefik_status() {
    if docker ps | grep -q traefik; then
        log "Traefik is running"
        return 0
    else
        warning "Traefik is not running"
        return 1
    fi
}

# Generate certificate using Traefik's ACME resolver
generate_certificate() {
    log "Generating certificate using Traefik's ACME resolver for $DOMAIN..."
    
    # Ensure Traefik ACME directory exists
    sudo mkdir -p "$(dirname "$ACME_FILE")"
    
    # Create empty ACME file if it doesn't exist
    if [ ! -f "$ACME_FILE" ]; then
        log "Creating empty ACME file for Traefik..."
        echo '{"le":{"Account":{"Email":"'$EMAIL'","Registration":null,"PrivateKey":"","KeyType":""},"Certificates":null}}' | sudo tee "$ACME_FILE" > /dev/null
        sudo chmod 600 "$ACME_FILE"
        sudo chown root:root "$ACME_FILE"
    fi
    
    # Restart Traefik to trigger certificate generation
    log "Restarting Traefik to trigger certificate generation..."
    cd /opt/portfolio
    docker compose -f docker/docker-compose.yml restart traefik
    
    # Wait for Traefik to generate certificate
    log "Waiting for Traefik to generate certificate..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        sleep 10
        
        # Check if certificate was generated
        if [ -f "$ACME_FILE" ] && sudo jq -r ".le.Certificates[]? | select(.domain.main==\"$DOMAIN\") | .domain.main" "$ACME_FILE" 2>/dev/null | grep -q "$DOMAIN"; then
            success "Certificate generated by Traefik"
            extract_certificates_from_acme
            return 0
        fi
        
        log "Attempt $attempt/$max_attempts: Waiting for certificate generation..."
        attempt=$((attempt + 1))
    done
    
    error "Traefik failed to generate certificate after $max_attempts attempts"
    return 1
}

# Trigger certificate generation via HTTP request
trigger_certificate_generation() {
    log "Triggering certificate generation by making HTTPS request..."
    
    # Make a request to trigger Traefik's ACME challenge
    curl -k -s "https://$DOMAIN" > /dev/null 2>&1 || true
    curl -s "http://$DOMAIN" > /dev/null 2>&1 || true
    
    log "Certificate generation triggered"
}

# Wait for Traefik to be ready
wait_for_traefik() {
    log "Waiting for Traefik to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if check_traefik_status; then
            success "Traefik is ready"
            return 0
        fi
        
        log "Attempt $attempt/$max_attempts: Waiting for Traefik..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    error "Traefik did not start within expected time"
    return 1
}

# Setup auto-renewal using systemd timer
setup_auto_renewal() {
    log "Setting up auto-renewal systemd timer..."
    
    # Copy systemd service and timer files
    if [ -f "/opt/portfolio/deploy/ssl-renewal.service" ]; then
        sudo cp "/opt/portfolio/deploy/ssl-renewal.service" "/etc/systemd/system/"
        sudo cp "/opt/portfolio/deploy/ssl-renewal.timer" "/etc/systemd/system/"
        
        # Reload systemd and enable timer
        sudo systemctl daemon-reload
        sudo systemctl enable ssl-renewal.timer
        sudo systemctl start ssl-renewal.timer
        
        success "Auto-renewal systemd timer configured"
    else
        warning "Systemd service files not found, falling back to cron job..."
        
        # Fallback to cron job
        cat > "/tmp/ssl-renew.sh" << 'EOF'
#!/bin/bash
# Auto-renewal script for SSL certificates

SCRIPT_DIR="/opt/portfolio/deploy"
cd "$SCRIPT_DIR"

# Source environment
if [ -f ".env.deploy" ]; then
    set -a
    . ".env.deploy"
    set +a
fi

# Run renewal
./ssl-manager.sh renew

# Restart services if renewal was successful
if [ $? -eq 0 ]; then
    echo "Certificate renewed, restarting services..."
    cd /opt/portfolio
    docker compose -f docker/docker-compose.yml restart nginx_blue nginx_green traefik 2>/dev/null || true
fi
EOF

        # Move script to proper location
        sudo mv "/tmp/ssl-renew.sh" "/opt/portfolio/ssl-renew.sh"
        sudo chmod +x "/opt/portfolio/ssl-renew.sh"
        
        # Add cron job (run daily at 2 AM)
        (sudo crontab -l 2>/dev/null; echo "0 2 * * * /opt/portfolio/ssl-renew.sh >> /var/log/ssl-renewal.log 2>&1") | sudo crontab -
        
        success "Auto-renewal cron job configured"
    fi
}

# Renew certificate if needed
renew_certificate() {
    log "Checking if certificate renewal is needed..."
    
    # Extract current certificates from Traefik ACME data
    if [ -f "$ACME_FILE" ]; then
        extract_certificates_from_acme
    fi
    
    if check_certificate_validity "$CERT_FILE" 30; then
        log "Certificate is still valid, no renewal needed"
        # Still upload to S3 to keep backup current
        upload_acme_to_s3
        return 0
    fi
    
    log "Certificate needs renewal"
    
    # Trigger renewal by restarting Traefik and making requests
    log "Triggering certificate renewal via Traefik..."
    trigger_certificate_generation
    
    # Wait for Traefik to renew the certificate
    if generate_certificate; then
        upload_acme_to_s3
        upload_certificate_to_s3
        success "Certificate renewed successfully"
        return 0
    else
        error "Failed to renew certificate"
        return 1
    fi
}

# Main certificate management function
manage_certificate() {
    log "Starting SSL certificate management for $DOMAIN"
    
    # First, try to restore Traefik ACME data from S3
    if download_acme_from_s3; then
        if check_certificate_validity "$CERT_FILE" 30; then
            success "Valid certificate restored from Traefik ACME data"
            return 0
        else
            log "ACME data restored but certificate needs renewal"
        fi
    fi
    
    # Check if we have a valid local certificate
    if check_certificate_validity "$CERT_FILE" 30; then
        success "Local certificate is valid"
        return 0
    fi
    
    # Try to download individual certificate files from S3 (fallback)
    if download_certificate_from_s3; then
        if check_certificate_validity "$CERT_FILE" 30; then
            success "Downloaded valid certificate from S3"
            return 0
        else
            warning "Downloaded certificate is expired or expiring soon"
        fi
    fi
    
    # Generate new certificate using Traefik
    log "Generating new certificate using Traefik..."
    trigger_certificate_generation
    
    if generate_certificate; then
        upload_acme_to_s3
        upload_certificate_to_s3
        success "New certificate generated and stored"
        return 0
    else
        error "Failed to generate certificate"
        return 1
    fi
}

# Create fallback self-signed certificate
create_fallback_certificate() {
    warning "Creating fallback self-signed certificate..."
    
    sudo mkdir -p "$CERT_DIR"
    
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$KEY_FILE" \
        -out "$CERT_FILE" \
        -subj "/CN=$DOMAIN"
    
    # Create chain and fullchain files (same as cert for self-signed)
    sudo cp "$CERT_FILE" "$CHAIN_FILE"
    sudo cp "$CERT_FILE" "$FULLCHAIN_FILE"
    
    # Set permissions
    sudo chmod 600 "$KEY_FILE"
    sudo chmod 644 "$CERT_FILE" "$CHAIN_FILE" "$FULLCHAIN_FILE"
    sudo chown root:root "$CERT_FILE" "$KEY_FILE" "$CHAIN_FILE" "$FULLCHAIN_FILE"
    
    warning "Fallback self-signed certificate created"
}

# Main script logic
case "${1:-manage}" in
    "manage")
        if ! manage_certificate; then
            warning "Certificate management failed, creating fallback certificate"
            create_fallback_certificate
        fi
        setup_auto_renewal
        ;;
    "renew")
        renew_certificate
        ;;
    "download")
        download_acme_from_s3 || download_certificate_from_s3
        ;;
    "upload")
        upload_acme_to_s3 && upload_certificate_to_s3
        ;;
    "generate")
        trigger_certificate_generation && generate_certificate && upload_acme_to_s3 && upload_certificate_to_s3
        ;;
    "extract")
        extract_certificates_from_acme
        ;;
    "fallback")
        create_fallback_certificate
        ;;
    "setup-renewal")
        setup_auto_renewal
        ;;
    *)
        echo "Usage: $0 {manage|renew|download|upload|generate|extract|fallback|setup-renewal}"
        echo ""
        echo "Commands:"
        echo "  manage        - Full certificate management (default)"
        echo "  renew         - Renew certificate if needed"
        echo "  download      - Download certificate/ACME data from S3"
        echo "  upload        - Upload certificate/ACME data to S3"
        echo "  generate      - Generate new certificate via Traefik"
        echo "  extract       - Extract certificates from Traefik ACME data"
        echo "  fallback      - Create self-signed fallback certificate"
        echo "  setup-renewal - Setup auto-renewal system"
        exit 1
        ;;
esac

log "SSL certificate management completed" 