# TOLLGATE

**EU-Sovereign Subscription Billing**

> *Your billing infrastructure shouldn't need a transatlantic cable.*

TOLLGATE is a multi-tenant subscription billing platform built for European businesses that are tired of routing their financial data through US jurisdiction. It handles the full subscription lifecycle — creation, upgrades, downgrades, pausing, cancellation — plus automated invoicing with per-country EU VAT, usage metering, webhook delivery, and MRR analytics. All data stays in Europe. No exceptions.

**Live:** [tollgate-deploy.vercel.app](https://tollgate-deploy.vercel.app)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Dashboard](#dashboard)
- [Database Schema](#database-schema)
- [Security](#security)
- [EU Sovereignty](#eu-sovereignty)
- [EUROSTACK](#eurostack)
- [License](#license)

---

## Overview

Stripe Billing, Chargebee, Recurly — they all work great, until you read the fine print about where your customer payment data actually lives and who can subpoena it.

TOLLGATE is the European answer. A subscription billing platform that runs on EU infrastructure, stores data in EU regions, and is built from the ground up with GDPR compliance as a first-class feature rather than an afterthought checkbox.

Three billing models. Full lifecycle management. Automated EU VAT. Usage metering. Webhook delivery with cryptographic signatures. MRR analytics. GDPR data export and erasure. All wrapped in a dashboard that looks like it was forged in the depths of the Wired.

---

## Features

### Billing Models
- **Flat-rate** — Fixed monthly/annual pricing
- **Usage-based** — Metered billing with per-unit pricing
- **Tiered (graduated)** — Volume pricing with graduated tiers

### Subscription Lifecycle
- Create, activate, pause, resume, cancel
- Plan upgrades and downgrades with proration
- Automatic renewal and expiration handling

### Invoicing
- Automated invoice generation from active subscriptions
- Per-country EU VAT calculation (DE 19%, FR 20%, NL 21%, AT 20%, BE 21%, ES 21%, IT 22%, etc.)
- Invoice line items with full breakdown
- Invoice status tracking (draft → issued → paid → void)

### Usage Metering
- Record and aggregate usage events per subscription
- Usage reporting endpoints for billing period calculations
- Dashboard visualization of usage trends

### Webhooks
- Register webhook endpoints per tenant
- Event delivery for subscription/invoice lifecycle events
- HMAC-SHA256 signature verification on every payload
- Delivery tracking and event history

### Analytics
- MRR overview with trend data
- Revenue breakdown by plan
- Churn tracking
- Customer growth metrics

### GDPR Compliance
- **Article 20** — Full data export (JSON) for any customer
- **Article 17** — Right to erasure with complete data deletion
- Audit logging for all compliance operations
- EU data sovereignty attestation endpoint

### Multi-Tenant Architecture
- Complete tenant isolation at the database level
- Per-tenant API key authentication
- Super admin panel with cross-tenant visibility
- Tenant settings and configuration management

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit 5 (TypeScript) |
| Database | PostgreSQL via `postgres.js` |
| Hosting | Supabase (EU-West-1) |
| Deployment | Vercel |
| Auth | bcrypt + secure session cookies |
| Styling | Custom CSS — gold on black, CRT scanlines, JetBrains Mono |

### The Wired Aesthetic

TOLLGATE follows **The Wired** design language: gold (`#ffd700`) on true black, CRT scanline overlays, phosphor glow effects, monospace typography (JetBrains Mono), and a cyberpunk terminal atmosphere. This isn't a Bootstrap dark theme — it's an interface that feels like you're jacked into something real.

---

## Quick Start

### Prerequisites

- Node.js 18+
- A PostgreSQL database (Supabase recommended, EU region)

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Session
SESSION_SECRET=your-64-char-random-hex-string

# App
PUBLIC_APP_URL=http://localhost:5173

# Webhooks (for HMAC signing)
WEBHOOK_SECRET=your-webhook-signing-secret
```

### Install & Run

```sh
# Install dependencies
npm install

# Run database migrations (applies all tollgate_ prefixed tables)
# See Database Schema section for the 13-table structure

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173`.

### First Steps

1. Navigate to `/auth/register` and create your tenant account
2. You'll land on the dashboard overview at `/dashboard`
3. Create your first plan under `/dashboard/plans`
4. Add customers, create subscriptions, generate invoices
5. Configure webhooks for event delivery
6. Check analytics for MRR tracking

---

## API Reference

All API endpoints are under `/api/v1/`. Authentication is required for all endpoints except register and login.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register a new tenant + admin user |
| `POST` | `/api/v1/auth/login` | Login, returns session cookie |
| `POST` | `/api/v1/auth/logout` | Destroy session |
| `GET` | `/api/v1/auth/me` | Get current authenticated user |

### Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/customers` | List all customers for tenant |
| `POST` | `/api/v1/customers` | Create a new customer |
| `GET` | `/api/v1/customers/:id` | Get customer details |
| `PATCH` | `/api/v1/customers/:id` | Update customer |
| `DELETE` | `/api/v1/customers/:id` | Delete customer |

### Plans

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/plans` | List all plans |
| `POST` | `/api/v1/plans` | Create a plan (flat-rate, usage-based, or tiered) |
| `GET` | `/api/v1/plans/:id` | Get plan details with tiers |
| `PATCH` | `/api/v1/plans/:id` | Update plan |
| `DELETE` | `/api/v1/plans/:id` | Archive plan |

### Subscriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/subscriptions` | List subscriptions |
| `POST` | `/api/v1/subscriptions` | Create a subscription |
| `GET` | `/api/v1/subscriptions/:id` | Get subscription details |
| `PATCH` | `/api/v1/subscriptions/:id` | Update (pause, resume, cancel, change plan) |
| `DELETE` | `/api/v1/subscriptions/:id` | Cancel subscription |

### Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/invoices` | List invoices |
| `POST` | `/api/v1/invoices/generate` | Generate invoices for active subscriptions |
| `GET` | `/api/v1/invoices/:id` | Get invoice with line items |
| `PATCH` | `/api/v1/invoices/:id` | Update invoice status |

### Usage

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/usage` | Get usage records for a subscription |
| `POST` | `/api/v1/usage` | Record a usage event |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/webhooks` | List registered webhooks |
| `POST` | `/api/v1/webhooks` | Register a webhook endpoint |
| `GET` | `/api/v1/webhooks/:id` | Get webhook details |
| `DELETE` | `/api/v1/webhooks/:id` | Remove a webhook |
| `GET` | `/api/v1/webhooks/events` | List webhook delivery events |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/analytics/overview` | MRR, churn rate, revenue trend, customer count |
| `GET` | `/api/v1/analytics/mrr` | MRR breakdown by plan |

### Compliance

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/compliance/gdpr/export` | Export all data for a customer (Art. 20) |
| `POST` | `/api/v1/compliance/gdpr/delete` | Erase all data for a customer (Art. 17) |
| `GET` | `/api/v1/sovereignty` | EU data sovereignty attestation |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/admin/overview` | Cross-tenant overview (super admin only) |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/settings` | Get tenant settings |
| `PATCH` | `/api/v1/settings` | Update tenant settings |

---

## Dashboard

TOLLGATE ships with a full management dashboard — 10 pages covering every aspect of the platform.

| Page | Path | Description |
|------|------|-------------|
| Landing | `/` | Public landing page |
| Login | `/auth/login` | Tenant authentication |
| Register | `/auth/register` | New tenant registration |
| Overview | `/dashboard` | MRR, active subs, revenue charts |
| Customers | `/dashboard/customers` | Customer management |
| Plans | `/dashboard/plans` | Plan creation and configuration |
| Subscriptions | `/dashboard/subscriptions` | Subscription lifecycle management |
| Invoices | `/dashboard/invoices` | Invoice generation and tracking |
| Usage | `/dashboard/usage` | Usage metering and reports |
| Webhooks | `/dashboard/webhooks` | Webhook endpoint management |
| Settings | `/dashboard/settings` | Tenant config, API keys, GDPR tools |
| Admin | `/dashboard/admin` | Super admin cross-tenant panel |

---

## Database Schema

13 tables, all prefixed with `tollgate_` for clean namespace isolation:

```
tollgate_tenants          — Multi-tenant root table
tollgate_users            — Tenant users with bcrypt passwords
tollgate_sessions         — Server-side session storage
tollgate_api_keys         — API key auth (SHA-256 hashed)
tollgate_customers        — Tenant customers with EU country/VAT
tollgate_plans            — Billing plans (flat, usage, tiered)
tollgate_plan_tiers       — Graduated pricing tiers per plan
tollgate_subscriptions    — Subscription state machine
tollgate_invoices         — Generated invoices with VAT
tollgate_invoice_items    — Invoice line items
tollgate_usage_records    — Usage metering events
tollgate_webhooks         — Registered webhook endpoints
tollgate_webhook_events   — Webhook delivery log
tollgate_audit_log        — Compliance audit trail
```

All tables enforce tenant isolation. Every query is filtered by `tenant_id`. There is no way to accidentally leak data across tenants.

---

## Security

TOLLGATE takes security seriously. This is financial infrastructure — "good enough" doesn't cut it.

- **Password hashing** — bcrypt with 12 rounds. No MD5, no SHA-1, no shortcuts.
- **Session management** — Secure, httpOnly, sameSite cookies. No JWT-in-localStorage nonsense.
- **Brute force protection** — 5 login attempts per 15 minutes per IP. Lockout with exponential backoff.
- **Multi-tenant isolation** — Every database query is scoped to `tenant_id`. Row-level enforcement, not application-level hope.
- **SQL injection prevention** — All queries use parameterized statements via `postgres.js`. No string concatenation. Ever.
- **API key security** — Keys are SHA-256 hashed before storage. The plaintext is shown once at creation and never again.
- **Webhook signatures** — Every webhook payload is signed with HMAC-SHA256. Verify the signature or don't trust the payload.
- **No external tracking** — No Google Analytics, no Mixpanel, no third-party scripts phoning home.

---

## EU Sovereignty

This is not a checkbox feature. This is the reason TOLLGATE exists.

### Data Residency
- All data stored in **EU-West-1** (Frankfurt/Ireland)
- PostgreSQL hosted on Supabase EU infrastructure
- No replication to US regions
- No US-headquartered subprocessors with data access

### GDPR Compliance
- **Article 17 (Right to Erasure)** — One API call deletes all customer data. Subscriptions, invoices, usage records — everything. Gone. Logged in the audit trail for compliance proof.
- **Article 20 (Data Portability)** — Full JSON export of all customer data in a machine-readable format. No "we'll email you a CSV in 30 days."

### Sovereignty Attestation
The `/api/v1/sovereignty` endpoint returns a signed attestation confirming:
- Data storage region
- Infrastructure providers and their jurisdictions
- Compliance certifications
- Last audit timestamp

### Audit Logging
Every compliance-relevant operation is logged with timestamp, actor, action, and affected entity. The audit log is immutable and retained per EU regulatory requirements.

---

## EUROSTACK

TOLLGATE is **Product #7** in the EUROSTACK initiative — a suite of 10 EU-sovereign infrastructure products designed to replace US SaaS dependencies for European businesses.

The premise is simple: European companies shouldn't need to send their data to Virginia to run a business. Every EUROSTACK product stores data exclusively in the EU, complies with GDPR by design, and is built as a genuine alternative to the American incumbents.

TOLLGATE replaces: **Stripe Billing, Chargebee, Recurly**

The full EUROSTACK lineup covers the core infrastructure stack that every SaaS business needs — from authentication to billing to analytics to deployment — all without crossing the Atlantic.

---

## License

**AGPL-3.0**

If you use TOLLGATE, you share your improvements. That's the deal. Commercial licensing available for businesses that need it.

See [LICENSE](LICENSE) for the full text.

---

*TOLLGATE — Because your billing data is none of America's business.*
