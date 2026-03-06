# 💰 Finance Management System

An **all‑in‑one Finance & Business Management System** that helps you manage **inventory, financial transactions, projects, and team activities** from a single, modern dashboard.

Use this project as a **production‑ready app** for your business or as a **learning resource** to understand how real‑world finance, inventory, and project management systems are built with **Next.js, Prisma, and MySQL**.

---

# 👨‍💻 Developer

- **GitHub Profile:**  
  https://github.com/Mutahar456  
- **Project Repository:**  
  https://github.com/Mutahar456/Finance-Management-System

Feel free to **star the repo**, **open issues**, or **create pull requests** if you want to contribute or report bugs.

---

# 🚀 Features (What You Get)

## 🔐 Authentication
- **Secure login & registration** with proper validation.
- **Role-based access control** (e.g., Admin / User) to control who can see and do what.
- **Protected routes & session management** so only authenticated users can access sensitive pages.

## 📦 Inventory Management
- **Full CRUD** (Create, Read, Update, Delete) operations for inventory items.
- **Product image upload** and storage for better product representation.
- **Category-wise & structured tracking** to keep stock organized and easy to search.

## 💵 Finance Tracking
- **Record income and expenses** with clear descriptions and categories.
- **Automatic balance calculation** so you always know current cash flow / net position.
- **Centralized financial records** to analyze trends and make better business decisions.

## 📁 Project Management
- **Create and manage projects** with important details in one place.
- **Assign tasks, deals, or work items** to projects for better organization.
- **Track timelines & progress** so you always know what’s pending and what’s completed.

## 📊 Dashboard
- **High-level business insights** at a glance (inventory, finance, and projects).
- **Visual data overview** using charts / stats for quick understanding.
- **Quick access shortcuts** to commonly used pages and actions.

## 📝 Activity Logs
- **Complete audit trail** of important actions performed in the system.
- **User-wise activity tracking** to understand who did what and when.
- **Improved transparency & accountability** for business operations.

## 📑 Reports
- **Export data to CSV** for custom analysis in Excel or Google Sheets.
- **Generate PDF reports** for sharing with clients, stakeholders, or management.
- **Finance & inventory specific reports** to quickly understand stock and cash status.

---

# 🛠️ Tech Stack (Why These Tools)

- **Next.js** – React framework for building **fast, SEO‑friendly, full‑stack apps** with API routes.
- **TypeScript** – Adds **strong typing and better DX**, reducing runtime bugs.
- **MySQL** – Reliable **relational database** for structured financial and inventory data.
- **Prisma ORM** – Modern **type‑safe database layer** for easier queries and migrations.
- **NextAuth** – Flexible **authentication solution** integrated directly into Next.js.
- **ShadCN UI** – Beautiful, **accessible UI components** for a modern look and feel.
- **Cloudinary** – Powerful **image hosting & optimization** for inventory product images.

---

# 📋 Prerequisites

Before you start, make sure you have:

- **Node.js 18+** – Required to run the Next.js application.
- **MySQL Database** – Local or remote instance for storing app data.
- **npm or yarn** – Any Node package manager to install dependencies.

You should also be comfortable with basic **terminal commands** and have **Git** installed.

---

# ⚙️ Installation & Setup

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/Mutahar456/Finance-Management-System.git
cd Finance-Management-System
```

## 2️⃣ Install Dependencies

```bash
npm install
# or
yarn
```

## 3️⃣ Configure Environment Variables

Create a new `.env` file in the project root (or use `.env.local` for Next.js) and set at least:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
NEXTAUTH_SECRET="your-strong-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

> Replace the placeholders with your actual MySQL and Cloudinary credentials.

## 4️⃣ Run Database Migrations

Apply Prisma migrations to create the database schema:

```bash
npx prisma migrate dev
```

You can also inspect your database using:

```bash
npx prisma studio
```

## 5️⃣ Start the Development Server

```bash
npm run dev
# or
yarn dev
```

Then open `http://localhost:3000` in your browser to access the app.

---

# ✅ Next Steps

- Create your first **users, projects, and inventory items**.
- Explore the **dashboard, finance tracking, and reports** pages.
- Customize the codebase to match **your own business logic and branding**.

If you find this project helpful, consider **starring the repository** and sharing it with others! 🚀