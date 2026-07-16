<div align="center">

<img src="https://img.shields.io/badge/ContractPulse-v1.0.0-6366f1?style=for-the-badge&logoColor=white" />

# ⚡ ContractPulse

### Automated B2B Contract Lifecycle & Escalation Intelligence Platform

**Never miss a renewal deadline again.**

ContractPulse extracts critical dates and obligations from legal PDFs using AI, then automatically escalates alerts through your organization's hierarchy — from account manager to CFO — before it's too late.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?style=flat-square&logo=redis&logoColor=white)](https://upstash.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## 🔥 The Problem

Mid-sized companies manage hundreds of vendor agreements, NDAs, and client contracts — buried in Google Drive folders. Legal and operations teams constantly miss critical auto-renewal deadlines, locking them into expensive multi-year commitments they wanted to cancel, or fail to fulfill SLA milestones, triggering massive breach-of-contract penalties.

**One missed auto-renewal on a ₹40 lakh/year contract costs more than this tool in 10 years.**

---

## ✨ What ContractPulse Does

```
Upload PDF → AI Extracts Key Terms → Dashboard Tracks Deadlines → Auto-Escalating Alerts
```

| Feature | Description |
|---|---|
| **PDF Intelligence** | Drop in any signed contract PDF — AI extracts dates, values, notice periods, and penalty clauses automatically |
| **Dual Extraction Engine** | Regex handles structured patterns instantly; LLM (Gemma 4 31B) fills in everything else |
| **Multi-Tier Escalation** | If the account manager ignores a 90-day warning, the system automatically alerts the Department Head, then the CFO |
| **One-Click Email Actions** | Recipients can acknowledge, renew, or cancel directly from the alert email — no login required |
| **Real-Time Updates** | Socket.io pushes processing status live to the dashboard as contracts are analyzed |
| **Audit Trail** | Every notification, state change, and decision is logged immutably — critical for legal disputes |
| **Multi-Tenant** | Complete data isolation between companies on the same infrastructure |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Frontend                          │
│              Dashboard · Contract Detail · Auth                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP + WebSocket
┌──────────────────────────▼──────────────────────────────────────┐
│                      Express.js API                             │
│          Auth · Contracts · Alerts · Dashboard                  │
└──────┬───────────────────┬────────────────────┬─────────────────┘
       │                   │                    │
┌──────▼──────┐   ┌────────▼────────┐  ┌───────▼────────┐
│  PostgreSQL  │   │  BullMQ + Redis │  │ Supabase       │
│  (Supabase) │   │   (Upstash)     │  │ Storage        │
│             │   │                 │  │ (PDF Files)    │
│ • Companies │   │ contract-       │  └────────────────┘
│ • Users     │   │ processing      │
│ • Contracts │   │ queue           │
│ • Milestones│   │                 │
│ • AuditLogs │   │ escalation      │
└─────────────┘   │ queue           │
                  └────────┬────────┘
                           │
          ┌────────────────▼────────────────┐
          │         Background Workers       │
          │                                  │
          │  contract.worker.js              │
          │  ├── pdf-parse (text extract)    │
          │  ├── Regex parser                │
          │  └── Ollama LLM (Gemma 4 31B)   │
          │                                  │
          │  escalation.worker.js            │
          │  ├── L1 alert (90 days)          │
          │  ├── L2 alert (60 days)          │
          │  └── L3 alert (30 days)          │
          └──────────────────────────────────┘
```

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose | Why |
|---|---|---|
| **Node.js + Express** | HTTP API server | Lightweight, massive ecosystem, async-first |
| **PostgreSQL (Supabase)** | Primary database | ACID compliance, relational integrity, JSONB for extracted data |
| **Prisma ORM** | Database access layer | Type-safe queries, automatic migrations, clean schema definition |
| **BullMQ + Redis (Upstash)** | Job queue + scheduler | Non-blocking PDF processing, reliable delayed escalation jobs |
| **pdf-parse** | PDF text extraction | Fast, no external dependencies, works on any PDF structure |
| **Ollama (Gemma 4 31B)** | LLM contract extraction | Structured JSON extraction from unstructured legal text |
| **Socket.io** | Real-time updates | Live processing status pushed to dashboard without polling |
| **JWT + bcryptjs** | Authentication | Stateless auth, secure password hashing |
| **Resend** | Transactional email | Reliable delivery, one-click action links in alert emails |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **Socket.io Client** | Real-time connection |

---

## 🚨 The Escalation Engine

The core of ContractPulse — a stateful, multi-tier alert system that doesn't just send reminders, it escalates automatically until someone acts.

```
Contract Processed
      │
      ▼
[90 days before notice deadline]
      │
      ▼
L1 Alert ──→ Account Manager emailed
      │           │
      │     [Acknowledged?] ──YES──→ STOP. Escalation cancelled.
      │           │NO
      ▼           ▼
[60 days] ──→ L2 Alert ──→ Account Manager + Department Head
      │           │
      │     [Acknowledged?] ──YES──→ STOP.
      │           │NO
      ▼           ▼
[30 days] ──→ L3 Alert ──→ Everyone (CFO + Legal + Admin)
                            Daily reminders until decision made
```

Each alert email contains **one-click signed action buttons** — no login required. The recipient clicks "Renewing" or "Cancelling" and the system updates instantly, cancelling all future escalation jobs.

---

## 📦 Project Structure

```
contractpulse/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── index.js               # Express app entry point
│   │   ├── lib/
│   │   │   ├── prisma.js          # Database client singleton
│   │   │   ├── queue.js           # BullMQ + Redis setup
│   │   │   └── socket.js          # Socket.io server
│   │   ├── middleware/
│   │   │   └── auth.middleware.js # JWT verification + role guards
│   │   ├── routes/
│   │   │   ├── auth.routes.js     # Register, login, /me
│   │   │   ├── contract.js        # Upload, list, detail, decision
│   │   │   ├── alerts.routes.js   # One-click action handler
│   │   │   └── dashboard.routes.js
│   │   ├── services/
│   │   │   ├── storage_service.js # Supabase PDF upload/download
│   │   │   ├── pdf_service.js     # Text extraction
│   │   │   ├── parser_service.js  # Regex extraction
│   │   │   ├── llm.service.js     # Ollama LLM extraction
│   │   │   └── email.service.js   # Resend alert emails
│   │   └── workers/
│   │       ├── contract_worker.js  # PDF processing pipeline
│   │       └── escalation_worker.js # Alert scheduling + firing
│   ├── .env.example
│   └── package.json
└── frontend/
    └── src/
        ├── pages/
        │   ├── Dashboard.jsx
        │   ├── ContractDetail.jsx
        │   └── Auth.jsx
        ├── components/
        │   ├── ContractUploader.jsx
        │   └── StatusBadge.jsx
        └── context/
            ├── AuthContext.jsx
            └── SocketContext.jsx
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free)
- An [Upstash](https://upstash.com) Redis database (free)
- An [Ollama Cloud](https://ollama.com) API key
- A [Resend](https://resend.com) account (free)

### 1. Clone and install

```bash
git clone https://github.com/yourusername/contractpulse.git
cd contractpulse/backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
# Supabase PostgreSQL
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Storage
SUPABASE_URL="https://[ref].supabase.co"
SUPABASE_SERVICE_KEY="your-service-role-key"
SUPABASE_BUCKET="Contracts"

# Upstash Redis
REDIS_URL="rediss://default:[password]@[host].upstash.io:6379"

# Auth
JWT_SECRET="your-long-random-secret"

# Ollama Cloud
OLLAMA_API_KEY="your-ollama-api-key"

# Resend Email
RESEND_API_KEY="re_your-key"
EMAIL_FROM="onboarding@resend.dev"

# App
PORT=8000
APP_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:5173"
```

### 3. Push database schema

```bash
npx prisma db push
```

### 4. Start the server

```bash
npm run dev
```

### 5. Start the frontend

```bash
cd ../frontend
npm install
npm run dev
```

Open `http://localhost:5173` — register your company and upload your first contract.

---

## 📊 Data Model

```
Company ──< User
   │
   └──< Contract ──< Milestone
           │    └──< PenaltyClause
           │
           └──< AuditLog (append-only)
```

Key design decisions:
- **Enums for state** — `processingStatus` and `alertState` are PostgreSQL enums. The DB rejects invalid values at write time
- **Append-only audit log** — rows are never updated or deleted, creating an immutable legal record
- **JSONB for extracted data** — raw LLM output stored as queryable JSON, future-proofing schema changes
- **Multi-tenant isolation** — every query filters by `companyId`, enforced at the application layer

---

## 🔐 Security

- Passwords hashed with bcryptjs (salt rounds: 10)
- JWT tokens expire in 7 days
- Email action links are signed JWTs that expire in 7 days
- All file uploads validated for PDF magic bytes (`%PDF`) before processing
- Company data isolation enforced on every database query
- Service role key never exposed to frontend

---

## 📈 Performance

| Metric | Result |
|---|---|
| Upload endpoint response time | ~200ms (async processing) |
| Synchronous alternative | 8-15 seconds blocked |
| Concurrent uploads handled | 50+ without degradation |
| Worker concurrency | 3 PDFs processed simultaneously |
| Failed job recovery | Automatic retry via Redis persistence |

---

## 🗺 Roadmap

- [ ] LLM fine-tuning on Indian legal contract corpus
- [ ] Milestone recurring task engine
- [ ] Contract comparison (version diff)
- [ ] Slack / Teams integration for alerts
- [ ] Mobile PWA for approvals on the go
- [ ] Analytics dashboard — financial exposure by month

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

---

## 📄 License

MIT © 2024 ContractPulse

---

<div align="center">
  <strong>Built to solve a real problem — one missed deadline at a time.</strong>
</div>
