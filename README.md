# MandalPro — Full Stack Scaffold

A working MERN + React Native implementation of the MandalPro spec, covering the **core flows**:
Onboarding, Donations & Digital Receipts, Expense Approval, Budgets & Forecast, Events & Tasks,
Dashboard, RBAC, Sponsors/Vendors, and Inventory. AI features (OCR, forecasting model, conversational
assistant), payment gateway, and WhatsApp integration are stubbed/simplified — see "What's Not Built Yet" below.

## Structure

```
mandalpro/
├── backend/       Express.js + MongoDB API (JWT auth, RBAC, multi-tenant)
├── admin-web/     React.js (Vite) admin dashboard for President/Treasurer/Secretary
└── mobile-app/    React Native (Expo) app for collectors/volunteers
```

## 1. Backend Setup

```bash
cd backend
npm install
npm run dev        # nodemon, or `npm start` for plain node
```

The `.env` file already contains the MongoDB connection string you provided. **Important:**
that connection string has a real password in it — since it was shared in this chat, consider
rotating the database user's password in MongoDB Atlas before this goes anywhere near production,
and never commit `.env` to a public repo (it's already in `.gitignore`).

Server runs on `http://localhost:5000`. Health check: `GET /api/health`.

## 2. Admin Web Setup

```bash
cd admin-web
npm install
npm run dev
```

Runs on `http://localhost:5173`. First-time use: go to **Register**, which creates a Mandal +
your President account together (onboarding flow 2.1). `admin-web/.env` points at
`http://localhost:5000/api` — change `VITE_API_URL` if your backend runs elsewhere.

## 3. Mobile App Setup (Expo)

```bash
cd mobile-app
npm install
npx expo start
```

Scan the QR code with Expo Go (Android/iOS) or run on an emulator.

**Before testing on a physical device:** edit `mobile-app/src/api/client.js` and replace
`http://localhost:5000` with your computer's LAN IP (e.g. `http://192.168.1.10:5000/api`) —
`localhost` on a phone refers to the phone itself, not your dev machine.

## What's Implemented (Core Flows)

- **Auth & Multi-Tenancy**: JWT login, mandal-scoped data isolation, RBAC middleware
  (president/treasurer/secretary/volunteer)
- **Onboarding**: Register creates Mandal + President account, event-type selection
- **Donations & Receipts**: trusted server-side sequential receipt numbering per mandal per
  financial year, QR code generation, cancel/reverse with mandatory reason + audit log
  (never hard-deleted)
- **Offline Collection & Sync**: mobile app queues donations locally when offline
  (AsyncStorage) with an idempotency key, and replays the queue on reconnect; server dedupes
- **Expense Approval Workflow**: Draft → Submit → Approve/Reject → Paid → Reconciled, with a
  configurable approval threshold routing large expenses to President
- **Budgets & Forecast**: live spend-vs-budget aggregation with a simple pace-based risk flag
  (on-track / at-risk / over)
- **Events & Tasks**: event creation, task assignment, attendance marking, event closure with
  an auto-generated collections/expenses/attendance summary
- **Sponsors/Vendors & Inventory**: basic CRUD + payment/due tracking, QR-tagged assets with
  issue/return tracking
- **Audit Trail**: all cancellations, reversals, rejections, and approvals are logged

## What's Not Built Yet (flagged in the spec as AI/infra-heavy)

These need real third-party services or ML infrastructure beyond a scaffold:
- **AI Bill OCR** — needs a vision/OCR API (e.g. Google Vision, AWS Textract); the `ocrData`
  field exists on the Expense model ready to receive it
- **AI Financial Assistant (conversational)** — needs an LLM wired to the safe read-only query
  set described in the spec
- **AI anomaly detection & ML-based forecasting** — v1 budget risk uses a simple rules-based
  pace check as the spec itself recommends; graduate to ML once you have transaction volume
- **Payment gateway (Razorpay/Cashfree) & webhook-driven billing activation**
- **WhatsApp Business API delivery** for receipts/notifications
- **OTP-based signup** — current auth is email + password; OTP requires an SMS provider
- **Document intelligence classification** (trust deeds, licenses, etc.)

## Security Note

The `.env` file in `backend/` contains a live MongoDB Atlas connection string with a password.
Treat it as a secret: don't commit it to a public GitHub repo, and rotate the password if this
project will be shared with anyone else.
