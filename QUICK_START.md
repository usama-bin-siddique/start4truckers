# Start4Truckers CRM - Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites

- PHP 8.2+ installed
- Composer installed
- MySQL 8.0+ running
- Node.js 18+ and npm installed

## Installation Steps

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd start4truckers

# Install PHP dependencies
composer install

# Install Node dependencies
npm install
```

### 2. Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

### 3. Configure Database

Edit `.env` file:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=start4truckers
DB_USERNAME=root
DB_PASSWORD=
```

### 4. Create Database

```bash
# Create database (if using MySQL command line)
mysql -u root -p
CREATE DATABASE start4truckers;
EXIT;

# Or use your MySQL GUI tool (phpMyAdmin, MySQL Workbench, etc.)
```

### 5. Run Migrations & Seed Data

```bash
# Run all migrations
php artisan migrate

# Seed initial data
php artisan db:seed
```

### 6. Create Storage Link

```bash
php artisan storage:link
```

### 7. Build Frontend Assets

**Option A: Development (with hot reload)**
```bash
npm run dev
```

**Option B: Production build**
```bash
npm run build
```

### 8. Start Development Server

```bash
# In a new terminal (if using npm run dev)
php artisan serve
```

### 9. Access Application

Open your browser and navigate to:
```
http://localhost:8000
```

### 10. Login

Use one of the seeded accounts:

**Admin User:**
- Email: `admin@start4truckers.com`
- Password: `password`

**Sales User:**
- Email: `sales@start4truckers.com`
- Password: `password`

**Processing User:**
- Email: `processing@start4truckers.com`
- Password: `password`

---

## Quick Feature Tour

### 1. Dashboard
- View at `/dashboard`
- See KPIs, charts, and recent activity
- Real-time metrics for leads, clients, revenue

### 2. Create a Lead
1. Go to `/leads`
2. Click "New Lead"
3. Fill form and submit
4. View lead detail page

### 3. Convert Lead to Client
1. Open a lead
2. Click "Convert to Client"
3. Confirm conversion
4. View new client page

### 4. Add a Payment
1. Go to client detail
2. Navigate to "Payments" tab
3. Click "Add Payment"
4. Enter payment details

### 5. Create a Task
1. Go to `/tasks`
2. Click "New Task"
3. Set priority and due date
4. Assign to user

### 6. View Reports
1. Login as admin
2. Go to `/reports`
3. Explore different report types
4. Filter by date range

### 7. Manage Settings
1. Login as admin
2. Go to `/settings`
3. Manage users, services, templates

---

## Testing Web3Forms Webhook

Use curl or Postman to test lead capture:

```bash
curl -X POST http://localhost:8000/api/webhook/web3forms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "(555) 123-4567",
    "state": "TX",
    "service": "DOT Number",
    "message": "Need help with registration"
  }'
```

Check `/leads` to see the new lead!

---

## Common Commands

### Clear All Caches
```bash
php artisan optimize:clear
```

### Fresh Install (Reset Everything)
```bash
php artisan migrate:fresh --seed
```

### View Routes
```bash
php artisan route:list
```

### Check Database Status
```bash
php artisan migrate:status
```

### Run Queue Worker (if using queues)
```bash
php artisan queue:work
```

---

## Troubleshooting

### Issue: 500 Error
```bash
# Check logs
tail -f storage/logs/laravel.log

# Clear caches
php artisan optimize:clear

# Check permissions
chmod -R 775 storage bootstrap/cache
```

### Issue: Assets Not Loading
```bash
# Rebuild assets
npm run build

# Check APP_URL in .env matches your domain
```

### Issue: Database Connection Failed
- Verify MySQL is running
- Check credentials in `.env`
- Ensure database exists

### Issue: npm scripts fail on Windows
- Run PowerShell as Administrator
- Execute: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Try `npm run dev` again

---

## Next Steps

1. ✅ Explore the application
2. ✅ Read the full [README.md](README.md)
3. ✅ Review [TESTING_GUIDE.md](TESTING_GUIDE.md) for comprehensive testing
4. ✅ Check [DEPLOYMENT.md](DEPLOYMENT.md) before deploying to production
5. ✅ Review [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for complete feature list

---

## Getting Help

- Check the documentation files in the root directory
- Review error logs in `storage/logs/laravel.log`
- Verify all prerequisites are met
- Ensure all dependencies are installed

---

**You're all set! 🎉**

Start building your trucking authority services CRM!
