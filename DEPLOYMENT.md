# SEO Factory - Railway Deployment Guide

This guide covers deploying SEO Factory to Railway with PostgreSQL and Redis.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Railway Platform                                │
│                                                                             │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐           │
│  │   Next.js App   │   │   PostgreSQL    │   │     Redis       │           │
│  │   (Container)   │◄──│   (Database)    │   │   (Queue/Cache) │           │
│  └────────┬────────┘   └─────────────────┘   └─────────────────┘           │
│           │                                                                 │
└───────────┼─────────────────────────────────────────────────────────────────┘
            │
    ┌───────▼───────┐
    │    Users      │
    └───────────────┘

External Services:
- Clerk (Authentication)
- Resend (Email)
- Vercel Blob (File Storage)
- Stripe (Payments)
- Claude API (AI Content)
```

## Prerequisites

Before deploying, ensure you have:

1. **Railway Account** - [Sign up](https://railway.app)
2. **Clerk Account** - [Sign up](https://clerk.dev)
3. **Resend Account** - [Sign up](https://resend.com)
4. **Stripe Account** - [Sign up](https://stripe.com)
5. **Anthropic API Key** - [Get API Key](https://console.anthropic.com)
6. **Node.js** (v20+) - For local development

## Local Development

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/seo-factory.git
cd seo-factory

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Fill in your environment variables
# (See Environment Variables section below)

# Start PostgreSQL and Redis with Docker
docker-compose up -d db redis

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Docker Compose (Full Stack)

```bash
# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec app npx prisma migrate deploy

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Railway Deployment

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and create a new project
2. Choose "Empty Project"

### Step 2: Add PostgreSQL

1. Click "Add Service" → "Database" → "PostgreSQL"
2. Railway will automatically provision a PostgreSQL instance
3. Copy the `DATABASE_URL` from the service variables

### Step 3: Add Redis

1. Click "Add Service" → "Database" → "Redis"
2. Railway will automatically provision a Redis instance
3. Copy the `REDIS_URL` from the service variables

### Step 4: Deploy the Application

**Option A: Deploy from GitHub**
1. Click "Add Service" → "GitHub Repo"
2. Select your repository
3. Railway will automatically detect Next.js and set up the build

**Option B: Deploy using Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Deploy
railway up
```

### Step 5: Configure Environment Variables

In your Railway project, add these environment variables:

```bash
# Database (auto-populated by Railway)
DATABASE_URL=

# Redis (auto-populated by Railway)
REDIS_URL=

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.railway.app

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/signin
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Resend Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Claude AI
CLAUDE_API_KEY=sk-ant-...

# File Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# Admin
ADMIN_EMAILS=admin@yourdomain.com
```

### Step 6: Run Database Migrations

```bash
# Using Railway CLI
railway run npx prisma migrate deploy

# Or via Railway dashboard shell
npx prisma migrate deploy
```

### Step 7: Set Up Custom Domain (Optional)

1. Go to your Railway service settings
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### Step 8: Configure Webhooks

**Stripe Webhook:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-app.railway.app/api/webhooks/stripe`
3. Select events: `invoice.payment_failed`, `customer.subscription.*`
4. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

**Clerk Webhook (optional):**
1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-app.railway.app/api/webhooks/clerk`
3. Select events: `user.created`, `user.deleted`

## GitHub Actions CI/CD

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npx tsc --noEmit

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy to Railway
        run: railway up --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

Add `RAILWAY_TOKEN` to your GitHub repository secrets.

## Rollback Procedure

### Quick Rollback

1. Go to Railway Dashboard
2. Select your service
3. Click "Deployments"
4. Find the previous working deployment
5. Click "Rollback"

### Database Rollback

```bash
# Connect to Railway shell
railway run bash

# View migration history
npx prisma migrate status

# If needed, manually rollback (be careful!)
npx prisma migrate resolve --rolled-back <migration_name>
```

## Monitoring

### Railway Metrics

Railway provides built-in monitoring:
- CPU/Memory usage
- Request count
- Response times
- Error rates

Access via: Railway Dashboard → Your Service → Metrics

### Logs

```bash
# View logs via CLI
railway logs

# Or use the dashboard
# Railway Dashboard → Your Service → Logs
```

### Health Check

The app exposes `/api/health` for health monitoring:

```bash
curl https://your-app.railway.app/api/health
```

## Scaling

Railway automatically scales based on usage. To configure:

1. Go to Railway Dashboard → Your Service → Settings
2. Adjust:
   - **Memory**: 512MB - 8GB
   - **vCPU**: 0.5 - 8 cores
   - **Replicas**: 1 - 10 instances

## Cost Estimate

Railway pricing (usage-based):

| Resource | Configuration | Est. Cost |
|----------|---------------|-----------|
| App Container | 1GB RAM, 1 vCPU | ~$10-20/month |
| PostgreSQL | 1GB RAM | ~$10/month |
| Redis | 256MB | ~$5/month |
| **Total** | | **~$25-35/month** |

External services:
- Clerk: Free tier (10,000 MAU)
- Resend: Free tier (3,000 emails/month)
- Vercel Blob: ~$0.15/GB stored
- Stripe: 2.9% + $0.30 per transaction

## Troubleshooting

### Build Failures

```bash
# Check build logs
railway logs --build

# Common issues:
# - Missing environment variables
# - Node version mismatch (ensure engines in package.json)
# - Prisma schema out of sync
```

### Database Connection Issues

```bash
# Test connection
railway run npx prisma db execute --stdin <<< "SELECT 1"

# Check DATABASE_URL is set correctly
railway variables
```

### Application Errors

```bash
# View runtime logs
railway logs

# Filter for errors
railway logs | grep -i error
```

## Security Best Practices

1. **Environment Variables**: Never commit secrets to git
2. **Database**: Railway PostgreSQL is private by default
3. **HTTPS**: Railway provides automatic SSL
4. **Authentication**: Clerk handles security best practices
5. **Webhooks**: Verify webhook signatures

## Service Comparison

| Feature | Railway | AWS |
|---------|---------|-----|
| Setup Time | ~10 minutes | ~2 hours |
| Maintenance | Managed | You manage |
| Cost (small) | ~$30/month | ~$150/month |
| Scaling | Automatic | Manual/Auto |
| Complexity | Low | High |

## Support

- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Clerk Docs](https://clerk.dev/docs)
- [Resend Docs](https://resend.com/docs)
