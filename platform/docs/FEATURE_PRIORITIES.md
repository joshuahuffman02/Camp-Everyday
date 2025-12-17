# Camp Everyday - Feature Priorities

**Last Updated:** December 17, 2025

These are the 7 key features identified as critical for competitive positioning and acquisition readiness.

---

## Priority Features

| # | Feature | Status | Priority | Notes |
|---|---------|--------|----------|-------|
| 1 | Marketing messaging | Pending | P1 | Lean into "modern alternative to legacy systems" |
| 2 | Booking calendar upgrade | Pending | P1 | Major upgrade needed to compete with Campspot |
| 3 | Interactive site map | Pending | P2 | Site selection via visual map |
| 4 | **Onboarding/Import** | Pending | **P0 CRITICAL** | Bulletproof import from Campspot/Newbook - key for competitive switching |
| 5 | Campground billing portal | **DONE** | P0 | Stripe subscription billing integrated |
| 6 | Email/SMS integration | Partial | P1 | SMS exists via Twilio, needs polish |
| 7 | Modern dashboard UI/UX | Pending | P2 | Visual refresh for modern feel |

---

## Completed

### Campground Billing Portal (Dec 2025)
- Stripe subscription billing with metered usage
- Per-booking fees tracked automatically
- SMS usage tracked automatically
- Billing dashboard UI at `/dashboard/settings/billing`
- Webhook handlers for subscription lifecycle
- Support for all early access tiers (Founders, Pioneer, Trailblazer, Standard)

---

## Next Up: Onboarding/Import System

**Why it's critical:**
- Biggest barrier to switching from competitors
- If import is painful, campgrounds won't switch
- Need to support: CSV, Campspot export, Newbook export

**Requirements:**
- [ ] CSV/Excel universal import
- [ ] Campspot format parser
- [ ] Newbook format parser
- [ ] Field mapping UI
- [ ] Validation with clear error messages
- [ ] Preview before import
- [ ] Rollback capability
- [ ] Import: Sites, Guests, Reservations, Pricing

---

## Feature Details

### 1. Marketing Messaging
- Update copy to position as "modern alternative"
- Highlight: No contracts, transparent pricing, modern UI
- Target pain points of legacy system users

### 2. Booking Calendar
- Full-width calendar view
- Drag-and-drop reservations
- Multi-site selection
- Quick booking modal
- Color coding by status/site type

### 3. Interactive Site Map
- Visual campground map
- Click site to see availability
- Drag to assign reservations
- Real-time availability overlay
- Mobile-friendly

### 4. Onboarding/Import
See "Next Up" section above

### 5. Campground Billing Portal
**COMPLETED** - See "Completed" section

### 6. Email/SMS Integration
- Twilio SMS already working
- Add SendGrid for email
- Template management
- Automated triggers (confirmation, reminder, etc.)
- Delivery tracking

### 7. Modern Dashboard UI/UX
- Clean, minimal design
- Consistent component library
- Fast, responsive
- Dark mode support
- Mobile-optimized
