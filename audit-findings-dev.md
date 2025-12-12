# Dev Audit Findings (http://localhost:3600)

## Agent Guardrails (Prisma 7)
- Prisma 7 is in place. Do NOT switch generator to prisma-client or refactor @prisma/client imports.
- Any new PrismaClient() must use PrismaPg adapter (see existing patterns).
- Don’t touch GitHub/deploy; update docs/audit-core-functions.md and audit-findings-dev.md as you close items.
- Build guardrail: API `build` now runs tsup via `tsup.config.ts`; keep `tsup` in dev deps and prefer `pnpm --filter @campreserv/api build` over raw `tsc`.

## Working notes & sequencing (Dec 11 2025)
- Sequencing: Fix-Reports + Fix-Payments-POS + Fix-StaffBooking first; run Fix-Comms-Observability and Fix-Compliance-Ops in parallel; Fix-Accounting last because GL/rev-rec depend on reports and payments/POS.
- Accounting scope: Use the Accounting & FinOps checklist in docs/audit-core-functions.md after the upstream fixes land. Update both audit files as items close.
- Guardrails: Keep Prisma 7 generator unchanged, keep @prisma/client imports as-is, and wrap any new PrismaClient() with PrismaPg adapter; no GitHub/deploy changes.

## Latest changes
- Vercel build unblocked for API: added `tsup.config.ts`, removed missing `ReportsModule` import from `AppModule`, deduped duplicate methods in `ledger.service.ts`, and updated the `build` script to run tsup (with `tsup` added to dev dependencies); entrypoints now include `src/main.ts` and `src/serverless.ts`; API builds cleanly on pnpm/tsup.
- Comms consent bypass closed: server now ignores client `consentGranted`, requires approved templates (no raw sends), adds SMS retry/backoff + alerting, and hardens observability emit/DLQ/queue metrics.
- Payments/POS hardening: Public payment intents now require `Idempotency-Key` with retry guidance; capture/refund/POS flows auto-issue itemized receipts; POS offline replay stores payload/tender/items and flags carts for review; taxable_load issuance/reload enforces active tax rule plus liability roll-forward drift checks.
- Fix‑StaffBooking add‑on: Reservations UI now surfaces per-reservation conflicts (overlaps/holds/maintenance/blackouts), enforces deposit/tender selection, and requires override reason/approval for manual totals/discounts; server re-validates availability + rig/ADA/amenities on create/update, uses baseline pricing + deposit policy, and records audit + approval requests when overrides happen. Match scorer now feeds ranked site recommendations in the reservations UI.
- Fix‑GuestBooking add‑on: Public booking runs Site → Details → Payment with quote fetching in review (promo/tax safe), Zod schemas coerce Decimal/string to numbers, and dates/guest/siteType persist in URL for refresh/share resilience.
- Fix‑Compliance‑Ops add‑on: Self/kiosk check-in blocks until waiver + ID verification are signed unless an explicit override is provided; overrides are audited with unmet prerequisites and actor/reason, pending statuses are set on failures, signed waiver/IDV artifacts auto-attach to reservation/guest, and access grants run on check-in with revoke on cancel/checkout.

## Comms/Observability add-on (notes)
- Outbound email/SMS ignore client-provided consent flags, always require approved templates (raw sends blocked), and record any client consent attempt in metadata.
- SMS sending now retries with backoff and dispatches Slack/PagerDuty alerts on config gaps or final failure; still single-provider (Twilio) with no failover.
- Observability gained an `emit` path for domain producers, normalized DLQ/queue names, and now records queue capacity metadata; JobQueueService logs saturation attempts.

## Comms/Observability next steps
- Add secondary SMS provider or circuit-breaker failover and alert on sustained failures.
- Persist/forward observability emits to a durable metrics/alerts sink and surface alert-flag status in admin UI.
- Ensure external queues report via JobQueueService or an equivalent metrics hook.

## Open issues (dev)
- Public booking UI: defaults added to booking page (auto-sets dates and jumps to availability step if none provided). Re-test availability/checkout; payments/abandoned-cart still unverified in UI.
- Portal/PWA: Added `/portal/reservations/[id]` redirect to `/portal/login?reservationId=...`; guest view still unvalidated end-to-end (previously 404). Need a valid portal magic link/token (guest email tied to seeded reservations) from auditor to complete validation.
- POS: Now using authenticated store APIs; catalog still empty and checkout at $0. Product seed (category `Cafe`, product `Coffee`) exists, but stock endpoints 404/500 and product not visible in UI.
- Finance:
  - Seed data now in place (payout/dispute/gift card). Payouts/Disputes/Gift cards UIs need re-test with seeded data; exports still pending.
  - Reports landing (`/reports`) loads; export processor now generates CSV/XLSX with download URLs + email/audit/cron, but needs seeded data to validate output in UI.
- OTA: `/ota` redirects to `/settings/ota`; content still not validated.
- Activities / Waitlist / Store / Maintenance: pages render shells but show no records; flows unverified.
- POS data seeding: created category `Cafe` (`cmiy26ne6003grjvm66b2l1x3`) and product `Coffee` (`cmiy26wtm003irjvm5m2vsq62`), but stock update failed (404 on POST stock endpoint; 500 on PATCH stockQty). Product not visible in POS UI.
- Waitlist: seeded entry `cmiy26d0p003erjvmpm6n6vm9` (arrival 2026-01-15 to 01-17) for site `cmiucy83h05hju5e15afbjuae`; UI status unverified.
- Store API: POST `/api/store/products` 404; direct product create via campground-scoped endpoint works, but visibility depends on stock update (which currently fails).
- Finance seeding pending (terminal frozen): need to run `pnpm ts-node src/scripts/seed-finance-fixtures.ts` in `platform/apps/api` with `SEED_CAMPGROUND_ID=<campgroundId>` to populate sample payout/dispute/gift card for UI validation.
- Booking V2: `/park/camp-everyday-mtn-base/book` now advances through Site → Details → Payment without script errors. Quote fetching runs inside the review step (promo/tax state-safe), availability/quote schemas coerce Decimal strings, and URL params persist defaults (dates/guests/siteType). Payments/abandoned-cart can now be exercised.
- Gift cards: UI loads with metrics and issue/redeem forms, but typing into the code field triggered a script error; issue/redeem still untested end-to-end.
- Waitlist UI: page loads but shows no rows even after seeding entry `cmiy26d0p003erjvmpm6n6vm9`; list still empty.
- Finance seed script failed to compile: `pnpm ts-node src/scripts/seed-finance-fixtures.ts` (with `SEED_CAMPGROUND_ID=cmiucy81n05g3u5e1lzgvkhnq`) throws TS2339: Prisma client missing `giftCard` property at seed script line 73. No finance fixtures created.
- Store products API lists seeded `Coffee` (id `cmiy26wtm003irjvm5m2vsq62`, category `Cafe`), stockQty=0; still not surfaced in POS UI; stock endpoints failing (404/500).
- Reports UI: analytics dashboard now exposes CSV/XLSX export (with optional email) and polls job status; still need seeded/real report rows to exercise the export end-to-end.
- Blocking items preventing further E2E progress: booking V2 click error (no checkout), portal guest flow needs magic link/token, POS inventory not usable (stock APIs failing), finance seed script compile error (no payouts/disputes/gift cards data), gift card issue/redeem input error, waitlist UI empty despite seed, reports lack data to export. Need fixes/data/credentials to proceed with payments, abandoned-cart, portal, POS, finance, and exports.

## Next steps
- Confirm Vercel prod deploy stays green with the tsup build script (`tsup.config.ts`) and no `ReportsModule` reference; re-add reports module only when implementation exists.
- Run `pnpm --filter @campreserv/api build` to verify tsup outputs `dist/main.js` for `start`.
- Add a small ledger test to cover `postEntries`/`ensureAccount` to avoid future duplicates/regressions.
- Add API tests for create/update enforcing overrideReason/overrideApprovedBy and for overlap reasons (reservation/hold/maintenance/blackout).
- Extend payments UI to capture multiple tenders and validate tender sum vs deposit/total.
- Wire match scorer into booking flow (public) and consider enforcing ranked picks server-side when class-level booking is used.
- Add regression coverage for self/kiosk check-in blocks (waiver/ID), signingUrl surfacing, pending status writes, access grants on success, and override audit logging.
- Guest booking: validate waitlist UX when availability is empty (dialog + confirmation), and exercise public payment plus abandoned-cart triggers now that quoting is unblocked.

## Recently fixed
- Self/kiosk check-in enforcement: waiver + ID verification required unless an approved override is provided; overrides are audited/noted, access grants auto-run on check-in and revoke on cancel/checkout, and signed waiver/IDV artifacts now attach to the reservation/guest for future checks.

## Seeded test data (public API)
- Cabin: `cmiy0e9t00014rjvm1qtssuny` (Camp Everyday – Mountain Base, Jan 10–12 2026, site C301).
- RV: `cmiy0h9dz0019rjvmoqitvopu` (R101, Jan 15–17 2026).
- Tent: `cmiy0hgwl001erjvmmrgxd9pa` (T201, Feb 5–7 2026).

## Notes
- Availability API works via `/api/public/campgrounds/camp-everyday-mtn-base/availability`, but the UI does not surface results or advance to checkout.
- Ledger still loads and shows balances/entries; other finance routes above remain partially/fully blocked.
- Reports export pipeline now generates CSV/XLSX, uploads/stores download URL, emails recipients, audits, and emits observability; analytics dashboard exposes the export trigger with format/email options and polls job status. Needs seeded report data to validate end-to-end download.
- Observability now records report capacity guard events for heavy/standard limits; export job processor records success/failure durations and queue depth via JobQueueService.

## Next steps
- Seed report/reservation data to exercise analytics export end-to-end (CSV/XLSX + email delivery) and verify download URL.
- Clean up TypeScript lints in `platform/apps/api/src/reports/reports.service.ts` (implicit any warnings, ServiceUnavailableException import).
- Run `reports-export-smoke` tests once data is seeded and prisma/queue deps are available.
- Re-test analytics dashboard export UX after seeding to confirm download link/email content and summary fields.
- If alerts remain silent, confirm env flags for observability/alerts are enabled and queue telemetry flows through JobQueueService.

