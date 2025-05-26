# CI/CD Scripts

This directory contains all CI/CD related scripts for the blue-green zero-downtime deployment system.

## Scripts

### 🚀 `blue-green-deploy.sh`
Standalone blue-green deployment script that can be used for both manual and automated deployments. The script automatically detects whether it's running locally (with Node.js build capabilities) or on the server (deployment only).

**Usage:**
```bash
# Deploy to opposite of current active environment
./blue-green-deploy.sh

# Deploy to specific environment
./blue-green-deploy.sh blue
./blue-green-deploy.sh green
```

**Features:**
- **Smart Context Detection**: Automatically detects if running locally or on server
- **Local Mode**: Builds assets, uploads to R2, purges CDN cache
- **Server Mode**: Focuses on container deployment and traffic switching
- **Environment Detection**: Automatically determines target environment

### 📊 `status.sh`
Deployment status monitoring script that provides real-time information about the current deployment state.

**Usage:**
```bash
./status.sh
```

**Features:**
- Shows active/inactive environments
- Container health status
- Public endpoint status
- Traefik routing configuration
- Recent deployment information
- Quick command references

### 🧪 `test-deployment.sh`
Pre-deployment validation script that checks if the deployment setup is correct.

**Usage:**
```bash
./test-deployment.sh
```

**Features:**
- Validates required files exist
- Checks script permissions
- Verifies Node.js version (with GitHub Actions compatibility)
- Tests npm dependencies and build process
- Validates environment configuration
- Checks GitHub Actions workflow

### 📚 `README-BLUE-GREEN.md`
Comprehensive documentation for the blue-green deployment system including:
- Architecture overview
- Deployment process
- Configuration guide
- Health checks
- Troubleshooting
- Security considerations

## Architecture

The deployment system uses a **two-phase approach**:

### Phase 1: GitHub Actions (Local Build)
- **Asset Building**: Node.js 20 environment builds frontend assets
- **R2 Upload**: Static assets uploaded to Cloudflare R2 with proper content types
- **CDN Purge**: Cloudflare cache purged for immediate updates
- **Script Upload**: Deployment scripts uploaded to server

### Phase 2: Server Deployment
- **Environment Detection**: Determines current active environment (blue/green)
- **Container Deployment**: Builds and starts target environment containers
- **Health Checks**: Comprehensive testing before traffic switch
- **Traffic Switching**: Zero-downtime switch via Traefik
- **Environment Rotation**: Automatic rotation for next deployment cycle

## Integration

These scripts are integrated with:
- **GitHub Actions**: `.github/workflows/deploy.yml`
- **Main Deploy Script**: `../deploy.sh`
- **Infrastructure**: `../terraform/`

## Quick Start

1. **Test Setup**: `./test-deployment.sh`
2. **Check Status**: `./status.sh`
3. **Deploy**: `./blue-green-deploy.sh`
4. **Monitor**: Check Traefik dashboard at `http://your-server:8080`

## Performance Optimizations

The GitHub Actions workflow includes several caching mechanisms:
- **Node.js Dependencies**: Cached using `actions/cache` with npm cache
- **Deployment Configuration**: Cached deployment files from S3
- **Optimized Transfers**: Efficient file upload and directory preparation

## Troubleshooting

If deployment fails:
1. Run `./test-deployment.sh` to validate setup
2. Check `./status.sh` for current state
3. Review GitHub Actions logs
4. Verify server connectivity and permissions

For detailed documentation, see [README-BLUE-GREEN.md](README-BLUE-GREEN.md). 