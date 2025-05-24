# SSL Certificate Management System for Traefik

This system provides automated SSL certificate management using Traefik's built-in Let's Encrypt ACME resolver with S3 storage to avoid rate limiting issues and ensure high availability.

## Features

- **Traefik Integration**: Uses Traefik's built-in ACME resolver for automatic certificate generation
- **S3 Storage**: Stores Traefik ACME data and certificates in AWS S3 for persistence
- **Rate Limit Avoidance**: Reuses existing ACME data from S3 to avoid Let's Encrypt rate limits
- **Auto-Renewal**: Traefik automatically renews certificates, with S3 backup
- **Fallback Support**: Creates self-signed certificates if Traefik ACME fails
- **Blue-Green Compatible**: Works seamlessly with the existing blue-green deployment setup

## Components

### 1. SSL Manager Script (`ssl-manager.sh`)
Main script that handles all SSL certificate operations with Traefik:

```bash
# Full certificate management (default)
./ssl-manager.sh manage

# Renew certificate if needed
./ssl-manager.sh renew

# Download certificate/ACME data from S3
./ssl-manager.sh download

# Upload certificate/ACME data to S3
./ssl-manager.sh upload

# Generate new certificate via Traefik
./ssl-manager.sh generate

# Extract certificates from Traefik ACME data
./ssl-manager.sh extract

# Create self-signed fallback certificate
./ssl-manager.sh fallback

# Setup auto-renewal system
./ssl-manager.sh setup-renewal
```

### 2. Systemd Service (`ssl-renewal.service`)
Systemd service for certificate renewal operations.

### 3. Systemd Timer (`ssl-renewal.timer`)
Systemd timer that runs certificate renewal daily with randomized delay.

### 4. Traefik Dynamic Configuration
Updated `traefik-dynamic.yml` with proper ACME resolver configuration.

## Configuration

The system uses environment variables from `.env.deploy`:

- `DOMAIN`: Domain name for the certificate (default: "harun.dev")
- `TRAEFIK_ACME_EMAIL`: Email for Let's Encrypt registration
- `CONFIG_BUCKET_NAME`: S3 bucket for certificate storage
- `AWS_ACCESS_KEY_ID`: AWS access key for S3 operations
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for S3 operations

## S3 Storage Structure

Certificates and ACME data are stored in S3 with the following structure:

```
s3://your-config-bucket/ssl-certificates/
├── traefik-acme.json           # Traefik ACME data (primary)
└── harun.dev/
    ├── cert.pem                # Extracted certificate file
    ├── privkey.pem             # Extracted private key
    ├── chain.pem               # Extracted certificate chain
    ├── fullchain.pem           # Extracted full certificate chain
    ├── metadata.json           # Certificate metadata
    └── acme-metadata.json      # ACME data metadata
```

## How It Works

### Initial Deployment
1. Checks for existing valid local certificate
2. If not found, downloads from S3
3. If S3 certificate is expired/missing, generates new Let's Encrypt certificate
4. Uploads new certificate to S3
5. Sets up auto-renewal system

### Certificate Generation Process
1. **Webroot Method**: First tries webroot challenge if nginx is running
2. **Standalone Method**: Falls back to standalone mode if webroot fails
3. **Service Management**: Temporarily stops conflicting services during standalone generation
4. **File Management**: Copies certificates to custom locations with proper permissions

### Auto-Renewal Process
1. **Daily Check**: Systemd timer runs daily with randomized delay
2. **Validity Check**: Checks if certificate expires within 30 days
3. **Renewal**: Uses certbot to renew if needed
4. **S3 Upload**: Uploads renewed certificate to S3
5. **Service Restart**: Restarts nginx and traefik services

## Rate Limiting Protection

Let's Encrypt has the following rate limits:
- **Certificates per Registered Domain**: 50 per week
- **Duplicate Certificate**: 5 per week
- **Failed Validation**: 5 failures per account, per hostname, per hour

Our system protects against these limits by:
1. **Certificate Reuse**: Downloads and reuses valid certificates from S3
2. **Validation Caching**: Stores successful certificates to avoid re-validation
3. **Fallback Mechanism**: Creates self-signed certificates if Let's Encrypt fails
4. **Smart Renewal**: Only renews when certificates are close to expiration (30 days)

## Monitoring and Logs

### Check Certificate Status
```bash
# Check certificate validity
openssl x509 -in /opt/portfolio/ssl/harun.dev.crt -noout -dates

# Check systemd timer status
sudo systemctl status ssl-renewal.timer

# View renewal logs
sudo journalctl -u ssl-renewal.service -f
```

### Manual Operations
```bash
# Force certificate renewal
sudo /opt/portfolio/deploy/ssl-manager.sh renew

# Check S3 certificate
aws s3 ls s3://your-bucket/ssl-certificates/harun.dev/

# Download certificate from S3
sudo /opt/portfolio/deploy/ssl-manager.sh download
```

## Troubleshooting

### Common Issues

1. **Rate Limit Exceeded**
   - Wait for rate limit reset (weekly)
   - Use existing certificate from S3
   - Use fallback self-signed certificate

2. **DNS Issues**
   - Ensure domain points to correct IP
   - Check DNS propagation
   - Verify firewall allows port 80

3. **Permission Issues**
   - Check file permissions in `/opt/portfolio/ssl/`
   - Ensure AWS credentials are correct
   - Verify S3 bucket permissions

4. **Service Conflicts**
   - Stop conflicting services on port 80
   - Check Docker container status
   - Verify nginx configuration

### Recovery Procedures

1. **Complete Certificate Reset**
   ```bash
   # Remove local certificates
   sudo rm -rf /opt/portfolio/ssl/*
   
   # Remove S3 certificates
   aws s3 rm s3://your-bucket/ssl-certificates/harun.dev/ --recursive
   
   # Generate new certificate
   sudo /opt/portfolio/deploy/ssl-manager.sh generate
   ```

2. **Fallback to Self-Signed**
   ```bash
   # Create self-signed certificate
   sudo /opt/portfolio/deploy/ssl-manager.sh fallback
   ```

## Security Considerations

- Private keys are stored with 600 permissions (root only)
- S3 bucket should have restricted access
- AWS credentials should use minimal required permissions
- Certificates are validated before use
- Auto-renewal reduces exposure time for compromised certificates

## Integration with Deployment

The SSL management system is integrated into the main deployment script (`deploy.sh`) at step 19. It:

1. Uploads SSL management files to the server
2. Installs AWS CLI if needed
3. Configures AWS credentials
4. Runs certificate management
5. Sets up auto-renewal system

This ensures that every deployment has valid SSL certificates without manual intervention. 