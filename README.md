# School Asset Management System

A comprehensive web-based system for managing school IT assets with RBAC permissions, email notifications, ticketing system, and Google SSO authentication.

## 🚀 Features

### Asset Management
- **IT Assets**: Track computers, tablets, projectors, and other IT equipment
- **FM Assets**: Manage facilities and building assets
- **Borrowing System**: Equipment assignments with digital signatures
- **QR Code Integration**: Generate QR codes for asset tracking
- **Inspections**: Periodic equipment condition checking with photo documentation

### Ticketing & Maintenance
- **Support Tickets**: Issue tracking with SLA management
- **Maintenance Logs**: Track repairs and maintenance work
- **PM Schedules**: Preventive maintenance scheduling
- **Auto-ticket Creation**: Automatically create tickets from inspection damage reports

### RBAC & Security
- **Role-Based Access Control**: 14 modules with 58 granular permissions
- **4 Default Roles**: Admin, Technician, Inspector, User
- **Department Scoping**: Department-level access control
- **Google SSO**: Secure login with @magicyears.ac.th accounts

### Email & Notifications
- **10 Email Templates**: Covering all workflows
- **Gmail API Integration**: OAuth-based email sending
- **Signature Requests**: Automated email notifications
- **Status Updates**: Real-time notifications for tickets and inspections

---

## 📋 Prerequisites

Before installation, ensure you have:

- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **Git** (for cloning the repository)

---

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd school-asset-management
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-minimum-32-characters"
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"

# Google OAuth (for SSO)
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (Gmail API - Optional)
EMAIL_FROM="your-email@magicyears.ac.th"
```

**Important Notes:**
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- Google OAuth: Get credentials from [Google Cloud Console](https://console.cloud.google.com)
- Gmail API: Configure OAuth consent screen and enable Gmail API

### 4. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Seed initial data (RBAC, templates, sample data)
npm run db:seed
```

**What gets seeded:**
- 3 Departments (IT, FM, Maintenance)
- 14 RBAC Modules with 58 Permissions
- 5 Roles (Admin, Technician, Inspector, User, Department Head)
- 10 Email Templates (Borrowing, Inspections, Tickets, Maintenance)
- 5 Test Users
- Sample assets and inspections

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Default Credentials

After seeding the database:

- **Admin**: admin@school.com / admin123
- **Technician**: tech1@school.com / admin123
- **Inspector**: inspector1@school.com / admin123

**OR** login via Google SSO with @magicyears.ac.th email (gets "User" role automatically)

---

## 📦 NPM Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Management
```bash
npm run db:reset     # Reset database + run seed
npm run db:seed      # Run seed only
npx prisma studio    # Open database GUI
npx prisma generate  # Regenerate Prisma Client
```

### Individual Seeds (Optional)
```bash
npm run seed:rbac         # Seed RBAC modules/permissions only
npm run seed:templates    # Seed email templates only
npm run seed:permissions  # Seed role permissions only
```

---

## 🗂️ Project Structure

```
school-asset-management/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Comprehensive seed (RBAC + Templates)
│   ├── seed-rbac.ts           # RBAC modules/permissions seed
│   ├── seed-templates.ts      # Email templates seed
│   └── migrations/            # Database migrations
├── public/
│   └── uploads/              # Uploaded files (signatures, photos)
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── (auth)/           # Protected pages (assets, tickets, etc.)
│   │   ├── sign/             # Public signature pages
│   │   └── lib/              # Server actions & utilities
│   ├── components/           # React components
│   ├── lib/                  # Client utilities & permissions
│   ├── auth.ts              # NextAuth configuration
│   └── auth.config.ts       # Auth middleware config
├── scripts/                  # Utility scripts
│   ├── check-rbac.ts         # Verify RBAC setup
│   ├── check-stock.ts        # Check asset stock integrity
│   └── fix-stuck-assets.ts  # Fix asset status issues
├── .env                      # Environment variables (DO NOT COMMIT)
├── .gitignore               # Git ignore rules
└── package.json             # Dependencies & scripts
```

---

## 🎯 Key Workflows

### 1. Asset Assignment with Signature

1. **Create Assignment**: Teacher → Asset Assignments → New
2. **Add Items**: Select equipment to assign
3. **Request Signature**: Generate secure signature link
4. **Teacher Signs**: Receive link via email, review & sign
5. **Track**: Monitor assignment status and return dates

### 2. Inspection & Ticket Creation

1. **Inspect Equipment**: Inspector creates inspection with photos
2. **Report Damage**: Mark damage and estimate repair cost
3. **Auto-ticket**: System creates ticket automatically
4. **Assign Technician**: Admin assigns ticket to technician
5. **Complete Repair**: Technician updates ticket status
6. **Close**: Inspector verifies and closes ticket

### 3. Ticket Management

1. **Create Ticket**: Report issue manually
2. **Assign**: Assign to department/technician
3. **Track SLA**: Monitor response and resolution times
4. **Update Status**: In Progress → Testing → Resolved
5. **Email Notifications**: Automatic updates to reporter

### 4. User Management & RBAC

1. **SSO Login**: New users login via Google SSO
2. **Auto-assign Role**: Get "User" role automatically
3. **Admin Updates**: Admin changes role via Users page
4. **Permissions**: Role determines accessible modules
5. **Department Scope**: Access limited by department

---

## 🔐 RBAC System

### Modules (14 total)

| Category | Modules |
|----------|---------|
| **IT** | IT Assets, Inspections, Assignments |
| **FM** | FM Assets, Maintenance, PM Schedules, Spare Parts |
| **Stationary** | Office Supplies |
| **Common** | Tickets, Reports |
| **System** | Users, Roles, Departments, Settings |

### Permissions per Module

- **View** - Read access
- **Create** - Create new records
- **Edit** - Modify existing records
- **Delete** - Remove records
- **Approve** - Approve requests (where applicable)
- **Execute** - Execute tasks (PM schedules)

### Default Roles

| Role | Scope | Permissions | Use Case |
|------|-------|-------------|----------|
| **Admin** | Global | 58 (all) | Full system access |
| **Technician** | Department | 9 | Tickets, Maintenance |
| **Inspector** | Department | 7 | Inspections, Tickets |
| **User** | Department | 1 | Basic view access |

---

## 📧 Email System

### Configuration

**Option 1: Gmail API (Recommended)**
1. Create OAuth credentials in Google Cloud Console
2. Enable Gmail API
3. Configure OAuth consent screen
4. Add email account in Settings → Email & Integration

**Option 2: SMTP (Legacy)**
```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=app-password
```

### Email Templates (10 total)

| Category | Templates |
|----------|-----------|
| **Borrowing** | Signature Request |
| **Inspections** | Inspection Report, Damage Approval, Damage Waiver |
| **Tickets** | Ticket Created, Status Updated, Resolved |
| **Maintenance** | Maintenance Request, PM Reminder, PM Completed |

Edit templates in: **Settings → Email & Integration → Email Templates**

---

## 🔄 Database Reset & Migration

### Full Reset (Development)
```bash
npm run db:reset
```
**What it does:**
1. Deletes all data
2. Runs migrations  
3. Seeds complete database (RBAC + Templates + Sample data)

### Production Migration
```bash
# 1. Create migration
npx prisma migrate dev --name migration_name

# 2. Apply to production
npx prisma migrate deploy

# 3. Seed if needed (first time only)
npm run db:seed
```

---

## 🐛 Troubleshooting

### SSO Login Error
```bash
# Ensure Google OAuth is configured
# Check .env has AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET
# Verify callback URL in Google Console: http://localhost:3000/api/auth/callback/google
```

### Email Templates Missing
```bash
# Re-run seed to create templates
npm run seed:templates
# or full seed
npm run db:seed
```

### RBAC Not Working
```bash
# Verify RBAC is seeded
npx tsx scripts/check-rbac.ts

# Re-seed RBAC
npm run seed:rbac
npm run seed:permissions
```

### Prisma Client Issues
```bash
# Regenerate Prisma Client
npx prisma generate

# If still failing, clear and regenerate
rm -rf node_modules/.prisma
npx prisma generate
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9   # Mac/Linux
npx kill-port 3000              # Windows/Mac/Linux

# Or use different port
PORT=3001 npm run dev
```

---

## 📝 Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | Database connection | Yes | `file:./dev.db` |
| `NEXTAUTH_SECRET` | Auth secret (32+ chars) | Yes | Generate with `openssl` |
| `NEXTAUTH_URL` | App URL | Yes | `http://localhost:3000` |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | Yes (SSO) | From Google Console |
| `AUTH_GOOGLE_SECRET` | Google OAuth Secret | Yes (SSO) | From Google Console |
| `NEXT_PUBLIC_APP_URL` | Public app URL | Yes | `http://localhost:3000` |
| `EMAIL_FROM` | Sender email | No | `admin@magicyears.ac.th` |

---

## 🚀 Deployment

### Preparing for Production

1. **Update environment variables** for production URLs
2. **Use PostgreSQL/MySQL** instead of SQLite
3. **Configure OAuth** with production callback URLs
4. **Set up email** (Gmail API recommended)
5. **Run migrations**: `npx prisma migrate deploy`
6. **Seed initial data**: `npm run db:seed` (first time only)

### Example Production .env

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
NEXTAUTH_SECRET="generated-production-secret-min-32-chars"
NEXTAUTH_URL="https://assets.magicyears.ac.th"
AUTH_GOOGLE_ID="production-google-client-id"
AUTH_GOOGLE_SECRET="production-google-secret"
NEXT_PUBLIC_APP_URL="https://assets.magicyears.ac.th"
```

---

## 📄 License

This project is proprietary software for Magic Years International School.

## 👥 Support

For issues or questions:
- **IT Department**: it@magicyears.ac.th
- **System Admin**: Check logs with `npm run dev` for detailed error messages

---

**Last Updated:** 2025-12-29
**Version:** 1.0.0
