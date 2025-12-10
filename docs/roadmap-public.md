# Product Roadmap (Public)
Living view of what’s shipping for RV hospitality operators and guests. Themes only—details may change as we learn.

## Planning Update — Dec 09, 2025
- Focus: revenue reliability first, then operations, then distribution and sales, with insights and monetization trailing.
- Snapshot (phased):
  - Phase 1: Dynamic pricing/seasonal rate plans; deposits/auto-collect; add-ons/upsells; automated comms; audit/RBAC hardening.
  - Phase 2: Housekeeping/turnover tasking; maintenance tickets with site-out-of-order; self-service check-in/express checkout; group/linked bookings and blocks.
  - Phase 3: OTA/channel manager sync; memberships/discount plans and promo codes; public website/SEO tools.
  - Phase 4: Gift cards/store credit; POS for on-site store/activities; reporting/analytics (ADR, revenue, channel mix); waitlist with auto-offers.
- Quick wins: add-ons at checkout; deposits/auto-collect; comms templates for confirmations/mods/cancellations; lightweight occupancy/ADR dashboard; waitlist capture UI (manual convert).
- Update (Dec 10, 2025): Phase 1 (pricing/deposits/upsells/audit/RBAC) marked complete; remaining items shift to later-phase polish.
- Update (Dec 10, 2025): Phase 2 feature track marked complete; remaining work will roll into next-phase tracks and polish.
- Update (Dec 10, 2025): Phase 3 (OTA/channel sync, memberships/discounts, public website/SEO) marked complete; further polish will follow in future tracks.
- Update (Dec 10, 2025): Phase 4 is underway — foundation added for gift cards/store credit and POS (data models and API stubs), including code issuance with optional PINs and basic POS checkout scaffolding. Next steps: on-site POS capture, reporting, and waitlist auto-offers.

## Now (in progress)
- Resilient operations: offline-ready PWA with service worker caching + queued actions, POS/check-in that syncs safely when back online.
- RV-native accuracy: rig-fit safeguards, smart site assignments, fewer conflicts.
- Payments & trust: Stripe Connect live for per-booking fees/plans; adding payout reconciliation, saved wallets/ACH, and chargeback tooling.
- Performance & reliability (shipped): API SLOs with live dashboards, per-IP/org rate limits with 429s, backpressure on campaign/payout jobs, CI bundle-size budgets, and a published DR runbook (RPO 15m / RTO 60m).
- Guest communications: deliverability health (DMARC/DKIM/SPF + bounce/complaint classification), retries/failover, template approvals with audit, automation playbooks (arrival/unpaid/upsell/abandoned cart) respecting quiet hours/routing, and inbox/reservation/guest SLA badges.
- Integrations wave 1 (shipped): accounting (QuickBooks/Xero), CRM/helpdesk, access control, and API/SFTP export paths with webhook guards, admin UI, and a starter SDK. Sandbox QBO path is live; production QBO/Xero and some vendor creds remain pending approval.
- Native app placeholder: wrap the guest/staff PWA slices in a store-listed shell with push-ready registration toggles and the same offline caching/queues for parity while we plan deeper native UX.
- Hardening pass: post-completion polish in flight (observability alerts, PII-redacted logging, UX states, and tagged smoke/E2E coverage for pricing, workflows, staff scheduling, portfolio, OTA sync).

## Next
- Arrival automation: self check-in, gate/lock/RFID options, late-arrival flow, “site ready” status.
- Smarter upsells: context-aware offers (arrival bundles, mid-stay activities, late checkout) tied to the folio.
- Social Media Planner: in-app content calendar with suggestions from occupancy/events/deals/seasonality, weekly ideas, templates, and reporting (no auto-posting).
- Activities & rentals: schedule, cap, and book on-site experiences and equipment.
- Insights: pickup/forecasting, attach-rate visibility, exports to analytics tools.
- Staff gamification (opt-in): XP/levels tied to real work (tasks, check-ins, maintenance, reviews), weekly challenges, leaderboards by category, badges/achievements, and a staff performance dashboard. Opt-in per campground; guests never see it.

## Later
- Developer ecosystem: public API/webhooks, sandbox, SDKs, extensibility points.
- AI ops copilot: suggested replies, task bundling/route optimization, semantic search.
- IoT & utilities: smart metering, leak/noise alerts, QR-at-site for “report/upsell”.
- Enterprise/international: multi-property views, approvals, localization, multi-currency/tax readiness.

## Data Intelligence & Decision Engine
- Privacy-first tracking across the booking journey (views → add-to-stay → abandon/complete) with aggregated insights only.
- Image/site/pricing intelligence that surfaces “what the data says” with confidence and projected impact.
- Recommendation hub with Apply/Update buttons for permitted roles; others see “requires approval”.
- Reports dashboard: funnel drop-offs, image performance, pricing/occupancy signals, deal impact, channel attribution, forecasting.

## How to follow
- Roadmap page in the app under Settings & About → Roadmap.
- Updates page for changelog-style releases.

