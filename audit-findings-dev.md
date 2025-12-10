# Dev Audit Findings (http://localhost:3600)

## Open issues (dev)
- Public booking UI: defaults added to booking page (auto-sets dates and jumps to availability step if none provided). Re-test availability/checkout; payments/abandoned-cart still unverified in UI.
- Portal/PWA: Added `/portal/reservations/[id]` redirect to `/portal/login?reservationId=...`; guest view still unvalidated end-to-end (previously 404). Need a valid portal magic link/token (guest email tied to seeded reservations) from auditor to complete validation.
- POS: Now using authenticated store APIs; catalog still empty and checkout at $0. Product seed (category `Cafe`, product `Coffee`) exists, but stock endpoints 404/500 and product not visible in UI.
- Finance:
  - Seed data now in place (payout/dispute/gift card). Payouts/Disputes/Gift cards UIs need re-test with seeded data; exports still pending.
  - Reports landing (`/reports`) loads; exports not exercised yet.
- OTA: `/ota` redirects to `/settings/ota`; content still not validated.
- Activities / Waitlist / Store / Maintenance: pages render shells but show no records; flows unverified.
- POS data seeding: created category `Cafe` (`cmiy26ne6003grjvm66b2l1x3`) and product `Coffee` (`cmiy26wtm003irjvm5m2vsq62`), but stock update failed (404 on POST stock endpoint; 500 on PATCH stockQty). Product not visible in POS UI.
- Waitlist: seeded entry `cmiy26d0p003erjvmpm6n6vm9` (arrival 2026-01-15 to 01-17) for site `cmiucy83h05hju5e15afbjuae`; UI status unverified.
- Store API: POST `/api/store/products` 404; direct product create via campground-scoped endpoint works, but visibility depends on stock update (which currently fails).
- Finance seeding pending (terminal frozen): need to run `pnpm ts-node src/scripts/seed-finance-fixtures.ts` in `platform/apps/api` with `SEED_CAMPGROUND_ID=<campgroundId>` to populate sample payout/dispute/gift card for UI validation.
- Booking V2 (primary): `/park/camp-everyday-mtn-base/book` shows availability with auto-set dates and site buttons, but clicking a site or “Check availability” throws a script error—cannot advance to quote/checkout; payments/abandoned-cart still untestable.
- Booking V2 click error: on `/park/camp-everyday-mtn-base/book` and `/park/camp-everyday-mtn-base` (“Check availability” or selecting a site) throws a script error—cannot advance to quote/checkout, so payments/abandoned-cart still blocked.
- Gift cards: UI loads with metrics and issue/redeem forms, but typing into the code field triggered a script error; issue/redeem still untested end-to-end.
- Waitlist UI: page loads but shows no rows even after seeding entry `cmiy26d0p003erjvmpm6n6vm9`; list still empty.
- Reports: landing page loads; CSV export still not attempted (no data shown to export yet). Needs seeded report data to validate export.
- Finance seed script failed to compile: `pnpm ts-node src/scripts/seed-finance-fixtures.ts` (with `SEED_CAMPGROUND_ID=cmiucy81n05g3u5e1lzgvkhnq`) throws TS2339: Prisma client missing `giftCard` property at seed script line 73. No finance fixtures created.
- Store products API lists seeded `Coffee` (id `cmiy26wtm003irjvm5m2vsq62`, category `Cafe`), stockQty=0; still not surfaced in POS UI; stock endpoints failing (404/500).
- Reports UI: page loads; no report rows or export controls surfaced with current data—needs seeded/real report entries to attempt CSV export.
- Blocking items preventing further E2E progress: booking V2 click error (no checkout), portal guest flow needs magic link/token, POS inventory not usable (stock APIs failing), finance seed script compile error (no payouts/disputes/gift cards data), gift card issue/redeem input error, waitlist UI empty despite seed, reports lack data to export. Need fixes/data/credentials to proceed with payments, abandoned-cart, portal, POS, finance, and exports.

## Seeded test data (public API)
- Cabin: `cmiy0e9t00014rjvm1qtssuny` (Camp Everyday – Mountain Base, Jan 10–12 2026, site C301).
- RV: `cmiy0h9dz0019rjvmoqitvopu` (R101, Jan 15–17 2026).
- Tent: `cmiy0hgwl001erjvmmrgxd9pa` (T201, Feb 5–7 2026).

## Notes
- Availability API works via `/api/public/campgrounds/camp-everyday-mtn-base/availability`, but the UI does not surface results or advance to checkout.
- Ledger still loads and shows balances/entries; other finance routes above remain partially/fully blocked.

