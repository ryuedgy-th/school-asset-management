# School Asset Management System

A comprehensive web-based system for managing school IT assets, including borrowing, returning, and tracking equipment with digital signature capabilities.

## 🚀 Features

- **Asset Management**: Track computers, tablets, projectors, and other IT equipment
- **Borrowing System**: Teachers can borrow equipment with digital signatures
- **Assignment Tracking**: Manage academic year-based equipment assignments
- **Digital Signatures**: Secure signature collection for assignments and transactions
- **QR Code Integration**: Generate QR codes for asset tracking
- **Return Management**: Process returns with condition checking and damage reporting
- **User Roles**: Admin, Technician, Teacher, and Staff roles with different permissions
- **Audit Logging**: Track all system activities
- **Email Notifications**: Automated signature request emails

## 📋 Prerequisites

Before installation, ensure you have:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **Git** (for cloning the repository)

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
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (Optional - for signature requests)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="your-email@gmail.com"
```

### 4. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed initial data
npx prisma db seed
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Key Dependencies

### Core Framework
- **Next.js 16.1.1** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety

### Database & ORM
- **Prisma 5.10.2** - Database ORM
- **SQLite** - Development database (can be switched to PostgreSQL/MySQL)

### Authentication
- **NextAuth.js 5.0.0-beta.25** - Authentication solution
- **bcryptjs** - Password hashing

### UI Components
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **React Signature Canvas** - Digital signature pad
- **QRCode.react** - QR code generation

### File Handling
- **Sharp** - Image processing
- **jsPDF** - PDF generation

### Email
- **Nodemailer** - Email sending

## 🗂️ Project Structure

```
school-asset-management/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── public/
│   └── uploads/              # Uploaded files (signatures, images)
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── dashboard/        # Dashboard pages
│   │   ├── sign/             # Public signature pages
│   │   └── lib/              # Server actions & utilities
│   ├── components/           # React components
│   ├── lib/                  # Client utilities
│   └── auth.ts              # Authentication config
├── .env                      # Environment variables
└── package.json             # Dependencies
```

## 🔐 Default Credentials

After seeding the database:

- **Admin**: admin@school.com / admin123
- **Technician**: tech@school.com / tech123
- **Teacher**: teacher@school.com / teacher123

## 🎯 Usage

### For Admins/Technicians:

1. **Add Assets**: Navigate to Assets → Add New Asset
2. **Create Assignment**: Go to Borrowing → Create Assignment
3. **Add Items to Assignment**: Click "Add Items" on assignment detail
4. **Request Signature**: Click "Request Signature" to generate link
5. **Send Link**: Copy link and send to teacher via email

### For Teachers:

1. **Receive Signature Link**: Get link via email
2. **Review Items**: Check borrowed equipment list
3. **Sign**: Draw signature and accept terms
4. **Submit**: Complete acknowledgment

### For Returns:

1. **Process Return**: Click "Process Return" on assignment
2. **Check Condition**: Mark each item's condition
3. **Add Notes**: Document any damage
4. **IT Signature**: IT staff signs to confirm return

## 🔄 Transaction Signature Flow

The system supports two types of signatures:

1. **Assignment Signature** (One-time)
   - Signed when assignment is first created
   - Cannot be re-signed

2. **Transaction Signature** (Per Addition)
   - Required when adding new items to existing assignment
   - Each transaction gets its own signature
   - Maintains complete audit trail

## 🛠️ Development

### Run Tests
```bash
npm test
```

### Build for Production
```bash
npm run build
npm start
```

### Database Management
```bash
# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name migration_name
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Database connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXT_PUBLIC_APP_URL` | Public app URL | Yes |
| `EMAIL_SERVER_HOST` | SMTP server host | No |
| `EMAIL_SERVER_PORT` | SMTP server port | No |
| `EMAIL_SERVER_USER` | SMTP username | No |
| `EMAIL_SERVER_PASSWORD` | SMTP password | No |
| `EMAIL_FROM` | Sender email address | No |

## 🐛 Troubleshooting

### Prisma Client Issues
```bash
# Regenerate Prisma Client
npx prisma generate
```

### Database Lock Errors
```bash
# Stop all Node processes
taskkill /F /IM node.exe  # Windows
killall node              # Mac/Linux

# Regenerate and restart
npx prisma generate
npm run dev
```

### Port Already in Use
```bash
# Change port in package.json or use:
PORT=3001 npm run dev
```

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For issues or questions, please contact the IT Department.

---

ฉันเพิ่งย้าย Source Code ของโปรเจกต์ Next.js มาที่เครื่องนี้ ช่วยเช็คและติดตั้ง Environment ให้พร้อมใช้งานหน่อย:

1. ตรวจสอบว่ามี Node.js ติดตั้งหรือยัง ถ้ายังให้แจ้งวิธีติดตั้ง
2. รันคำสั่ง `npm install` เพื่อลง Dependencies ทั้งหมด
3. รันคำสั่ง `npx prisma generate` เพื่อเตรียม Client สำหรับ Database
4. ถ้าระบบพร้อมแล้ว ให้ลองรัน Server ด้วย `npm run dev` ให้ที

ช่วยรันทีละคำสั่งและรายงานผลด้วย

Built with ❤️ for efficient school asset management
