# TenantAlpha — Deployment Guide

This guide covers the full production deployment to **Vercel** (compute) + **Google Cloud SQL** (database) + **Google Cloud Storage** (file storage) + **Clerk** (auth) + **Anthropic** (AI).

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Google Cloud SQL — PostgreSQL](#2-google-cloud-sql--postgresql)
3. [Google Cloud Storage — Logo Uploads](#3-google-cloud-storage--logo-uploads)
4. [Clerk Authentication](#4-clerk-authentication)
5. [Anthropic API](#5-anthropic-api)
6. [Prisma Migrations](#6-prisma-migrations)
7. [Vercel Deployment](#7-vercel-deployment)
8. [Post-Deployment Verification](#8-post-deployment-verification)
9. [Environment Variables Reference](#9-environment-variables-reference)
10. [Ongoing Operations](#10-ongoing-operations)

---

## 1. Prerequisites

- [Google Cloud CLI (`gcloud`)](https://cloud.google.com/sdk/docs/install) installed and authenticated
- A GCP project created (note your **Project ID**)
- A [Vercel](https://vercel.com) account with the GitHub integration enabled
- A [Clerk](https://clerk.com) account
- An [Anthropic](https://console.anthropic.com) account with API access

---

## 2. Google Cloud SQL — PostgreSQL

### 2a. Enable APIs

```bash
gcloud services enable sqladmin.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
```

### 2b. Create a Cloud SQL Instance

```bash
gcloud sql instances create tenantalpha-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=10GB \
  --backup-start-time=03:00
```

> **Note:** `db-f1-micro` is the smallest (cheapest) tier — sufficient for early production. Upgrade to `db-g1-small` or higher when traffic grows.

### 2c. Create the Database and User

```bash
# Create database
gcloud sql databases create tenantalpha \
  --instance=tenantalpha-db

# Create a strong password (save it — you'll need it)
gcloud sql users create tenantalpha_user \
  --instance=tenantalpha-db \
  --password=YOUR_STRONG_PASSWORD_HERE
```

### 2d. Get the Connection Details

```bash
# Get the public IP address
gcloud sql instances describe tenantalpha-db \
  --format="value(ipAddresses[0].ipAddress)"
```

Your `DATABASE_URL` and `DIRECT_URL` will be:

```
postgresql://tenantalpha_user:YOUR_STRONG_PASSWORD@PUBLIC_IP:5432/tenantalpha?sslmode=require
```

> **Important:** Both `DATABASE_URL` and `DIRECT_URL` should point to the same Cloud SQL public IP for Vercel deployments. Prisma uses `DIRECT_URL` for migrations and `DATABASE_URL` for queries.

### 2e. Authorize Vercel IP Ranges

Cloud SQL restricts connections by IP. Since Vercel uses dynamic IPs, the simplest option for serverless is to authorize Vercel's outbound IP ranges **or** use Cloud SQL Auth Proxy / Connector.

**Option A — Authorize all IPs (simplest, acceptable for most SaaS apps):**

```bash
gcloud sql instances patch tenantalpha-db \
  --authorized-networks=0.0.0.0/0
```

> Add a note in your security review. For PII-sensitive deployments, use Cloud SQL Auth Proxy instead.

**Option B — Cloud SQL Connector (recommended for compliance):**

1. Install the connector: `pip install cloud-sql-python-connector`
2. Create a service account with `Cloud SQL Client` role
3. Use the connector URL format:
   ```
   postgresql+asyncpg://tenantalpha_user:PASSWORD@/tenantalpha?host=/cloudsql/PROJECT:REGION:tenantalpha-db
   ```

---

## 3. Google Cloud Storage — Logo Uploads

### 3a. Enable the API

```bash
gcloud services enable storage.googleapis.com
```

### 3b. Create the Bucket

```bash
gsutil mb -l US -b on gs://tenantalpha-uploads
```

### 3c. Create a Service Account

```bash
# Create the service account
gcloud iam service-accounts create tenantalpha-storage \
  --display-name="TenantAlpha Storage"

# Grant Storage Object Admin role
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:tenantalpha-storage@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Create and download a JSON key
gcloud iam service-accounts keys create ./gcs-key.json \
  --iam-account=tenantalpha-storage@tenent-alpha.iam.gserviceaccount.com
```

> **Keep `gcs-key.json` secret** — never commit it. Add it to `.gitignore` if needed. You'll paste the contents into a Vercel environment variable.

### 3d. Set CORS Policy for Direct Uploads

Create `cors.json`:

```json
[
  {
    "origin": ["https://your-vercel-domain.vercel.app", "http://localhost:3000"],
    "method": ["GET", "PUT", "POST"],
    "responseHeader": ["Content-Type", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
```

Apply it:

```bash
gsutil cors set cors.json gs://tenantalpha-uploads
```

### 3e. Set Bucket to Publicly Readable (for logo display in PDFs)

```bash
gsutil iam ch allUsers:objectViewer gs://tenantalpha-uploads
```

> Logos are non-sensitive branding images. If you prefer private storage, adjust the upload route to generate signed URLs instead.

### 3f. Add Service Account Key to Vercel

In your Vercel project settings → Environment Variables, add:

- `GCS_BUCKET_NAME` = `tenantalpha-uploads`
- `GCS_PROJECT_ID` = your GCP project ID
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` = the full contents of `gcs-key.json` (as a JSON string)

Then update `src/app/api/upload/logo/route.ts` to parse the credentials from the env var:

```typescript
const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!);
const storage = new Storage({ credentials, projectId: process.env.GCS_PROJECT_ID });
```

> Vercel doesn't support file-path credentials — the JSON key must be inlined as an env var.

---

## 4. Clerk Authentication

### 4a. Create a Clerk Application

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) → **Add application**
2. Name it **TenantAlpha**, choose **Email + Google** (or your preferred providers)
3. Copy your keys from the **API Keys** section

### 4b. Configure Redirect URLs

In Clerk Dashboard → **Paths**:

| Setting | Value |
|---------|-------|
| Sign-in URL | `/sign-in` |
| Sign-up URL | `/sign-up` |
| After sign-in URL | `/dashboard` |
| After sign-up URL | `/dashboard` |

### 4c. Add Allowed Origins

In Clerk Dashboard → **Domains**, add:
- `https://your-vercel-domain.vercel.app`
- Your custom domain (if applicable)

---

## 5. Anthropic API

1. Go to [console.anthropic.com](https://console.anthropic.com) → **API Keys**
2. Create a new key named `tenantalpha-production`
3. Set usage limits to avoid runaway costs (recommended: $50/month cap to start)
4. Copy the key — it starts with `sk-ant-...`

---

## 6. Prisma — Initial Schema Push

Since no migration history exists yet, use `prisma db push` for the **first deployment** to create all tables directly from the schema:

```bash
# From your local machine with DATABASE_URL pointing to Cloud SQL
export DIRECT_URL="postgresql://tenantalpha_user:PASSWORD@PUBLIC_IP:5432/tenantalpha?sslmode=require"
export DATABASE_URL="$DIRECT_URL"

cd ~/Desktop/projects/tenant-alpha
npx prisma db push
```

> `prisma db push` is the correct command for the initial setup — it syncs the schema to the database without requiring migration files.

### Future schema changes

After the initial push, use migrations for all subsequent schema changes so changes are tracked and reproducible:

```bash
# 1. Make changes to prisma/schema.prisma, then create a migration locally
npx prisma migrate dev --name describe_your_change

# 2. Deploy that migration to production Cloud SQL
export DATABASE_URL="postgresql://tenantalpha_user:PASSWORD@PUBLIC_IP:5432/tenantalpha?sslmode=require"
npx prisma migrate deploy
```

### Seed sample data (optional)

```bash
npx prisma db seed
```

### Add `postinstall` to `package.json`

Vercel needs to run `prisma generate` during the build step:

```json
"scripts": {
  "postinstall": "prisma generate"
}
```

This is already included in the project's `package.json`.

---

## 7. Vercel Deployment

### 7a. Connect GitHub Repo

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the `DrekStyler/TenantAlpha` GitHub repository
3. Framework preset: **Next.js** (auto-detected)

### 7b. Set Environment Variables

In **Project Settings → Environment Variables**, add all variables for **Production**, **Preview**, and **Development**:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY    pk_live_...
CLERK_SECRET_KEY                     sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL        /sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL        /sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL  /dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL  /dashboard

DATABASE_URL                         postgresql://...?sslmode=require
DIRECT_URL                           postgresql://...?sslmode=require

ANTHROPIC_API_KEY                    sk-ant-...

GCS_BUCKET_NAME                      tenantalpha-uploads
GCS_PROJECT_ID                       your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS_JSON  {"type":"service_account",...}
```

### 7c. Deploy

Click **Deploy**. Vercel will:
1. Run `npm install`
2. Run `prisma generate` (via `postinstall`)
3. Run `next build`
4. Deploy to its global edge network

Your app will be live at `https://tenant-alpha.vercel.app` (or your custom domain).

### 7d. Custom Domain (optional)

In **Project Settings → Domains**, add your domain (e.g., `tenantalpha.io`) and follow Vercel's DNS configuration instructions.

---

## 8. Post-Deployment Verification

Work through this checklist after each deployment:

- [ ] **Auth** — Visit `/sign-up`, create a test account, confirm redirect to `/dashboard`
- [ ] **Create deal** — Click "New Deal", fill in deal info and 2+ options, save
- [ ] **Calculate** — Navigate to deal → click "Calculate" — verify metrics table and charts render
- [ ] **AI summary** — On results page, confirm AI executive summary auto-generates
- [ ] **AI chat** — Ask a question in the chat window, verify streaming response
- [ ] **PDF export** — Click "Export PDF", verify download with all sections and charts
- [ ] **Saved leases** — Create and delete a saved lease at `/leases`
- [ ] **Profile** — Upload a logo at `/profile`, verify it appears in the next PDF export
- [ ] **Mobile** — Test full flow on a 375px viewport (Chrome DevTools or a real phone)

---

## 9. Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk client-side key (`pk_live_...`) |
| `CLERK_SECRET_KEY` | ✅ | Clerk server-side key (`sk_live_...`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | ✅ | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | ✅ | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | ✅ | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | ✅ | `/dashboard` |
| `DATABASE_URL` | ✅ | Pooled PostgreSQL URL (queries) |
| `DIRECT_URL` | ✅ | Direct PostgreSQL URL (migrations) |
| `ANTHROPIC_API_KEY` | ✅ | Anthropic Claude API key |
| `GCS_BUCKET_NAME` | ✅ | GCS bucket name for logo uploads |
| `GCS_PROJECT_ID` | ✅ | GCP project ID |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | ✅ | Service account JSON (inlined) |

---

## 10. Ongoing Operations

### Database Backups

Cloud SQL automatic backups are enabled (set to 3:00 AM). To take a manual backup:

```bash
gcloud sql backups create --instance=tenantalpha-db
```

### Running New Migrations

After adding new Prisma migrations:

```bash
# Apply to production (do NOT use migrate dev)
DATABASE_URL="..." DIRECT_URL="..." npx prisma migrate deploy
```

Vercel re-deploys will NOT auto-run migrations — always run them manually before deploying schema changes.

### Monitoring

- **Vercel** — Function logs available at `vercel.com/your-org/tenantalpha/logs`
- **Cloud SQL** — Query insights and slow query logs available in the GCP Console
- **Anthropic** — Usage dashboard at `console.anthropic.com`
- **Clerk** — User management and auth events at `dashboard.clerk.com`

### Scaling

| Concern | Action |
|---------|--------|
| DB connection limits | Add Cloud SQL connection pooler (PgBouncer via Cloud SQL Proxy) |
| Cold starts | Upgrade Vercel plan to enable Fluid Compute or add keepalive pings |
| PDF generation timeout | Increase Vercel function max duration in `vercel.json` (default 10s) |
| AI rate limits | Add request queuing or upgrade Anthropic tier |

### Adding a `vercel.json` for Function Timeout

If PDF generation exceeds the default 10-second limit, add:

```json
{
  "functions": {
    "src/app/api/pdf/route.ts": {
      "maxDuration": 30
    }
  }
}
```
