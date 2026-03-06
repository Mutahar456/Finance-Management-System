# Infinity Wave Inc - Inventory Management System

A complete, professional inventory management system with finance tracking, project management, and comprehensive activity logging.

## 🚀 Features

- **Authentication**: Secure login/registration with role-based access (ADMIN/USER)
- **Inventory Management**: Full CRUD operations with image support
- **Finance Tracking**: Income and expense tracking with balance calculations
- **Projects Management**: Complete project tracking with assignments, deals, and timelines
- **Activity Logs**: Comprehensive audit trail for all actions
- **Dashboard**: Analytics and visualizations
- **Reports**: CSV/PDF export functionality

## 📋 Prerequisites

- Node.js 18+ 
- MySQL database
- npm or yarn

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/infinity_wave_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Cloudinary (Optional - for image uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 3. Setup Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Or create migration
npm run db:migrate
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Protected dashboard routes
│   ├── api/             # API routes
│   └── layout.tsx        # Root layout
├── components/
│   ├── ui/              # ShadCN UI components
│   ├── inventory/       # Inventory components
│   ├── finance/         # Finance components
│   ├── projects/        # Projects components
│   └── layout/            # Layout components
├── lib/                 # Utility functions
├── actions/             # Server actions
├── prisma/              # Database schema
└── types/               # TypeScript types
```

## 🔐 Default Roles

- **ADMIN**: Full access to all data and settings
- **USER**: Access to own data only

## 📝 Notes

- First user should be created through registration (defaults to USER role)
- To create an ADMIN, manually update the database or use Prisma Studio: `npm run db:studio`

## 🚧 Development Status

- ✅ Authentication
- ✅ Dashboard
- ✅ Inventory Management
- 🚧 Finance Tracking
- 🚧 Projects Management
- 🚧 Activity Logs
- 🚧 Reports & Export

## 📄 License

Proprietary - Infinity Wave Inc


