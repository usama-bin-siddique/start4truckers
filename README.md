# Start4Truckers CRM

A comprehensive Customer Relationship Management system built for Start4Truckers, designed to manage leads, clients, services, payments, and operations in the trucking authority services industry.

## Features

### Core Modules

1. **Lead Management**
   - Manual lead creation and bulk import
   - Web3Forms integration for website lead capture
   - Lead status tracking (New, Contacted, Quote Sent, Won, Lost)
   - Lead assignment and routing
   - Activity timeline and notes
   - Convert leads to clients

2. **Client Management**
   - Client profiles with detailed information
   - Service management and tracking
   - Payment history and invoicing
   - Document management
   - Activity timeline
   - Client status tracking

3. **Payments & Invoicing**
   - Invoice creation and tracking
   - Payment recording (partial/full)
   - Payment receipt uploads
   - Outstanding balance reports
   - Payment method tracking

4. **Operations Management**
   - Service checklists for processing team
   - Task assignments
   - Service status tracking (Pending, In Progress, Completed)
   - Processing team workflow management

5. **Document Management**
   - Secure document storage
   - Category organization (License, Passport, EIN, Insurance, etc.)
   - Role-based access control
   - Document versioning
   - Search and filtering

6. **Task Management**
   - Task creation and assignment
   - Priority levels (Low, Medium, High, Urgent)
   - Due date tracking
   - Overdue task alerts
   - Task completion tracking

7. **Reports & Analytics**
   - Revenue reports (daily, monthly, yearly)
   - Lead conversion funnel
   - Sales by service
   - Employee performance metrics
   - Outstanding balances
   - Monthly trends and KPIs

8. **Notifications System**
   - Real-time notifications
   - New lead alerts
   - Assignment notifications
   - Task reminders
   - Payment notifications
   - Service completion alerts

9. **Settings & Configuration**
   - User management
   - Role-based permissions (Admin, Sales, Processing)
   - Service catalog management
   - Email template customization
   - API integration settings

### Role-Based Access Control

- **Admin**: Full system access
- **Sales**: Lead management, client management, payments
- **Processing**: Operations, client services, documents, tasks

### Dashboard

- Real-time KPIs (leads, revenue, clients, tasks)
- Monthly revenue charts
- Lead conversion analytics
- Recent activity feed
- Tasks due today

## Tech Stack

- **Backend**: Laravel 11 (PHP 8.2+)
- **Frontend**: React 18 + TypeScript
- **UI Framework**: Inertia.js (SPA without API)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Database**: MySQL 8.0+
- **Icons**: Lucide React

## Installation

### Prerequisites

- PHP 8.2 or higher
- Composer 2.x
- Node.js 18+ and npm
- MySQL 8.0 or higher

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd start4truckers
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Install Node dependencies**
   ```bash
   npm install
   ```

4. **Environment configuration**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Configure database**
   
   Edit `.env` file:
   ```
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=start4truckers
   DB_USERNAME=root
   DB_PASSWORD=
   ```

6. **Run migrations and seeders**
   ```bash
   php artisan migrate
   php artisan db:seed
   ```

7. **Create storage link**
   ```bash
   php artisan storage:link
   ```

8. **Build frontend assets**
   ```bash
   npm run build
   # Or for development with hot reload:
   npm run dev
   ```

9. **Start the development server**
   ```bash
   php artisan serve
   ```

10. **Access the application**
    
    Navigate to: `http://localhost:8000`

### Default Login Credentials

After seeding, you can login with:

- **Admin**: admin@start4truckers.com / password
- **Sales**: sales@start4truckers.com / password
- **Processing**: processing@start4truckers.com / password

## Project Structure

```
start4truckers/
├── app/
│   ├── Http/
│   │   ├── Controllers/      # Application controllers
│   │   │   ├── Api/          # API controllers (Web3Forms webhook)
│   │   │   └── Auth/         # Authentication controllers
│   │   ├── Middleware/       # Custom middleware
│   │   └── Policies/         # Authorization policies
│   ├── Models/               # Eloquent models
│   └── Services/             # Business logic services
├── database/
│   ├── migrations/           # Database migrations
│   ├── seeders/              # Database seeders
│   └── factories/            # Model factories
├── resources/
│   ├── js/
│   │   ├── Pages/            # Inertia.js page components
│   │   ├── Layouts/          # Layout components
│   │   ├── components/       # Reusable React components
│   │   │   └── ui/           # shadcn/ui components
│   │   └── lib/              # Utility functions
│   └── css/                  # Stylesheets
├── routes/
│   └── web.php               # Web routes
├── public/                   # Public assets
└── storage/                  # File storage
```

## Development

### Running Development Server

```bash
# Terminal 1: Laravel development server
php artisan serve

# Terminal 2: Vite development server with HMR
npm run dev
```

### Code Style

- PHP: Follow PSR-12 coding standard
- TypeScript/React: ESLint + Prettier configuration included
- Run formatter: `npm run format`

### Database

- Run migrations: `php artisan migrate`
- Rollback: `php artisan migrate:rollback`
- Fresh migrate with seed: `php artisan migrate:fresh --seed`

### Clearing Caches

```bash
php artisan optimize:clear  # Clear all caches
php artisan config:clear     # Clear config cache
php artisan route:clear      # Clear route cache
php artisan view:clear       # Clear view cache
```

## Testing

Comprehensive testing guide available in `TESTING_GUIDE.md`

### Quick Test

```bash
# Test authentication
curl -X POST http://localhost:8000/login \
  -d "email=admin@start4truckers.com&password=password"

# Test Web3Forms webhook
curl -X POST http://localhost:8000/api/webhook/web3forms \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Lead","email":"test@example.com","phone":"555-1234"}'
```

## Deployment

Deployment guide available in `DEPLOYMENT.md`

### Quick Deploy

```bash
# Production build
composer install --optimize-autoloader --no-dev
npm run build

# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
chmod -R 775 storage bootstrap/cache
```

## Web3Forms Integration

### Setup

1. Get API key from [web3forms.com](https://web3forms.com)
2. Configure in Settings > API Settings:
   - Web3Forms API Key
   - Web3Forms Webhook Secret
3. Configure webhook URL in Web3Forms dashboard:
   - URL: `https://your-domain.com/api/webhook/web3forms`
   - Method: POST

### Webhook Payload Example

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "state": "TX",
  "company": "ABC Trucking",
  "service": "DOT Number",
  "message": "Need help with DOT registration"
}
```

## API Endpoints

### Public Endpoints

- `POST /api/webhook/web3forms` - Web3Forms lead capture webhook

### Authenticated Endpoints

All other routes require authentication via session.

## Security

- CSRF protection on all forms
- Role-based access control (Policies)
- Secure file storage (private disk)
- Password hashing (bcrypt)
- SQL injection protection (Eloquent ORM)
- XSS protection (React escaping)

## Performance

- Eloquent eager loading to prevent N+1 queries
- Database indexing on foreign keys and search fields
- Asset bundling and minification (Vite)
- Query caching for reports
- Pagination for large datasets

## Troubleshooting

### Common Issues

**Issue**: 500 Error after deployment
- Clear all caches: `php artisan optimize:clear`
- Check `.env` file configuration
- Verify storage permissions: `chmod -R 775 storage`

**Issue**: Assets not loading
- Run: `npm run build`
- Check `APP_URL` in `.env` matches your domain

**Issue**: Database connection failed
- Verify credentials in `.env`
- Check MySQL is running
- Ensure database exists

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support, email: support@start4truckers.com

## Changelog

### Version 1.0.0 (Current)

- ✅ Complete CRM functionality
- ✅ Lead management with Web3Forms integration
- ✅ Client management with service tracking
- ✅ Payment and invoicing system
- ✅ Operations management for processing team
- ✅ Document management with secure storage
- ✅ Task management with notifications
- ✅ Comprehensive reports and analytics
- ✅ Real-time notifications system
- ✅ Role-based access control
- ✅ Activity timeline tracking
- ✅ Dashboard with KPIs and charts

---

Built with ❤️ for Start4Truckers
