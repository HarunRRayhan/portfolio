# CI/CD Scripts

This directory contains all CI/CD related scripts for the blue-green zero-downtime deployment system.

## Scripts

### 🚀 `blue-green-deploy.sh`
Standalone blue-green deployment script that can be used for both manual and automated deployments.

**Usage:**
```bash
# Deploy to opposite of current active environment
./blue-green-deploy.sh

# Deploy to specific environment
./blue-green-deploy.sh blue
./blue-green-deploy.sh green
```

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

### 📚 `README-BLUE-GREEN.md`
Comprehensive documentation for the blue-green deployment system including:
- Architecture overview
- Deployment process
- Configuration guide
- Health checks
- Troubleshooting
- Security considerations

## Integration

These scripts are integrated with:
- **GitHub Actions**: `.github/workflows/deploy.yml`
- **Main Deploy Script**: `../deploy.sh`
- **Infrastructure**: `../terraform/`

## Quick Start

1. **Check Status**: `./status.sh`
2. **Deploy**: `./blue-green-deploy.sh`
3. **Monitor**: Check Traefik dashboard at `http://your-server:8080`

For detailed documentation, see [README-BLUE-GREEN.md](README-BLUE-GREEN.md). 