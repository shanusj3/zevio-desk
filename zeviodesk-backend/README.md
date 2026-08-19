# Modular Node.js Express Server Setup

An enterprise-ready, modular Node.js & TypeScript Express server with Prisma ORM setup, JWT multi-tenant authentication, custom validation middlewares, and domain modules for Tenants, Users, Tickets, Customers, and WhatsApp integration.

## 📁 Folder Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Prisma database schema definition
│   ├── migrations/         # Migration histories
│   └── seed.ts             # Database seed runner
├── src/
│   ├── app.ts              # Express application factory & middleware pipeline
│   ├── server.ts           # Server entry point & Vite dev middleware mount
│   ├── config/             # Config files (env, prisma, logger, constants)
│   ├── modules/            # Feature modules (auth, user, tenant, ticket, customer, whatsapp)
│   ├── middlewares/        # Express middlewares (auth, error, upload, rateLimit, validation)
│   ├── services/           # External & core services (jwt, bcrypt, email, whatsapp, s3, redis)
│   ├── utils/              # Helper utilities (response, pagination, OTP, slug, date)
│   ├── lib/                # Shared clients (axios, cache, queue)
│   ├── interfaces/         # TypeScript request/response contracts
│   ├── types/              # Ambient ambient declarations
│   ├── routes/             # Global API router aggregator
│   ├── validators/         # Common schemas
│   └── jobs/               # Background cron jobs (reminder, cleanup)
├── tests/                  # Unit and integration test suites
└── README.md
```

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Build & Production Start
```bash
npm run build
npm start
```
