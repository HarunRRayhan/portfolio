# Post-Deployment Cleanup Guide

This document outlines the files to remove and settings to update after successfully resolving the Cloudflare 521 error and ensuring the Laravel portfolio site is functioning correctly.

## Files to Remove

The following diagnostic and fix scripts were created for troubleshooting purposes and should be removed from the production server once the site is stable:

1. **Diagnostic Scripts**:
   - `/tmp/diagnose-site.sh`
   - `/tmp/laravel-diagnostic.html`

2. **Fix Scripts**:
   - `/tmp/fix-cloudflare-521.sh`
   - `/tmp/fix-db-connection.sh`
   - `/tmp/fix-permissions.sh`
   - `/tmp/fix-laravel-config.sh`
   - `/tmp/fix-laravel-app.sh`
   - `/tmp/fix-assets-server.sh`
   - `/tmp/download_assets.sh`

3. **Temporary Files**:
   - `/tmp/assets.tar.gz` (if exists)

## Settings to Update

After successful deployment, consider updating the following settings for better security and performance:

### 1. Laravel Environment Settings

Update the `.env` file on the server to:

```
APP_DEBUG=false
```

This disables debug mode, which should never be enabled in production.

### 2. File Permissions

While we used very permissive settings (777) to troubleshoot, you should tighten these for production:

```bash
# Run on the server
sudo chmod -R 755 /opt/portfolio/public
sudo chmod -R 755 /opt/portfolio/bootstrap
sudo chmod -R 775 /opt/portfolio/storage
sudo chmod 664 /opt/portfolio/storage/logs/laravel.log
```

### 3. Cloudflare Settings

Verify these Cloudflare settings are correctly configured:

- **SSL/TLS Mode**: Set to "Full (Strict)" for better security
- **Always Use HTTPS**: Enabled
- **Auto Minify**: Enable for JavaScript, CSS, and HTML
- **Brotli Compression**: Enabled
- **Browser Cache TTL**: Set to at least 4 hours (14400 seconds)
- **Development Mode**: Disabled (it was temporarily enabled for troubleshooting)

### 4. Database Configuration

Ensure the PostgreSQL database is properly secured:

```bash
# Run on the server
sudo -u postgres psql -c "ALTER USER portfolio WITH PASSWORD 'your-secure-password';"
```

Then update the password in the Laravel `.env` file.

### 5. Firewall Rules

Review and tighten the firewall rules:

```bash
# Only allow necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Deployment Process Improvements

To prevent similar issues in the future, consider implementing these improvements:

1. **Add Build Step**: Ensure assets are properly built during deployment:
   ```bash
   # Add to deploy.sh or CI/CD pipeline
   npm install
   npm run build
   ```

2. **Permission Fixes**: Add these commands to your deployment script:
   ```bash
   mkdir -p /opt/portfolio/storage/logs
   mkdir -p /opt/portfolio/storage/framework/{sessions,views,cache,cache/data}
   mkdir -p /opt/portfolio/bootstrap/cache
   chmod -R 775 /opt/portfolio/storage
   chmod -R 775 /opt/portfolio/bootstrap/cache
   touch /opt/portfolio/storage/logs/laravel.log
   chmod 664 /opt/portfolio/storage/logs/laravel.log
   ```

3. **Database Migrations**: Ensure migrations run during deployment:
   ```bash
   docker exec $CONTAINER_NAME sh -c 'cd /var/www/html && php artisan migrate --force'
   ```

4. **Cache Clearing**: Clear Laravel caches after deployment:
   ```bash
   docker exec $CONTAINER_NAME sh -c 'cd /var/www/html && php artisan config:clear && php artisan view:clear && php artisan route:clear'
   ```

## Monitoring Recommendations

To quickly identify and resolve similar issues in the future:

1. **Set Up Uptime Monitoring**: Use a service like UptimeRobot or Pingdom to monitor your site
2. **Enable Cloudflare Notifications**: Get alerts when your site goes down
3. **Set Up Log Monitoring**: Use a tool like Papertrail or Loggly to centralize logs
4. **Create Health Check Endpoint**: Add a `/health` endpoint to your Laravel app that checks database connectivity

## Backup Recommendations

Implement a regular backup strategy:

1. **Database Backups**: Daily PostgreSQL dumps
2. **File Backups**: Regular backups of the `/opt/portfolio` directory
3. **Store Backups Off-Site**: Use AWS S3 or similar for backup storage

By following this cleanup guide and implementing the recommended improvements, your Laravel portfolio site should remain stable and secure.
