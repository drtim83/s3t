# S3T — Solutioning, Sizing and Scoping Tool

[![Live App](https://img.shields.io/badge/Live%20App-s3t--platform.netlify.app-blue?style=flat-square)](https://s3t-platform.netlify.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**S3T** is a modern, enterprise-grade cloud platform designed for solution architects, presales engineers, and delivery teams to collaboratively size, scope, estimate, and generate Statements of Work (SOW) and cost models with high precision.

---

## 🌐 Live Application

- **Production URL:** [https://s3t-platform.netlify.app](https://s3t-platform.netlify.app)
- **Repository:** [https://github.com/drtim83/s3t](https://github.com/drtim83/s3t)

---

## 🚀 Key Features

- **Project Scoping & WBS Editor:** Hierarchical Work Breakdown Structure (WBS) with task estimation, dependencies, roles, and automated cost rollups.
- **Effort & Resource Planning:** Multi-resource rate card modeling, blended day rates, offshore/onshore ratios, and contingency buffers.
- **Procurement & Third-Party Costs:** Software licensing, cloud infrastructure, hardware, and subcontractor cost modeling with multi-currency forex conversions.
- **Interactive Simulations & Analytics:** Margin, blended cost, risk buffers, and real-time Gantt schedule views.
- **AI SOW Document Parser:** Intelligent parsing of RFP/SOW documents to extract deliverables, constraints, and initial WBS line items.
- **Client Sharing & Templates:** One-click read-only secure external share links and reusable project blueprint templates.
- **Export Formats:** High-fidelity DOCX proposals and PDF summary reports.
- **Mobile Companion App:** React Native / Expo cross-platform mobile companion for reviewing estimates, approvals, and executive dashboards on iOS & Android.

---

## 🛠 Tech Stack

### Web App (`web/`)
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS + Radix UI / Lucide icons
- **State & Data:** TanStack React Query, Zustand, Date-fns, Recharts
- **Exporting:** `docx`, `jspdf`, `jspdf-autotable`, `html2canvas`

### Backend & Cloud Services
- **Backend as a Service:** Google Firebase
- **Authentication:** Firebase Auth (Email & Password, Profile sync)
- **Database:** Cloud Firestore (Document Store with offline caching and real-time synchronization)
- **Security:** Granular Firestore Security Rules (`firestore.rules`)
- **Analytics:** Google Analytics 4 (`measurementId`)

### Mobile App (`mobile/`)
- **Framework:** React Native + Expo SDK 53 + TypeScript
- **State:** Zustand
- **Navigation:** React Navigation (Native Stack)

---

## 💻 Getting Started

### Prerequisites
- Node.js >= 18
- npm or yarn

### 1. Web Application

```bash
cd web
npm install
cp .env.example .env
npm run dev
```

Build for production:
```bash
npm run build
```

### 2. Environment Variables (`web/.env`)

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### 3. Mobile Application

```bash
cd mobile
npm install
cp .env.example .env
npx expo start
```

### 4. Deploying Firestore Security Rules

Deploy the rules in `firestore.rules` via the Firebase Console or Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 📄 License

MIT
