# TenantAlpha — CRE Tenant ROI Calculator

A professional web application for commercial real estate brokers to compare 2–5 lease options side-by-side with full ROI analysis, AI-powered recommendations (Claude), and exportable PDF reports.

## Features

- **Multi-option comparison** — enter up to 5 lease options with 20+ fields each (rent, escalations, TI allowance, OpEx, free rent, parking, and more)
- **Full calculation engine** — NPV of costs, effective rent/SF, annual cash flows, payback period, revenue as % of rent, cost per employee
- **AI assistant** — streaming executive summary + interactive Q&A chat powered by Anthropic Claude
- **PDF export** — professional client-ready reports with cover page, metrics tables, charts, and AI recommendation
- **Saved leases** — store historical lease data for future reference and reuse in new deals
- **Broker profile** — custom branding (logo, brokerage name) embedded in PDF exports
- **Mobile-first** — fully responsive from 375px upward

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Database | PostgreSQL (Google Cloud SQL) |
| ORM | Prisma v7 + `@prisma/adapter-pg` |
| Auth | Clerk |
| AI | Vercel AI SDK v6 + `@ai-sdk/anthropic` |
| PDF | `@react-pdf/renderer` (server-side) |
| Forms | React Hook Form + Zod |
| File Storage | Google Cloud Storage |
| Hosting | Vercel |

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or Cloud SQL)
- Clerk account
- Anthropic API key

### Setup

```bash
# 1. Clone and install
git clone https://github.com/DrekStyler/TenantAlpha.git
cd TenantAlpha
npm install

# 2. Copy environment variables
cp .env.example .env.local
# Fill in all values in .env.local (see .env.example for reference)

# 3. Run database migrations
npx prisma migrate dev

# 4. (Optional) Seed sample data
npx prisma db seed

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Commands

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run test       # Run 49 unit tests (Vitest)
npx prisma studio  # Browse database
```

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `DATABASE_URL` | PostgreSQL connection string (pooled, for queries) |
| `DIRECT_URL` | PostgreSQL direct connection (for migrations) |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `GCS_BUCKET_NAME` | GCS bucket for logo uploads |
| `GCS_PROJECT_ID` | GCP project ID |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full GCP + Vercel deployment instructions.

## Project Structure

```
src/
├── app/
│   ├── (app)/           # Authenticated routes (dashboard, deals, leases, profile)
│   ├── (auth)/          # Clerk sign-in / sign-up pages
│   └── api/             # API routes (deals, calculate, ai, pdf, leases, profile, upload)
├── components/
│   ├── ui/              # Primitives (Button, Card, Input, Badge, etc.)
│   ├── layout/          # AppShell, Sidebar, MobileNav
│   ├── deals/           # DealCard, DealSetupForm
│   ├── options/         # OptionTabs, OptionForm
│   ├── results/         # ResultsDashboard, charts, tables
│   ├── ai/              # AISummary, AIChatWindow
│   └── pdf/             # PDFDocument and section components
├── engine/              # Pure calculation functions (zero framework deps)
├── hooks/               # usePDFExport
├── lib/                 # prisma, ai, formatters, api helpers
└── schemas/             # Zod validation schemas
```

## License

Private — all rights reserved.
