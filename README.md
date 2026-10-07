# S3T — Solutioning, Sizing and Scoping Tool

**S3T** is a modern, enterprise-grade cloud solution designed for solution architects, presales engineers, and delivery teams to collaboratively size, scope, estimate, and generate Statements of Work (SOW) and cost models with high precision.

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
- **State & Data:** Supabase JS Client (`@supabase/supabase-js`), Date-fns, Recharts
- **Exporting:** `docx`, `jspdf`, `jspdf-autotable`, `html2canvas`

### Mobile App (`mobile/`)
- **Framework:** React Native + Expo SDK 53 + TypeScript
- **State:** Zustand
- **Navigation:** React Navigation (Native Stack)

### Backend & Database (`supabase/`)
- **Database:** PostgreSQL with Row Level Security (RLS)
- **Authentication:** Supabase Auth (Email / Password)
- **Migrations:**
  - `001_initial_schema.sql`: Base tables (organizations, projects, members, WBS items, rates, procurement, approvals)
  - `002_additional_users.sql`: Seed users and organization memberships
  - `003_presales_features.sql`: Templates, secure token sharing, project cloning RPCs, and hardened RLS

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

### 2. Mobile Application

```bash
cd mobile
npm install
cp .env.example .env
npx expo start
```

### 3. Database Setup

Apply the SQL migration files in sequence using the Supabase SQL Editor:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_additional_users.sql`
3. `supabase/migrations/003_presales_features.sql`

---

## 📄 License

MIT
