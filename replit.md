# SponsorshipOS

## Overview

AI-powered sponsorship contract management platform for creators. Extracts deal data from PDF contracts, tracks milestones, generates AI performance reports, and handles invoicing.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifact: `artifacts/sponsorship-os`, path `/`)
- **Backend**: Express 5 + Drizzle ORM + PostgreSQL (artifact: `artifacts/api-server`, path `/api`)
- **Auth**: JWT (localStorage `auth_token`), Google OAuth
- **AI**: Anthropic Claude (`claude-sonnet-4-20250514`) — contract extraction, sentiment, performance reports
- **API codegen**: Orval (OpenAPI → React Query hooks + Zod schemas)
- **Build**: esbuild (server), Vite (frontend)

## Artifacts

| Artifact | Dir | Preview Path | Port |
|---|---|---|---|
| SponsorshipOS (frontend) | `artifacts/sponsorship-os` | `/` | `$PORT` |
| API Server (backend) | `artifacts/api-server` | `/api` | `8080` |

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Architecture

### Database (lib/db)
All schema in `lib/db/src/schema/`. Tables: users, creator_profiles, contracts, contract_extractions, milestones, invoices, tax_reserves, communication_analyses, performance_reports, connected_accounts, notion_exports.

### API Routes (`artifacts/api-server/src/routes/`)
All wired in `index.ts`. Routes: auth, dashboard, contracts (AI PDF extraction), milestones, invoices (Stripe), tax, performance (Claude), sentiment (Claude), youtube, tiktok, notion, settings, billing, cron.

### Generated API Client (`lib/api-client-react/src/generated/api.ts`)
**Source of truth for all hook names.** Query hooks: `useGetXxx()`, `useListXxx()`. Mutation hooks: `useCreateXxx()`, `useUpdateXxx()`, etc.

**Important hook calling patterns (TanStack Query v5):**
- Hooks with no special options: call with no args — `useGetProfile()`
- Hooks where `enabled` is needed: `useGetContract(id, { query: { enabled: !!id } as any })`
- The `as any` cast is required because TanStack Query v5 requires `queryKey` in `UseQueryOptions`

### Frontend Pages (`artifacts/sponsorship-os/src/pages/`)
- `/` — Landing page
- `/login`, `/signup`, `/onboarding` — Auth flow
- `/app/dashboard` — KPI cards, income chart, upcoming milestones, risk alerts
- `/app/contracts` — Contract list
- `/app/contracts/new` — PDF upload + AI polling
- `/app/contracts/:id` — Detail tabs: summary/deliverables/payments/risks/legal/export
- `/app/contracts/:id/milestones` — Kanban milestone board
- `/app/contracts/:id/performance` — AI performance report
- `/app/contracts/:id/sentiment` — Brand communication sentiment analysis
- `/app/invoices` — Invoice list
- `/app/invoices/new` — Create invoice
- `/app/tax` — Tax reserve dashboard
- `/app/settings/profile` — Creator profile
- `/app/settings/integrations` — YouTube/TikTok/Stripe/Notion/Resend
- `/app/settings/billing` — Subscription plans
- `/app/settings/api` — API key status
- `/shared/report/:token` — Public performance report (no auth)

## Environment Secrets

**Configured:**
- `ANTHROPIC_API_KEY` — Claude AI (required for core AI features)
- `SESSION_SECRET` — JWT signing
- `DATABASE_URL` — PostgreSQL
- `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` — TikTok OAuth
- `CRON_SECRET` — Cron job auth

**Not yet configured (optional features):**
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth login
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` — Invoicing
- `RESEND_API_KEY`, `FROM_EMAIL` — Email reminders
- `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` — YouTube compliance
- `NOTION_API_KEY` — Notion exports

## Development Notes

- All backend routes use UUID validation before DB queries to prevent PostgreSQL "invalid uuid" 500 errors
- Dashboard field names from API: `totalContractValue`, `paidRevenue`, `activeContractsCount`, `overdueMilestonesCount`, `pendingInvoicesCount`, `pendingInvoicesTotal`
- `ContractWithExtraction` type shape: `{ contract: Contract, extraction?: ContractExtraction, milestonesCount?: number }`
- `RegisterBody` requires `name` field; `OnboardingBody` requires `name` field
- `useExportContractToNotion` takes `{ contractId, data }` not `{ id, data }`
- `useGeneratePerformanceReport` takes `{ contractId }` not `{ id }`
- `useDisconnectIntegration` provider type: `"youtube" | "tiktok" | "notion" | "stripe"`
