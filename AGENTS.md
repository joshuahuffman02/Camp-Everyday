# Repository Guidelines

This repo is a pnpm workspace containing a NestJS API, a Next.js web app, shared TypeScript packages, and supporting Rust services.

## Project Structure & Module Organization
- `platform/apps/api`: NestJS API; Prisma schema, migrations, and seeds in `platform/apps/api/prisma`.
- `platform/apps/web`: Next.js app (App Router). Routes in `app/`, UI in `components/`, static assets in `public/`.
- `platform/packages/shared`, `platform/packages/sdk`, `platform/packages/integrations-sdk`: shared types and SDKs.
- `platform/services/*`: Rust services used by the platform.
- `scripts/` and `docs/`: repo tooling and documentation.

## Build, Test, and Development Commands
- `pnpm install`: install workspace deps (Node `22.x`, pnpm `7.33.6`).
- `pnpm dev`: run API + web concurrently.
- `pnpm --dir platform/apps/api dev`: start API (default port 4000).
- `pnpm --dir platform/apps/web dev`: start web app (default port 3000).
- `pnpm build`: build shared + api + web.
- `pnpm lint:web`: run web ESLint plus `scripts/check-no-any-no-assert.js`.
- `pnpm --dir platform/apps/api test:smoke`: API smoke tests (Jest).
- `pnpm --dir platform/apps/web test`: web unit tests (Vitest).
- `pnpm --dir platform/apps/web test:e2e`: Playwright E2E tests.

## Coding Style & Naming Conventions
- TypeScript everywhere; follow NestJS file naming (`*.controller.ts`, `*.service.ts`) under `platform/apps/api/src`.
- Web uses Next.js App Router patterns; keep route files in `platform/apps/web/app` and shared UI in `platform/apps/web/components`.
- Web ESLint disallows explicit `any` and type assertions; fix lint before commit.
- No repo-wide Prettier config; match existing formatting in touched files.

## Testing Guidelines
- API tests use Jest with specs in `platform/apps/api/src/__tests__` or `platform/apps/api/__tests__` and `*.spec.ts` naming.
- Web unit tests use Vitest (`*.test.tsx`/`*.test.ts`); E2E tests live in `platform/apps/web/e2e/*.spec.ts`.
- SDK packages follow `*.test.ts` naming in `platform/packages/*/src`.

## Commit & Pull Request Guidelines
- Commit subjects are short, imperative, and capitalized (e.g., "Fix build error in debug logging"). Avoid extra prefixes unless needed.
- PRs should include a brief summary, tests run, and screenshots for UI changes; link issues when applicable.

## Environment & Configuration
- Copy `.env.example` to `platform/apps/api/.env` and `platform/apps/web/.env`; set DB and auth secrets.
- Prisma workflows are in `platform/apps/api/prisma` (`pnpm --dir platform/apps/api prisma:*`).

## Agent-Specific Notes
- Automation/agent rules live in `docs/AGENTS.md`.
