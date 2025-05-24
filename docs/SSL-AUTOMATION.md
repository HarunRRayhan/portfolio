# SSL Certificate Automation System

This document describes the fully automated SSL certificate management system for the Harun.dev portfolio application.

## Overview

The SSL automation system provides:
- **Automatic certificate generation** via Traefik and Let's Encrypt
- **Automatic S3 backup** of certificates and ACME data
- **Automatic renewal** with daily health checks
- **Zero-downtime deployment** integration
- **Fallback mechanisms** for reliability

## System Components

### 1. Traefik ACME Integration
- **Primary method**: Traefik handles Let's Encrypt ACME challenges automatically
- **Configuration**: `docker/traefik-dynamic.yml` with `letsencrypt` resolver
- **Storage**: ACME data stored in `docker/letsencrypt/acme.json`

### 2. SSL Manager Script (`ssl-manager.sh`)
Comprehensive SSL management with commands:
- `manage` - Full certificate management (default)
- `renew` - Renew certificate if needed
- `backup` - Complete backup of all SSL data to S3
- `download` - Download certificate/ACME data from S3
- `upload` - Upload certificate/ACME data to S3
- `generate` - Generate new certificate via Traefik
- `extract` - Extract certificates from Traefik ACME data
- `setup-renewal` - Setup auto-renewal system

### 3. Systemd Auto-Renewal
- **Service**: `ssl-renewal.service` - Handles renewal and backup
- **Timer**: `ssl-renewal.timer` - Daily execution with randomized delay
- **Logs**: Available via `journalctl -u ssl-renewal.service`

### 4. S3 Backup Storage
```
s3://harun.dev-config-store/ssl-certificates/
├── traefik-acme.json           # Primary ACME data
└── harun.dev/
    ├── cert.pem                # Certificate
    ├── privkey.pem             # Private key
    ├── chain.pem               # Certificate chain
    ├── fullchain.pem           # Full certificate chain
    └── backup-metadata.json    # Backup metadata
```

## Automation Features

### During Deployment
1. **Environment Setup**: AWS credentials and configuration
2. **Certificate Generation**: Automatic via Traefik ACME
3. **S3 Backup**: Complete backup after generation
4. **Auto-Renewal Setup**: Systemd timer configuration
5. **Verification**: SSL connectivity and certificate validity

### Daily Operations
1. **Health Check**: Certificate validity verification
2. **Renewal**: Automatic if certificate expires within 30 days
3. **Backup**: Complete S3 backup after any changes
4. **Monitoring**: Systemd journal logging

### Backup Process
1. **Extract certificates** from Traefik ACME data
2. **Upload individual files** (cert, key, chain, fullchain)
3. **Backup ACME data** with proper permissions
4. **Store metadata** with timestamp and backup type

## Usage

### Automatic (Recommended)
The system runs automatically:
- **During deployment**: Full setup and initial backup
- **Daily**: Health checks, renewal, and backup via systemd timer
- **No manual intervention required**

### Manual Operations
```bash
# Test the automation system
./test-ssl-automation.sh

# Manual certificate management
./ssl-manager.sh manage

# Force renewal and backup
./ssl-manager.sh renew
./ssl-manager.sh backup

# Check auto-renewal status
sudo systemctl status ssl-renewal.timer
```

## Environment Variables

Required in `.env.deploy` or `docker/.env`:
```bash
CONFIG_BUCKET_NAME=harun.dev-config-store
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

## Monitoring

### Check Certificate Status
```bash
# HTTPS connectivity
curl -I https://harun.dev

# Certificate details
echo | openssl s_client -servername harun.dev -connect harun.dev:443 2>/dev/null | openssl x509 -noout -dates
```

### Check Auto-Renewal
```bash
# Timer status
sudo systemctl status ssl-renewal.timer

# Recent logs
journalctl -u ssl-renewal.service -n 50

# Next scheduled run
systemctl list-timers ssl-renewal.timer
```

### Check S3 Backups
```bash
# List backups
aws s3 ls s3://harun.dev-config-store/ssl-certificates/ --recursive

# Download backup for inspection
aws s3 cp s3://harun.dev-config-store/ssl-certificates/traefik-acme.json ./acme-backup.json
```

## Troubleshooting

### Certificate Generation Issues
1. **Check Traefik logs**: `docker compose logs traefik`
2. **Verify DNS**: Ensure domain points to server
3. **Check firewall**: Ports 80 and 443 must be open
4. **Rate limits**: Let's Encrypt has rate limits per domain

### Backup Issues
1. **AWS credentials**: Verify in `~/.aws/credentials`
2. **S3 permissions**: Ensure bucket access
3. **Network connectivity**: Check internet access from server

### Auto-Renewal Issues
1. **Timer status**: `sudo systemctl status ssl-renewal.timer`
2. **Service logs**: `journalctl -u ssl-renewal.service`
3. **Environment**: Check `/opt/portfolio/docker/.env`

## Security

### File Permissions
- **ACME data**: `600` (root only)
- **Private keys**: `600` (root only)
- **Certificates**: `644` (world readable)

### S3 Security
- **Bucket access**: Restricted to deployment credentials
- **Encryption**: Server-side encryption enabled
- **Versioning**: Enabled for backup history

## Integration

### Blue-Green Deployment
- **Zero downtime**: Certificates shared between blue/green stacks
- **Automatic backup**: Integrated into deployment process
- **Rollback support**: S3 backups enable quick recovery

### Monitoring Integration
- **Systemd logs**: Centralized logging via journalctl
- **S3 metadata**: Backup timestamps and status
- **Health checks**: Built into renewal process

## Testing

Run the comprehensive test suite:
```bash
./test-ssl-automation.sh
```

This tests:
- SSL manager script functionality
- Certificate status and validity
- S3 backup operations
- Auto-renewal system setup
- Manual renewal process

## Benefits

1. **Fully Automated**: No manual intervention required
2. **Reliable**: Multiple fallback mechanisms
3. **Monitored**: Comprehensive logging and status checks
4. **Secure**: Proper permissions and encrypted storage
5. **Scalable**: Easy to extend for multiple domains
6. **Integrated**: Seamless deployment process integration

The SSL automation system ensures your certificates are always valid, backed up, and renewed automatically without any manual intervention. 