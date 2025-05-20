# Deployment Files Cleanup Plan

## Current Issues
- Too many redundant files
- Duplicate scripts in different directories
- Multiple versions of similar functionality
- Unclear which files are actually used in production

## Files to Keep

### Core Deployment Files
- `/deploy/deploy.sh` - Main deployment script
- `/deploy/blue-green-ssl-deploy.sh` - Blue-green deployment with SSL
- `/deploy/.env.deploy` - Deployment environment variables
- `/deploy/.env.appprod` - Production app environment variables

### Docker Configuration
- `/docker/docker-compose-blue-green.yml` - Main Docker Compose file for blue-green deployment
- `/docker/Dockerfile.blue` - Dockerfile for blue environment
- `/docker/Dockerfile.green` - Dockerfile for green environment

### SSL Configuration
- `/docker/ssl/` - SSL certificates directory

## Files to Remove

### Redundant Scripts
- `/docker/blue-green-deploy.sh` - Redundant with `/deploy/blue-green-ssl-deploy.sh`
- `/docker/blue-green-ssl-deploy.sh` - Redundant with `/deploy/blue-green-ssl-deploy.sh`
- `/docker/local-blue-green-deploy.sh` - Only needed for local testing
- `/docker/local-blue-green-deploy-ssl.sh` - Only needed for local testing
- `/docker/simple-blue-green-deploy.sh` - Simplified version not needed

### Test Files (after testing is complete)
- `/deploy/test-blue-green-ssl.sh` - Test script
- `/deploy/renew-ssl-cert-test.sh` - Test certificate renewal
- `/deploy/rollback-blue-test.sh` - Test rollback script
- `/docker/docker-compose-blue-green-test.yml` - Test Docker Compose file

### Backup Files
- `/deploy/deploy.sh.backup` - Old backup
- `/docker/docker-compose.yml.backup` - Old backup
- `/.env.bak` - Backup environment file

## Implementation Plan

1. **Verify Current Functionality**
   - Ensure the main deployment script works with the blue-green strategy
   - Test the SSL certificate generation and renewal

2. **Consolidate Scripts**
   - Move all deployment logic to `/deploy/` directory
   - Keep Docker configuration files in `/docker/` directory

3. **Remove Redundant Files**
   - After verifying functionality, remove the files listed above

4. **Update Documentation**
   - Document the simplified deployment process
   - Create a README explaining the deployment architecture

## Expected Result

A clean, maintainable deployment setup with:
- Clear separation of concerns
- No redundant files
- Well-documented deployment process
- Simplified maintenance
