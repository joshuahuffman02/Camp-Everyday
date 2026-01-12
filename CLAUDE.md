# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Campreserv: Multi-tenant SaaS for campground, RV park, and lodging reservations. pnpm monorepo with NestJS API and Next.js frontend.

## Quick Start

**Working on specific areas? Load the right skill:**
- API/Backend (Node) → Use `nestjs-api` skill
- API/Backend (Rust) → Reference `.claude/rules/rust.md`
- Frontend/UI → Use `ui-development` skill
- Database → Use `prisma-database` skill
- Payments → Reference `.claude/rules/payments.md`

**Critical rules (never violate these):**
1. ✅ Always verify your work: Run `pnpm build` + tests after changes
2. ✅ Use Plan mode (shift+tab 2x) for multi-file changes
3. ✅ Multi-tenant: Include `campgroundId` in ALL queries
4. ✅ Money: Use integers for cents (`9999` = $99.99), validate with Zod
5. ✅ Icons: Use Lucide SVG, never emojis
6. ✅ Validate all external data with Zod (user input, APIs, webhooks)

## Prerequisites

- Node 22.x (required for Prisma 7)
- pnpm 7.33.6 (`npm install -g pnpm@7.33.6`)

## Essential Commands

```bash
# Development
pnpm dev                    # Run both API (4000) + Web (3000)
pnpm api                    # API only
pnpm web                    # Web only

# Build (always run after changes)
pnpm build                  # Build all: shared -> API -> Web

# Testing
pnpm test:api               # All API tests
pnpm test:api:path src/__tests__/reservations.spec.ts  # Single test file
pnpm --dir platform/apps/api test:smoke               # Smoke tests only
pnpm --dir platform/apps/web test                     # Web unit tests
pnpm --dir platform/apps/web test:e2e                 # Playwright E2E

# Database
pnpm --dir platform/apps/api prisma:generate   # After schema changes
pnpm --dir platform/apps/api prisma:migrate    # Run migrations
pnpm --dir platform/apps/api prisma:seed       # Seed sample data
pnpm --dir platform/apps/api prisma:studio     # Visual DB browser
pnpm prisma:reset-seed                         # Full reset + reseed

# Linting (pre-commit hook runs lint:web automatically)
pnpm lint:web               # Lint web app
pnpm lint:fix               # Auto-fix lint issues
```

## Project Structure

```
platform/
  apps/
    api/          # NestJS backend (port 4000)
    web/          # Next.js frontend (port 3000)
  packages/
    shared/       # Shared Zod schemas & types
    sdk/          # Client SDK
    integrations-sdk/
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | NestJS 10, Rust (critical services), Prisma 7, PostgreSQL |
| Frontend | Next.js 14 (App Router), React 18, TailwindCSS |
| Auth | NextAuth 5 (beta), JWT (7-day expiry) |
| Payments | Stripe (connected accounts per campground) |
| State | TanStack Query (primary), SWR |
| UI | Radix UI, shadcn/ui components |
| Monorepo | pnpm workspaces |

**Rust services (planned):**
- Payment processing (security-critical)
- Availability calculator (complex logic)
- Authentication (critical)
- Math-heavy features (pricing, calculations)

## CRITICAL GUARDRAILS

**DO NOT modify these without explicit approval:**

1. **Prisma 7 Generator** - Must stay as `prisma-client-js`, uses `PrismaPg` adapter at runtime
2. **Build Tool** - API uses `tsup` (not `tsc`) - see `tsup.config.ts`
3. **Multi-tenant isolation** - Always scope queries by `campgroundId`
4. **Money in cents** - All amounts are integers (e.g., `9999` = $99.99)
5. **No emojis** - Use Lucide SVG icons instead (professional and scalable)

### Deployment Architecture

| Environment | Frontend | API | Database |
|-------------|----------|-----|----------|
| **Production** | Vercel (`keeprstay.com`) | Railway (`api.keeprstay.com`) | Supabase (main) |
| **Staging** | Vercel (`staging.keeprstay.com`) | Railway (`api-staging.keeprstay.com`) | Supabase (staging branch) |
| **Preview** | Vercel (auto PR previews) | N/A | N/A |

**Branch Strategy:**
```
feature/* ─→ PR to staging ─→ merge ─→ test on staging ─→ PR to main ─→ production
```

### CI/CD Pipeline

GitHub Actions runs automatically on PRs to `main` or `staging`:

| Job | What it does |
|-----|--------------|
| `lint` | ESLint checks |
| `test-api` | API smoke tests with PostgreSQL |
| `test-sdk` | SDK unit tests |
| `build` | Full build verification |
| `e2e` | Playwright E2E tests (PRs only) |

**Deployment triggers:**
- Push to `staging` → deploys to staging environments
- Push to `main` → deploys to production

See `docs/DEVELOPER_WORKFLOW.md` for the complete workflow guide.

### Environment-Based Configuration

API URLs are configured via `NEXT_PUBLIC_API_BASE` environment variable:

| Environment | NEXT_PUBLIC_API_BASE |
|-------------|---------------------|
| Local | `http://localhost:4000/api` |
| Staging | `https://api-staging.keeprstay.com/api` |
| Production | `https://api.keeprstay.com/api` |

The centralized config is in `platform/apps/web/lib/api-config.ts`.

---

## Area-Specific Rules

Detailed patterns in `.claude/rules/` (auto-loaded by directory):
- `.claude/rules/api.md` - NestJS services, controllers, DTOs, auth guards
- `.claude/rules/rust.md` - Safety-critical code, error handling, async
- `.claude/rules/web.md` - Components, queries, forms, accessibility
- `.claude/rules/prisma.md` - Schema changes, migrations, query patterns
- `.claude/rules/payments.md` - Money handling, Stripe, ledger entries

**When to use Rust vs TypeScript:**
- Rust → Payment processing, auth, availability calculator, money/security
- TypeScript → CRUD, admin dashboards, business logic, integrations

---

## Key File Locations

| Purpose | Path |
|---------|------|
| Prisma Schema | `platform/apps/api/prisma/schema.prisma` |
| API Modules | `platform/apps/api/src/[feature]/` |
| API Entry | `platform/apps/api/src/main.ts` |
| Web API Client | `platform/apps/web/lib/api-client.ts` |
| Web App Routes | `platform/apps/web/app/` |
| UI Components | `platform/apps/web/components/ui/` |
| Shared Schemas | `platform/packages/shared/src/index.ts` |
| Auth Config | `platform/apps/web/auth.ts` |

---

## Domain Entities

```
Organization (multi-tenant root)
  └── Campground (individual property)
       ├── SiteClass (category: RV, Tent, Cabin)
       │    └── Site (bookable unit)
       ├── Guest (customer record)
       ├── Reservation (booking)
       │    └── Payment / LedgerEntry (financials)
       └── Product / StoreOrder (POS)
```

### Reservation Status Flow
```
pending → confirmed → checked_in → checked_out
    ↓
cancelled
```

### User Roles
| Role | Scope | Access |
|------|-------|--------|
| `platform_admin` | Platform | All campgrounds |
| `owner` | Campground | Full access |
| `manager` | Campground | Operations |
| `front_desk` | Campground | Reservations, guests |
| `maintenance` | Campground | Tickets only |
| `finance` | Campground | Reports, payments |
| `readonly` | Campground | View only |

---

## Important Documentation

**Development & Deployment:**
- `docs/DEVELOPER_WORKFLOW.md` - Branch strategy, CI/CD, deployment process
- `docs/AI_FIRST_DEVELOPMENT.md` - Complete guide to Zod, Sentry, Testing
- `docs/RUST_MIGRATION_PLAN.md` - Plan for migrating to Rust
- `docs/OPENAI_INTEGRATION.md` - OpenAI + pgvector semantic search

**Read these when:**
- Deploying or setting up CI/CD → DEVELOPER_WORKFLOW.md
- Building new features → AI_FIRST_DEVELOPMENT.md
- After first customers → RUST_MIGRATION_PLAN.md
- Adding AI features → OPENAI_INTEGRATION.md

## Known Issues & Technical Debt

### Pending External Integrations
- **OTA providers** (Airbnb, Booking.com) - awaiting API credentials
- **Currency/FX rates** - needs OpenExchangeRates or XE.com integration
- **RV Life reviews** - API not yet documented
- **SMS failover** - single Twilio provider only

### In-Memory State (Not Distributed)
- Account lockout uses `Map<>` (TODO: migrate to Redis)
- Scope cache uses in-memory Map with 5000 entry limit
- Idempotency counters use memory with expiry cleanup

### Frontend TODOs
- Gift card API integration stubbed in PaymentCollectionModal
- Wallet debit API not implemented
- Reminder email shows `alert("TODO")`

---

## Common Issues & Fixes

### "Cannot find module '@prisma/client'"
```bash
pnpm --dir platform/apps/api prisma:generate
```

### Type errors after schema change
```bash
pnpm build:shared && pnpm --dir platform/apps/api prisma:generate
```

### Port already in use
```bash
lsof -i :4000 && kill -9 <PID>
```

### Migration drift
```bash
DATABASE_URL="..." npx prisma migrate resolve --applied "migration_name"
```

---

## Verification by Feature Area

| Change Type | Verification Command |
|-------------|---------------------|
| API changes | `pnpm build:api` |
| Frontend changes | `pnpm build:web` |
| Schema changes | `pnpm --dir platform/apps/api prisma:generate` |
| Shared types | `pnpm build:shared` |
| Everything | `pnpm build` |

## Advanced Workflows

**Parallel Execution:**
- Run multiple Claude sessions in parallel for faster iteration
- Use numbered terminal tabs (1-5) to track sessions
- Hand off between local CLI and claude.ai/code using `&` or `--teleport`
- Start sessions from mobile and check in later

**Hooks for Auto-Verification:**
Configure `.claude/hooks.json` to automatically verify work:
```json
{
  "postToolUse": {
    "Edit": "pnpm build",
    "Write": "pnpm build"
  }
}
```

**Verification Subagent:**
For long-running tasks, use a background agent to verify:
- Create `.claude/agents/verify-app.md` with testing steps
- Invoke with: `Task(subagent_type="verify-app")`
- Or use a Stop hook to run verification automatically

---

## Code Patterns

**Always do:**
- Null-check after `findUnique`/`findFirst`
- Normalize emails: `.trim().toLowerCase()`
- Include `campgroundId` in tenant-scoped queries
- Invalidate TanStack queries on mutation success
- Check `typeof window !== 'undefined'` before localStorage
- Use Zod for money, user input, external data validation
- Use NestJS Logger (`this.logger.log()`), not console.log
- Add guards to endpoints: `@UseGuards(JwtAuthGuard, RolesGuard)`
- Use specific exceptions: `BadRequestException`, `NotFoundException`
- Wrap risky ops in try/catch + `Sentry.captureException()`

**Ask before:**
- Adding new npm packages
- Adding `@Cron` or `@Interval` decorators (Railway has limited DB connections)

---

## Environment Variables

### API (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
STRIPE_SECRET_KEY=sk_...
REDIS_URL=redis://... (optional)
```

### Web (.env)
```
NEXT_PUBLIC_API_BASE=http://localhost:4000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
```

---

## Deployment

**Platforms:**
- **Frontend**: Vercel (auto-deploy on push)
- **API**: Railway (auto-deploy on push)
- **Database**: Supabase PostgreSQL (with GitHub branching integration)
- **DNS**: Cloudflare

**URLs:**
| Environment | Frontend | API | Health Check |
|-------------|----------|-----|--------------|
| Production | https://keeprstay.com | https://api.keeprstay.com | `/api/health` |
| Staging | https://staging.keeprstay.com | https://api-staging.keeprstay.com | `/api/health` |

**Build tools:**
- API: `tsup` (not `tsc`)
- Web: `next build`

**To deploy:**
1. Create feature branch from `staging`
2. Make changes, push, create PR to `staging`
3. CI runs automatically - merge when green
4. Test on staging environment
5. Create PR from `staging` to `main` for production

See `docs/DEVELOPER_WORKFLOW.md` for complete guide.
