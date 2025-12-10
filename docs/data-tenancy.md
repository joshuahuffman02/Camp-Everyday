# Data hosting and multi-campground tenancy

This project is designed for a **single shared PostgreSQL database** with strict per-campground scoping. Each row that is campground-specific carries a `campgroundId`, and authorization enforces memberships and roles so users only see and act on data belonging to the campground(s) they are permitted to manage. Key notes:

- **Hosting options (recommended):**
  - Managed Postgres such as **AWS RDS/Aurora**, **Google Cloud SQL**, or **Azure Database for PostgreSQL** for reliability, backups, and point-in-time recovery.
  - For a lean start, **Render/Neon/Supabase** or **Fly.io Postgres** offer managed instances with automated TLS and storage.
  - Use **S3-compatible object storage** for media (site photos, docs) and **Redis** (optional) for sessions/rate limits.
  - Keep secrets in a managed vault (AWS Secrets Manager, GCP Secret Manager, or Doppler/1Password) and inject via environment variables.

- **Multi-campground data separation:**
  - **Campground membership model:** Users gain access to campgrounds via `campground_memberships` with roles (owner, manager, front desk, maintenance, finance, marketing, read-only). Every request is authorized by campground scope, preventing cross-camp data leakage.
  - **Row-level filters:** API queries always filter by `campgroundId`. PostgreSQL Row-Level Security (RLS) can be enabled later for an additional guardrail.
  - **Global guests with scoped visibility:** Guests live in the shared `users` table to support repeat travelers, but:
    - **Default views** (e.g., marketing exports, reservation lists) only show guests who have stayed at the active campground.
    - **Search assist on booking:** When staff creates a new booking, name/email/phone lookup can surface matches from the global user directory to prefill contact info. The reservation is still scoped to the current campground.
    - **No cross-camp marketing:** Marketing or bulk communications should query only guests with stays in that campground.
  - **Admin context picker:** The admin shell now includes a portfolio/park picker that writes `campreserv:selectedPortfolio`, `campreserv:selectedPark`, and `campreserv:selectedCampground` into `localStorage` while also calling `/portfolios/select`, keeping `x-portfolio-id` and `x-park-id` headers in sync across pages.

- **Account creation flows:**
  - **Guests:** Can book without an account using a short-lived guest token, or create an account via email/password or magic-link to manage reservations, store rig details, and speed checkout.
  - **Campground staff/admins:** Created by an owner/manager via the admin UI (membership invite), optionally enforced by domain allowlists. Roles map to feature access:
    - **Owner:** Full access, billing, role management.
    - **Manager:** Most admin features, can create staff and configure pricing/policies.
    - **Front desk:** Create/modify reservations, check-in/out, apply deals.
    - **Maintenance:** Manage blackouts/maintenance blocks; read reservations for operations.
    - **Finance:** View payouts, taxes/fees reports, issue refunds.
    - **Marketing:** Manage deals/events, run allowed exports (guests of their campground only).
    - **Read-only:** View-only access for audits or training.

- **Per-campground configuration:**
  - **Pricing, taxes, and fees**: Defined per campground in the charges/policies tables; APIs expose `/campgrounds/:id/charges` and `/campgrounds/:id/policies`.
  - **Seasonal rules and holidays:** Stored as pricing rules scoped by campground; examples (e.g., Apr 15–Oct 15) are entered per campground.
  - **Cancellation/refund policies:** Saved per campground, referenced during checkout and staff actions.
  - **Events and deals:** Owned by a campground; events surface in guest flows and can prefill date ranges for booking. Deals can be event-linked or date-based and are restricted to the owning campground.

- **Future OTA and analytics readiness:**
  - Add per-campground API credentials for OTA calendar sync to keep inventory aligned without sharing other campgrounds' data.
  - Expose read-only replicas or warehouse connectors (e.g., to Power BI) per campground or globally with views limited by `campgroundId`.

This approach keeps operational data in one database for efficiency while enforcing strict campground scoping in code and, optionally, via PostgreSQL RLS.
