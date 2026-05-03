# Flowra — Environment Variables Reference

## Overview

This document lists all environment variables required for Flowra deployment on Vercel or other platforms.

---

## Core App & Infrastructure

### Required for core functionality:

**`DATABASE_URL`**
- **Type**: Server-only secret
- **Required**: Yes (production & development)
- **Description**: PostgreSQL connection string for Replit PostgreSQL or any Postgres database
- **Format**: `postgresql://user:password@host:port/database`
- **Where to get it**: Replit Database, Neon, Supabase, or local Postgres instance

**`PORT`**
- **Type**: Server environment variable
- **Required**: Yes (in Replit, auto-set by workflows)
- **Description**: Port number for the frontend dev server
- **Default on Vercel**: Not applicable (serverless)
- **Note**: Replit workflows set this automatically via `artifact.toml`

**`BASE_PATH`**
- **Type**: Server environment variable
- **Required**: Yes (in Replit, auto-set by workflows)
- **Description**: Base URL path for the frontend (e.g., `/`, `/app`)
- **Default on Vercel**: `/`
- **Note**: Replit workflows set this automatically via `artifact.toml`

**`NODE_ENV`**
- **Type**: Standard environment variable
- **Required**: No (defaults to `production` on Vercel)
- **Description**: Runtime environment
- **Allowed values**: `development`, `production`

---

## Authentication & Security

### JWT & Sessions:

**`SESSION_SECRET`** (or `NEXTAUTH_SECRET`)
- **Type**: Server-only secret
- **Required**: Yes (production & development)
- **Description**: Secret key for signing JWT tokens
- **Length**: Minimum 32 characters (use a secure random string)
- **Priority**: `NEXTAUTH_SECRET` checked first, falls back to `SESSION_SECRET`
- **How to generate**: `openssl rand -base64 32`

### Google OAuth (optional but recommended for auth):

**`GOOGLE_CLIENT_ID`**
- **Type**: Public variable (safe to expose)
- **Required**: No (optional)
- **Description**: Google OAuth 2.0 Client ID for Google login
- **Where to get it**: [Google Cloud Console](https://console.cloud.google.com/)
- **Scope**: Email login required

**`GOOGLE_CLIENT_SECRET`**
- **Type**: Server-only secret
- **Required**: No (optional, paired with `GOOGLE_CLIENT_ID`)
- **Description**: Google OAuth 2.0 Client Secret
- **Note**: Never expose this to the browser

---

## AI & Content Generation

### Anthropic Claude (required for core AI features):

**`ANTHROPIC_API_KEY`**
- **Type**: Server-only secret
- **Required**: Yes (production & development)
- **Description**: API key for Anthropic Claude AI
- **Used for**: Contract extraction, sentiment analysis, performance reports
- **Model**: `claude-sonnet-4-20250514` (configured in `api-server/src/routes/`)
- **Where to get it**: [Anthropic Console](https://console.anthropic.com/)
- **Cost**: Pay-as-you-go; ~$3 per 1M input tokens

---

## Payments & Invoicing

### Paystack (optional - gracefully disabled if not configured):

**`PAYSTACK_SECRET_KEY`**
- **Type**: Server-only secret
- **Required**: No (optional; enables invoice creation and subscription payments)
- **Description**: Paystack secret key for server-side API calls
- **Where to get it**: [Paystack Dashboard](https://dashboard.paystack.com/) → Settings → API Keys & Webhooks
- **Note**: Used for creating payment requests, initializing transactions, and verifying webhooks via HMAC SHA512

**`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`**
- **Type**: Public variable (safe to expose)
- **Required**: No (optional; needed for frontend Paystack SDK if used)
- **Description**: Paystack publishable key for client-side integration
- **Where to get it**: Paystack Dashboard → Settings → API Keys & Webhooks

**`PAYSTACK_PRO_PLAN_CODE`**
- **Type**: Standard environment variable
- **Required**: No (optional)
- **Description**: Paystack plan code for recurring Pro subscription tier
- **Where to get it**: Paystack Dashboard → Products → Plans
- **Note**: If set, transactions are tied to a plan for automatic subscription management

---

## Email & Communications

### Resend Email Service (optional):

**`RESEND_API_KEY`**
- **Type**: Server-only secret
- **Required**: No (optional)
- **Description**: API key for Resend email service
- **Used for**: Sending deadline reminders and notifications
- **Where to get it**: [Resend Dashboard](https://resend.com/)

**`FROM_EMAIL`**
- **Type**: Standard environment variable
- **Required**: No (optional; needed if using Resend)
- **Description**: Sender email address for automated emails
- **Format**: `noreply@example.com`
- **Note**: Must be verified in Resend dashboard

---

## Integrations & Third-Party APIs

### TikTok OAuth (optional):

**`TIKTOK_CLIENT_KEY`**
- **Type**: Server-only secret
- **Required**: No (optional)
- **Description**: TikTok OAuth client ID
- **Used for**: Connecting TikTok accounts for compliance checking
- **Where to get it**: [TikTok Developers](https://developer.tiktok.com/)
- **Note**: Requires TikTok developer approval

**`TIKTOK_CLIENT_SECRET`**
- **Type**: Server-only secret
- **Required**: No (optional; paired with `TIKTOK_CLIENT_KEY`)
- **Description**: TikTok OAuth client secret
- **Note**: Never expose to browser

### YouTube API (optional):

**`YOUTUBE_CLIENT_ID`**
- **Type**: Server-only secret
- **Required**: No (optional)
- **Description**: YouTube OAuth client ID
- **Used for**: Connecting YouTube channels for compliance checking
- **Where to get it**: [Google Cloud Console](https://console.cloud.google.com/)

**`YOUTUBE_CLIENT_SECRET`**
- **Type**: Server-only secret
- **Required**: No (optional; paired with `YOUTUBE_CLIENT_ID`)
- **Description**: YouTube OAuth client secret

### Notion API (optional):

**`NOTION_API_KEY`**
- **Type**: Server-only secret
- **Required**: No (optional)
- **Description**: Notion API integration key
- **Used for**: Exporting contracts and reports to Notion workspaces
- **Where to get it**: [Notion Integrations](https://www.notion.so/my-integrations)

---

## Cron Jobs & Internal Operations

### Scheduled Tasks:

**`CRON_SECRET`**
- **Type**: Server-only secret
- **Required**: No (optional; needed if using scheduled jobs)
- **Description**: Secret token for securing internal cron job endpoints
- **Used for**: Validating requests from task schedulers

---

## Infrastructure & Hosting

### Replit-Specific:

**`REPLIT_DEV_DOMAIN`** (auto-set by Replit)
- **Type**: Auto-populated
- **Required**: No
- **Description**: Development domain for Replit preview
- **Example**: `repl-name.id.repl.dev`

**`REPL_ID`** (auto-set by Replit)
- **Type**: Auto-populated
- **Required**: No
- **Description**: Replit workspace identifier

---

## Summary Table

| Variable | Required? | Type | Environment | Category |
|----------|-----------|------|-------------|----------|
| `DATABASE_URL` | Yes | Secret | Both | Core |
| `SESSION_SECRET` / `NEXTAUTH_SECRET` | Yes | Secret | Both | Auth |
| `ANTHROPIC_API_KEY` | Yes | Secret | Both | AI |
| `PORT` | Yes* | Standard | Dev only | Core |
| `BASE_PATH` | Yes* | Standard | Dev only | Core |
| `NODE_ENV` | No | Standard | Both | Core |
| `GOOGLE_CLIENT_ID` | No | Public | Both | Auth |
| `GOOGLE_CLIENT_SECRET` | No | Secret | Both | Auth |
| `PAYSTACK_SECRET_KEY` | No | Secret | Both | Payments |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | No | Public | Both | Payments |
| `PAYSTACK_PRO_PLAN_CODE` | No | Standard | Both | Payments |
| `RESEND_API_KEY` | No | Secret | Both | Email |
| `FROM_EMAIL` | No | Standard | Both | Email |
| `TIKTOK_CLIENT_KEY` | No | Secret | Both | Integration |
| `TIKTOK_CLIENT_SECRET` | No | Secret | Both | Integration |
| `YOUTUBE_CLIENT_ID` | No | Secret | Both | Integration |
| `YOUTUBE_CLIENT_SECRET` | No | Secret | Both | Integration |
| `NOTION_API_KEY` | No | Secret | Both | Integration |
| `CRON_SECRET` | No | Secret | Both | Operations |

*`PORT` and `BASE_PATH` are auto-set in Replit; not needed for Vercel.

---

## Vercel Deployment Setup

1. **Core variables to set in Vercel Dashboard → Settings → Environment Variables:**
   - `DATABASE_URL` (production, preview, development)
   - `SESSION_SECRET` or `NEXTAUTH_SECRET` (production)
   - `ANTHROPIC_API_KEY` (production)
   - NODE_ENV=production (auto-set by Vercel)

2. **Optional integrations to add:**
   - Google OAuth: Add `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
   - Paystack: Add `PAYSTACK_SECRET_KEY` and optionally `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
   - Email: Add `RESEND_API_KEY` + `FROM_EMAIL`
   - Other integrations as needed

3. **Build & Deploy:**
   - Vercel will automatically run `pnpm run build` during deployment
   - Environment variables are injected at build-time for `VITE_*` prefixed vars only
   - All secret variables (without `VITE_` prefix) are only available at runtime

---

## Development Setup (Local)

1. Create a `.env.local` file in the workspace root (not committed to git)
2. Add all required variables:
   ```
   DATABASE_URL=postgresql://...
   SESSION_SECRET=your-random-32-char-secret
   ANTHROPIC_API_KEY=sk-ant-...
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
3. Replit automatically loads secrets from the workspace secrets panel
4. Never commit `.env.local` or `*.env` files to git

---

## Safe Defaults & Error Handling

- If `ANTHROPIC_API_KEY` is missing, the app loads but AI features will fail at runtime with a clear error
- If `DATABASE_URL` is missing during startup, the app will fail to start (expected)
- If optional integrations are missing, the app shows a "Not configured" message in settings
- Paystack, email, YouTube, TikTok, Notion integrations are all optional and gracefully disabled if secrets are missing
- The app never crashes due to missing optional env vars; it gracefully degrades

---

## Security Best Practices

1. **Never commit secrets** to Git. Use `.gitignore` for `.env*` files.
2. **Rotate secrets periodically**, especially API keys.
3. **Use separate API keys for development and production**.
4. **Use Vercel's built-in secrets manager** for production deployments.
5. **Never log or expose** `SESSION_SECRET`, `ANTHROPIC_API_KEY`, or other secret variables.
6. **Verify webhook signatures** when using Paystack webhooks (HMAC SHA512 of request body with `PAYSTACK_SECRET_KEY`).
7. **Use HTTPS only** for production to prevent credential interception.

---

## Troubleshooting

**"PORT environment variable is required" error**
- This is expected during `pnpm build` outside of a Replit workflow
- Solution: Set `PORT=3000` when building locally, or use Replit's workflow system

**"DATABASE_URL is required" error**
- Database is missing or connection string is invalid
- Solution: Check Replit Database settings or provide a valid PostgreSQL URL

**AI features not working**
- `ANTHROPIC_API_KEY` may be missing or invalid
- Solution: Check that the API key is correctly set and has available credits

**Stripe webhooks failing**
- `STRIPE_WEBHOOK_SECRET` may be missing or mismatched
- Solution: Verify webhook signing secret in Stripe Dashboard matches the env var

---

Generated: May 3, 2026
Flowra — Workflow Automation for Creator Deals
