# Apla Mandal (आपला मंडळ) — Digital Festival & Community Trust Management Platform

A modern, full-stack multi-tenant SaaS platform designed for Indian festivals (Ganeshotsav, Navratri, Shiv Jayanti, etc.) and community mandals/trusts. **Apla Mandal** digitizes the entire festival lifecycle — from donation collection with instant digital receipts to expense approval workflows, volunteer coordination, and CA-certified audit reports.

---

## 🏛️ Project Overview

Traditional mandals rely on physical receipt books, manual cash counting, paper vouchers, and cumbersome post-festival audit preparation. **Apla Mandal** provides a streamlined, transparent, and paperless solution:

- **100% Paperless Collections**: Issue official digital receipts with mandal logo, sequential receipt numbers, QR codes, and instant WhatsApp delivery.
- **Financial Governance**: Multi-level expense approvals (Volunteer → Treasurer → President) with photo bill attachments.
- **Budgeting & Risk Analysis**: Real-time spend vs. budget tracking with variance analysis.
- **Audit-Ready Reports**: 1-Click balance sheet and income-expenditure statements formatted for CA and Charity Commissioner audits.
- **Bilingual Interface**: Seamless switching between **मराठी (Marathi)** and **English**.
- **Role-Based Access Control (RBAC)**: Distinct permissions for Superadmin, President, Treasurer, Secretary, and Volunteers.

---

## 🏗️ Repository Architecture

```text
MandalPro/
├── backend/       # Node.js + Express.js REST API (JWT Auth, RBAC, Multi-tenant MongoDB)
├── admin-web/     # React 18 + Vite Admin Dashboard (Responsive web portal)
└── mobile-app/    # React Native (Expo) Mobile App (Offline collection & volunteer tools)
```

---

## 📦 Key Modules & Features

### 1. Multi-Tenant Architecture & Onboarding
- Independent data isolation per Mandal using tenant-scoped queries (`mandalId`).
- Automated onboarding flow with festival type selection, bank details, committee setup, and custom mandal logo upload.

### 2. Donations & Receipts
- **Server-Side Sequential Numbering**: Race-condition-free receipt numbering per mandal per financial year (`FY 2026-27/REC-001`).
- **Instant Digital Receipts**: Branded receipt cards with mandal seal, QR verification code, and one-tap WhatsApp sharing.
- **Audit-Safe Cancellations**: No hard deletes; cancellations require a mandatory reason and are logged in audit trails.

### 3. Expense Approvals & Cashflow
- Multi-state expense lifecycle: `Draft` ➔ `Submitted` ➔ `Approved / Rejected` ➔ `Paid` ➔ `Reconciled`.
- Bill/receipt camera and file uploads stored securely.
- Configurable approval threshold routing high-value expenses directly to the President.

### 4. Events, Tasks & Volunteers
- Event scheduling (e.g., Aagman, Visarjan, Maha Aarti, Blood Donation Camps).
- Task assignment with volunteer tracking and attendance logging.
- Digital Committee & Volunteer ID cards with photos and QR codes.

### 5. Sponsors, Vendors & Inventory
- Sponsor commitments, banner allocation, and payment receivables tracking.
- Asset inventory management (sound systems, lights, stage equipment) with issue/return status.

### 6. Committee Chat & Announcements
- Internal group messaging and broadcast channel for committee updates and emergency notices.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.x or higher (v20+ recommended)
- **npm**: v9.x or higher
- **MongoDB**: Local MongoDB instance or MongoDB Atlas cluster

---

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the `backend/` directory based on the following template:
   ```env
   PORT=3005
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173

   # Database Connection
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority

   # JWT Authentication
   JWT_SECRET=your_jwt_secret_key_change_in_production
   JWT_EXPIRES_IN=7d

   # Payment Gateway (Razorpay)
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret

   # Email Configuration (SMTP)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_email_app_password
   SMTP_FROM=your_email@gmail.com
   SMTP_FROM_NAME="Apla Mandal"
   ```

4. Run the backend server:
   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

   Health check endpoint: `GET http://localhost:3005/api/health`

---

### 2. Admin Web Setup

1. Navigate to the admin web directory:
   ```bash
   cd admin-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the `admin-web/` directory:
   ```env
   # Point to your local backend or remote API
   VITE_API_URL=http://localhost:3005/api
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. Build for production:
   ```bash
   npm run build
   ```
   Production assets will be output to `admin-web/dist/`.

---

### 3. Mobile App Setup (Expo)

1. Navigate to the mobile app directory:
   ```bash
   cd mobile-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npx expo start
   ```

4. Scan the generated QR code using **Expo Go** on an Android or iOS device connected to the same local network.

> **Note for Physical Devices**: Update the API base URL in `mobile-app/src/api/client.js` to your computer's local network IP (e.g. `http://192.168.1.10:3005/api`) rather than `localhost`.

---

## 🔒 Security & Best Practices

- **Zero Secrets in Git**: Never commit `.env` or configuration files with real credentials. All sensitive files are listed in `.gitignore`.
- **Tenant Isolation**: Every database operation enforces mandal ownership verification to prevent cross-tenant data leakage.
- **DNS Resolution on Windows**: Backend utilizes explicit public DNS fallbacks for resilient MongoDB Atlas SRV lookups on local ISP networks.
- **Audit Logging**: Sensitive mutations (canceling receipts, approving/rejecting funds, role modifications) maintain immutable audit log entries.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router 6, Recharts, Vanilla CSS |
| **Backend** | Node.js, Express.js, Mongoose, JWT, Nodemailer, Razorpay SDK |
| **Database** | MongoDB Atlas / MongoDB Server |
| **Mobile** | React Native, Expo 54, React Navigation, AsyncStorage |
| **Localization** | Custom bilingual i18n engine (Marathi & English) |

---

## 📄 License & Intellectual Property

Copyright © 2026 **Apla Mandal** (Operated by Quantromind Pvt. Ltd.). All Rights Reserved.
