# Start4Truckers CRM - Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Configuration

- [ ] Copy `.env.example` to `.env`
- [ ] Set `APP_ENV=production`
- [ ] Set `APP_DEBUG=false`
- [ ] Generate app key: `php artisan key:generate`
- [ ] Configure database credentials:
  ```
  DB_CONNECTION=mysql
  DB_HOST=your-db-host
  DB_PORT=3306
  DB_DATABASE=start4truckers_prod
  DB_USERNAME=your-db-user
  DB_PASSWORD=your-secure-password
  ```
- [ ] Set `APP_URL` to production URL

### 2. Database Setup

- [ ] Create production database
- [ ] Run migrations: `php artisan migrate --force`
- [ ] Seed initial data: `php artisan db:seed --force`
- [ ] Verify all tables created successfully
- [ ] Create database backups schedule

### 3. Storage & File Uploads

- [ ] Create storage directories: `php artisan storage:link`
- [ ] Set proper permissions:
  ```bash
  chmod -R 775 storage bootstrap/cache
  chown -R www-data:www-data storage bootstrap/cache
  ```
- [ ] Configure file disk in `config/filesystems.php`
- [ ] Test file upload/download functionality

### 4. Email Configuration

- [ ] Configure mail driver (SMTP, SendGrid, Mailgun, etc.):
  ```
  MAIL_MAILER=smtp
  MAIL_HOST=smtp.mailtrap.io
  MAIL_PORT=2525
  MAIL_USERNAME=your-username
  MAIL_PASSWORD=your-password
  MAIL_FROM_ADDRESS="noreply@start4truckers.com"
  MAIL_FROM_NAME="Start4Truckers"
  ```
- [ ] Test email sending

### 5. Third-Party Services

- [ ] Configure Web3Forms credentials:
  ```
  web3forms_key=your-api-key
  web3forms_secret=your-webhook-secret
  ```
- [ ] Update webhook URL in Web3Forms dashboard
- [ ] Test webhook integration

### 6. Frontend Build

- [ ] Install Node dependencies: `npm install --production`
- [ ] Build assets: `npm run build`
- [ ] Verify `public/build` directory contains compiled assets
- [ ] Test asset loading in browser

### 7. Caching & Optimization

- [ ] Cache configuration: `php artisan config:cache`
- [ ] Cache routes: `php artisan route:cache`
- [ ] Cache views: `php artisan view:cache`
- [ ] Optimize autoloader: `composer install --optimize-autoloader --no-dev`

### 8. Security Hardening

- [ ] Change default admin password
- [ ] Remove or disable test/demo accounts
- [ ] Set secure session configuration:
  ```
  SESSION_DRIVER=database
  SESSION_LIFETIME=120
  SESSION_SECURE_COOKIE=true
  SESSION_HTTP_ONLY=true
  SESSION_SAME_SITE=strict
  ```
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS if needed
- [ ] Set up rate limiting
- [ ] Review and remove debug statements

### 9. Logging & Monitoring

- [ ] Configure logging channel: `LOG_CHANNEL=stack`
- [ ] Set log level: `LOG_LEVEL=error`
- [ ] Set up log rotation
- [ ] Configure error tracking (Sentry, Bugsnag, etc.)
- [ ] Set up uptime monitoring

### 10. Backups

- [ ] Set up automated database backups
- [ ] Set up file storage backups
- [ ] Test backup restoration process
- [ ] Document backup locations and procedures

### 11. Server Requirements

Verify server meets minimum requirements:
- [ ] PHP 8.2 or higher
- [ ] MySQL 8.0 or higher
- [ ] Composer 2.x
- [ ] Node.js 18+ and npm
- [ ] Required PHP extensions:
  - BCMath
  - Ctype
  - Fileinfo
  - JSON
  - Mbstring
  - OpenSSL
  - PDO
  - Tokenizer
  - XML

### 12. Web Server Configuration

#### Apache (.htaccess)
- [ ] Verify mod_rewrite is enabled
- [ ] Document root points to `/public`
- [ ] `.htaccess` file exists in `/public`

#### Nginx (example config)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/start4truckers/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### 13. Queue & Scheduler (Optional)

If using queues or scheduled tasks:
- [ ] Configure queue driver: `QUEUE_CONNECTION=database`
- [ ] Set up supervisor or systemd for queue worker
- [ ] Add cron entry for scheduler:
  ```
  * * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
  ```

### 14. Testing in Production

- [ ] Perform smoke tests (login, create lead, etc.)
- [ ] Test all user roles (admin, sales, processing)
- [ ] Verify email notifications work
- [ ] Test file uploads and downloads
- [ ] Verify reports generate correctly
- [ ] Test webhook integration
- [ ] Check error pages (404, 500)

### 15. Post-Deployment

- [ ] Monitor error logs for 24-48 hours
- [ ] Verify scheduled tasks run correctly
- [ ] Check database performance
- [ ] Monitor server resources (CPU, memory, disk)
- [ ] Gather user feedback

## Rollback Plan

In case of critical issues:

1. **Database Rollback**
   ```bash
   php artisan migrate:rollback --step=1
   ```

2. **Code Rollback**
   ```bash
   git checkout previous-stable-tag
   composer install
   npm run build
   php artisan config:clear
   php artisan cache:clear
   ```

3. **Restore Database Backup**
   ```bash
   mysql -u username -p database_name < backup.sql
   ```

## Maintenance Mode

To enable maintenance mode during updates:
```bash
php artisan down --secret="your-secret-token"
# Perform updates
php artisan up
```

Access site during maintenance: `https://your-domain.com/your-secret-token`

## Common Issues & Solutions

### Issue: 500 Internal Server Error
- Check `.env` file exists and is readable
- Check storage permissions
- Review error logs: `storage/logs/laravel.log`
- Clear all caches: `php artisan optimize:clear`

### Issue: Assets not loading
- Verify `npm run build` completed successfully
- Check `public/build/manifest.json` exists
- Ensure `APP_URL` in `.env` is correct

### Issue: Database connection failed
- Verify database credentials in `.env`
- Check database server is running
- Verify user has correct permissions

### Issue: File uploads failing
- Check storage directory permissions
- Verify `storage/app/private` directory exists
- Check PHP `upload_max_filesize` and `post_max_size` settings

## Support Contacts

- **Developer**: [Your contact info]
- **Hosting Provider**: [Provider contact]
- **Database Admin**: [DBA contact]

## Version History

- **v1.0.0** - Initial deployment (Date: _____)
  - Full CRM functionality
  - Lead management
  - Client management
  - Payments, Documents, Tasks
  - Reports and Analytics
  - Notifications system

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Version**: _______________  
**Sign-off**: _______________
