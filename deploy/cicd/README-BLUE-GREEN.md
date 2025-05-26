# Blue-Green Zero-Downtime Deployment

This repository implements an advanced blue-green deployment strategy for zero-downtime deployments using Docker, Traefik, and GitHub Actions with intelligent environment management.

## Overview

Blue-green deployment is a technique that reduces downtime and risk by running two identical production environments called Blue and Green. At any time, only one of the environments is live, with the other serving as a staging environment for the next deployment.

Our enhanced implementation includes:
- **Smart Environment Detection**: Automatically determines current active environment
- **Intelligent Target Selection**: Chooses the best environment for deployment
- **NPM Build Integration**: Builds and uploads assets as part of deployment
- **Asset Backup & Rollback**: Automatic backup and restoration of static assets
- **Environment Rotation**: Automatically rotates green deployments to blue for next cycle
- **Comprehensive Health Checks**: Multi-layer validation before traffic switching
- **Multiple Trigger Support**: Supports push, pull request merges, and manual triggers

## Architecture

```
Internet → Traefik (Load Balancer) → Blue/Green Environments
                                   ↓
                              PostgreSQL Database
                                   ↓
                            Cloudflare R2 (Assets)
```

### Components

- **Traefik**: Acts as a reverse proxy and load balancer, routing traffic between blue and green environments
- **Blue Environment**: `php_blue` + `nginx_blue` containers
- **Green Environment**: `php_green` + `nginx_green` containers
- **Database**: Shared PostgreSQL database between both environments
- **Cloudflare R2**: CDN storage for static assets (CSS, JS, images, fonts)
- **GitHub Actions**: Automated CI/CD pipeline for deployments

## Deployment Triggers

The deployment system supports multiple trigger types:

### 1. Automatic Deployment (GitHub Actions)

The deployment is triggered automatically on:
- **Push Events**: Direct pushes to `main` or `features/cicd-v2` branches
- **Pull Request Merges**: When pull requests are merged into `main` branch
- **Manual Dispatch**: Manual workflow trigger via GitHub UI

### 2. Manual Deployment

You can also deploy manually using the standalone script:

```bash
# Auto-deploy (smart target selection)
./deploy/cicd/blue-green-deploy.sh

# Deploy to specific environment
./deploy/cicd/blue-green-deploy.sh blue
./deploy/cicd/blue-green-deploy.sh green
```

### Trigger Configuration

The GitHub Actions workflow uses the following trigger configuration:

```yaml
on:
  push:
    branches: [ main, features/cicd-v2 ]
  pull_request:
    branches: [ main ]
    types: [ closed ]  # Only triggers when PR is closed (merged or closed without merge)
  workflow_dispatch:   # Manual trigger
```

**Important**: The workflow includes a condition to only run deployments when:
- It's a direct push to specified branches, OR
- It's a merged pull request (not just closed), OR
- It's manually triggered

This prevents deployments from running on closed-but-not-merged pull requests.

## Enhanced Deployment Process

### 1. Pre-Deployment Phase
1. **NPM Build**: Compiles frontend assets locally
2. **Asset Backup**: Creates timestamped backup of current assets in R2
3. **Asset Upload**: Uploads built assets to Cloudflare R2 with proper content types
4. **Environment Detection**: Determines current active environment via Traefik API
5. **Smart Target Selection**: Chooses deployment target based on container status

### 2. Deployment Phase
1. **Code Sync**: Updates repository on server
2. **Environment Files**: Downloads latest configuration from S3
3. **Container Build**: Builds Docker images for target environment
4. **Health Validation**: Comprehensive health checks before traffic switch

### 3. Traffic Switch Phase
1. **Traefik Update**: Updates routing configuration
2. **Verification**: Confirms traffic is flowing to new environment
3. **Stability Check**: Waits and re-validates deployment

### 4. Post-Deployment Phase
1. **Cleanup**: Removes old environment containers
2. **Environment Rotation**: Moves green to blue for next deployment cycle
3. **CDN Purge**: Clears Cloudflare cache
4. **Asset Backup Cleanup**: Removes successful deployment backup from R2

### 5. Rollback Phase (On Failure)
1. **Asset Rollback**: Restores previous assets from backup
2. **Container Rollback**: Switches traffic back to previous environment
3. **Backup Preservation**: Keeps backup for manual investigation

## Files Structure

```
deploy/
├── cicd/
│   ├── blue-green-deploy.sh  # Enhanced deployment script
│   ├── status.sh            # Advanced status monitoring
│   ├── README-BLUE-GREEN.md # This documentation
│   └── README.md           # CI/CD folder overview
├── .env.deploy              # Deployment configuration
└── .env.appprod            # Application environment variables

docker/
├── docker-compose.yml       # Container definitions for blue/green
├── traefik-dynamic.yml     # Traefik routing configuration
└── nginx/
    ├── blue.conf           # Nginx config for blue environment
    └── green.conf          # Nginx config for green environment

.github/workflows/
└── deploy.yml              # GitHub Actions workflow
```

## Smart Environment Detection

The deployment script automatically detects the current state:

1. **Traefik Query**: Checks which service is actively receiving traffic
2. **Container Analysis**: Examines running containers if Traefik is unclear
3. **Fallback Strategy**: Uses sensible defaults if detection fails

```bash
# Example detection logic
if traefik_shows_blue_active; then
  current="blue"
  target="green"
elif containers_running_green; then
  current="green"
  target="blue"
else
  current="blue"  # default
  target="green"
fi
```

## Intelligent Target Selection

The script chooses the best deployment target:

1. **Check Target Environment**: If target has running containers, switch to opposite
2. **Avoid Conflicts**: Prevents deploying over active environment
3. **Maximize Availability**: Ensures one environment is always ready

## Environment Rotation Strategy

After successful green deployment:

1. **Image Tagging**: Tags green images as blue
2. **Blue Restart**: Starts blue containers with green's code
3. **Traffic Switch**: Moves traffic from green to blue
4. **Green Cleanup**: Removes green containers for next deployment

This ensures:
- Blue is always the "stable" environment
- Green is used for new deployments
- Next deployment cycle starts fresh

## Asset Backup & Rollback Strategy

To prevent asset-related issues during rollbacks, the deployment system implements a comprehensive asset backup strategy:

### Backup Process

1. **Pre-Deployment Backup**: Before uploading new assets, creates a timestamped backup
   ```
   s3://bucket/backup_20241126_143022/build/
   s3://bucket/backup_20241126_143022/fonts/
   s3://bucket/backup_20241126_143022/images/
   ```

2. **Backup Tracking**: Stores backup identifier in `deploy/.asset_backup_id` for reference

3. **Asset Upload**: Uploads new assets with `--delete` flag (replacing old assets)

### Rollback Process

On deployment failure:

1. **Automatic Asset Rollback**: Restores assets from backup using sync with `--delete`
2. **Container Rollback**: Switches traffic back to previous environment
3. **Backup Preservation**: Keeps backup for manual investigation

On deployment success:

1. **Backup Cleanup**: Removes backup from R2 to save storage costs
2. **Tracking Cleanup**: Removes local backup identifier file

### Benefits

- **Zero Asset Downtime**: Previous assets remain available during rollback
- **Consistent State**: Assets and containers are rolled back together
- **Storage Efficiency**: Successful deployment backups are automatically cleaned up
- **Manual Recovery**: Failed deployment backups are preserved for investigation

### Manual Asset Operations

```bash
# Check current backup status
cat deploy/.asset_backup_id

# Manual asset rollback (if needed)
./deploy/cicd/blue-green-deploy.sh --rollback-assets

# Manual backup cleanup
aws s3 rm s3://bucket/backup_20241126_143022 --recursive
```

## Configuration

### GitHub Secrets

The following secrets must be configured in your GitHub repository under the "production" environment:

- `AWS_ACCESS_KEY_ID`: AWS access key for S3 operations
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for S3 operations  
- `CONFIG_BUCKET_NAME`: S3 bucket name containing configuration files

### Environment Files

#### `.env.deploy`
Contains deployment configuration:
```bash
REMOTE_USER=ubuntu
PUBLIC_IP=your.server.ip
SSH_KEY=portfolio-key.pem
APP_DIR=/opt/portfolio
GIT_REPO=https://github.com/your-repo/portfolio
GIT_BRANCH=main

# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
CONFIG_BUCKET_NAME=your-config-bucket

# Cloudflare R2 Configuration
R2_BUCKET_NAME=your-r2-bucket
R2_S3_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key

# Cloudflare Configuration (optional)
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ZONE_ID=your_zone_id
```

#### `.env.appprod`
Contains Laravel application environment variables for production.

## Enhanced Health Checks

The deployment process includes comprehensive health checks:

1. **Container Status**: Verifies containers are running
2. **HTTP Health Endpoint**: Tests `/health` endpoint with retries
3. **Database Connectivity**: Validates database connection via Laravel
4. **Public Endpoints**: Tests HTTP and HTTPS endpoints
5. **Stability Checks**: Re-validates after traffic switch

### Health Endpoint

A health check endpoint is available at `/health`:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000000Z"
}
```

The endpoint returns:
- **200 OK**: Application and database are healthy
- **503 Service Unavailable**: Database connection failed or other critical issues

Note: The endpoint does not expose sensitive information for security reasons.

## Advanced Status Monitoring

The `status.sh` script provides comprehensive information:

- **Environment Analysis**: Shows which environments are running
- **Container Health**: Individual container status
- **Deployment Readiness**: Indicates next deployment target
- **Traefik Configuration**: Current routing setup
- **Quick Commands**: Ready-to-use deployment commands

## Traffic Switching

Traffic switching is handled by updating Traefik's dynamic configuration:

```yaml
# Before switch (Blue active)
services:
  web-blue:
    loadBalancer:
      servers:
        - url: "http://nginx_blue:80"

# After switch (Green active)  
services:
  web-green:
    loadBalancer:
      servers:
        - url: "http://nginx_green:80"
```

## Rollback Strategy

### Automatic Rollback

If any step fails during deployment, the system automatically:
1. Reverts Traefik configuration to previous environment
2. Ensures previous environment containers are running
3. Stops failed deployment containers
4. Logs detailed failure information

### Manual Rollback

To manually rollback:

```bash
# Check current status
./deploy/cicd/status.sh

# Deploy to specific environment
./deploy/cicd/blue-green-deploy.sh blue
./deploy/cicd/blue-green-deploy.sh green
```

## Asset Management

### NPM Build Process

1. **Version Check**: Ensures Node.js >= 18
2. **Clean Build**: Empties previous build artifacts
3. **Environment Setup**: Uses production environment for build
4. **Asset Compilation**: Runs `npm ci && npm run build`
5. **Cleanup**: Restores original environment files

### Cloudflare R2 Upload

1. **Content Types**: Sets proper MIME types for JS/CSS files
2. **Sync Strategy**: Uses `--delete` to remove old files
3. **Public Access**: Sets appropriate ACL for CDN access
4. **Asset Categories**: Handles build, fonts, and images separately

## Monitoring

### Enhanced Status Script

```bash
./deploy/cicd/status.sh
```

Provides:
- Active/inactive environment detection
- Container analysis with detailed status
- Health check results for all environments
- Deployment readiness assessment
- Quick command references

### Traefik Dashboard

Access the Traefik dashboard at: `http://your-server-ip:8080`

### Container Logs

```bash
# View all logs
docker compose -f docker/docker-compose.yml logs -f

# View specific environment
docker compose -f docker/docker-compose.yml logs -f php_blue nginx_blue
```

## Troubleshooting

### Common Issues

1. **Health Check Failures**
   - Check container logs: `docker compose logs php_[env] nginx_[env]`
   - Verify database connectivity
   - Ensure Laravel migrations completed

2. **Traffic Switch Failures**
   - Check Traefik configuration: `curl localhost:8080/api/rawdata`
   - Verify target containers are healthy
   - Review Traefik logs

3. **Asset Upload Issues**
   - Verify R2 credentials in `.env.deploy`
   - Check AWS CLI configuration
   - Ensure proper permissions on R2 bucket

4. **Environment Detection Issues**
   - Check Traefik API accessibility
   - Verify container naming conventions
   - Review Docker Compose configuration

### Debug Commands

```bash
# Check deployment status
./deploy/cicd/status.sh

# Test health endpoint
curl -f http://localhost/health

# Check Traefik configuration
curl -s http://localhost:8080/api/rawdata | jq '.http.services'

# View container status
docker compose -f docker/docker-compose.yml ps

# Check specific environment health
docker compose -f docker/docker-compose.yml exec -T nginx_blue curl -f http://localhost:80/health
```

## Security Considerations

1. **SSH Keys**: Stored securely in S3 and GitHub Secrets
2. **Environment Variables**: Sensitive data stored in S3, not in repository
3. **Network Isolation**: Containers use internal networks
4. **SSL/TLS**: Automatic certificate management with Let's Encrypt
5. **Health Endpoint**: No sensitive information exposure

## Performance Benefits

- **Zero Downtime**: Traffic switches instantly between environments
- **Fast Rollbacks**: Previous environment remains ready for immediate switch
- **Resource Efficiency**: Only one environment serves traffic at a time
- **Parallel Processing**: New deployment builds while current serves traffic
- **CDN Integration**: Static assets served from Cloudflare edge locations
- **Smart Caching**: Proper cache headers and purging strategies

## Best Practices

1. **Database Migrations**: Use backward-compatible migrations
2. **Asset Management**: Use CDN for static assets with proper versioning
3. **Health Checks**: Implement comprehensive health endpoints
4. **Monitoring**: Monitor both environments and Traefik
5. **Testing**: Test deployments in staging environment first
6. **Environment Rotation**: Let the system handle green→blue rotation automatically
7. **Rollback Planning**: Always have a rollback strategy ready
8. **PR Workflow**: Use pull requests for code review before deployment

## Advanced Features

### Environment Rotation

The system automatically rotates environments:
- Green deployments are moved to blue after successful deployment
- This ensures blue is always the "stable" environment
- Green is kept clear for the next deployment

### Smart Target Selection

The deployment script intelligently chooses targets:
- Avoids deploying over active environments
- Switches to opposite environment if target is occupied
- Maximizes system availability during deployments

### Comprehensive Validation

Multiple validation layers ensure deployment success:
- Pre-deployment environment checks
- Health validation before traffic switch
- Post-switch stability verification
- Final validation before cleanup

### Multi-Trigger Support

The system supports various deployment triggers:
- **Direct Push**: Immediate deployment on push to main branches
- **PR Merge**: Deployment after code review and merge
- **Manual Trigger**: On-demand deployment via GitHub UI
- **Conditional Logic**: Only deploys on actual merges, not closed PRs

## Support

For issues or questions:
1. Check the troubleshooting section
2. Run `./deploy/cicd/status.sh` for current state
3. Review GitHub Actions logs
4. Check Traefik dashboard
5. Examine container logs 