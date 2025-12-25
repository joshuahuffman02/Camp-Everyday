# Pre-Launch Checklist

Actionable steps required before going live with paying customers.

---

## 1. Payments (Stripe)

### Current State
- Using Stripe **test mode** (`sk_test_...`)
- Test cards work, but no real money flows

### Action Items
- [ ] Complete Stripe account verification (business info, bank account)
- [ ] Switch to **live mode** API keys
- [ ] Set environment variables in Railway:
  ```
  STRIPE_SECRET_KEY=sk_live_...
  STRIPE_PUBLISHABLE_KEY=pk_live_...
  STRIPE_WEBHOOK_SECRET=whsec_...  (create new webhook for production URL)
  ```
- [ ] Create production webhook endpoint in Stripe Dashboard pointing to:
  `https://your-api-domain.railway.app/payments/webhook`
- [ ] Test a real $1 transaction, then refund it

---

## 2. Domain & SSL

### Current State
- Using Railway's default subdomain (`*.up.railway.app`)

### Action Items
- [ ] Purchase domain (e.g., `campeveryday.com` or `campreserv.com`)
- [ ] Add custom domain in Railway dashboard for both services:
  - API: `api.campeveryday.com`
  - Web: `app.campeveryday.com` (or just `campeveryday.com`)
- [ ] Configure DNS records as Railway instructs (CNAME)
- [ ] SSL certificates are automatic via Railway
- [ ] Update all hardcoded URLs in codebase:
  - `NEXT_PUBLIC_API_URL`
  - `NEXTAUTH_URL`
  - OAuth callback URLs
  - Email templates

---

## 3. QuickBooks Integration

### Current State
- OAuth flow is built but no developer app registered

### Action Items
- [ ] Create Intuit Developer account: https://developer.intuit.com/
- [ ] Create a new app (QuickBooks Online and Payments)
- [ ] Set OAuth redirect URI: `https://api.campeveryday.com/integrations/oauth/qbo/callback`
- [ ] Get credentials and set in Railway:
  ```
  QBO_CLIENT_ID=...
  QBO_CLIENT_SECRET=...
  ```
- [ ] Test OAuth flow with a sandbox QuickBooks company
- [ ] Apply for production access (Intuit reviews your app)

---

## 4. Email Provider

### Current State
- Using development/test email setup

### Action Items
- [ ] Choose email provider: **Resend**, **SendGrid**, **Postmark**, or **AWS SES**
- [ ] Create account and verify sending domain
- [ ] Set environment variables:
  ```
  EMAIL_PROVIDER=resend  (or sendgrid, etc.)
  EMAIL_API_KEY=...
  EMAIL_FROM=hello@campeveryday.com
  ```
- [ ] Configure SPF, DKIM, and DMARC DNS records for deliverability
- [ ] Test all transactional emails:
  - Reservation confirmation
  - Payment receipt
  - Password reset
  - Check-in reminder

---

## 5. SMS Provider (Optional)

### Current State
- SMS not configured

### Action Items
- [ ] Choose provider: **Twilio** or **AWS SNS**
- [ ] Create account, get phone number
- [ ] Set environment variables:
  ```
  TWILIO_ACCOUNT_SID=...
  TWILIO_AUTH_TOKEN=...
  TWILIO_PHONE_NUMBER=+1...
  ```
- [ ] Test SMS for check-in reminders, gate codes

---

## 6. Database

### Current State
- Using Railway Postgres (good for production)

### Action Items
- [ ] Enable automated backups in Railway
- [ ] Set up point-in-time recovery if available
- [ ] Document backup/restore procedure
- [ ] Consider connection pooling for scale (PgBouncer)

---

## 7. Authentication & Security

### Current State
- NextAuth configured with basic setup

### Action Items
- [ ] Generate new production secrets:
  ```bash
  openssl rand -base64 32  # For NEXTAUTH_SECRET
  openssl rand -base64 32  # For JWT_SECRET
  ```
- [ ] Set in Railway:
  ```
  NEXTAUTH_SECRET=...
  JWT_SECRET=...
  NEXTAUTH_URL=https://app.campeveryday.com
  ```
- [ ] Review and test password reset flow
- [ ] Consider adding rate limiting for auth endpoints
- [ ] Enable HTTPS-only cookies in production

---

## 8. File Storage (Photos/Documents)

### Current State
- May be using local storage or placeholder

### Action Items
- [ ] Set up AWS S3 bucket (or Cloudflare R2, Railway Object Storage)
- [ ] Configure bucket for public read (photos) or signed URLs (documents)
- [ ] Set environment variables:
  ```
  AWS_ACCESS_KEY_ID=...
  AWS_SECRET_ACCESS_KEY=...
  AWS_S3_BUCKET=campreserv-uploads
  AWS_REGION=us-east-1
  ```
- [ ] Update upload endpoints to use cloud storage
- [ ] Set up CDN (CloudFront) for faster image delivery

---

## 9. Monitoring & Alerts

### Action Items
- [ ] Set up error tracking: **Sentry** (recommended)
  ```
  SENTRY_DSN=...
  ```
- [ ] Set up uptime monitoring: **BetterUptime**, **UptimeRobot**, or Railway's built-in
- [ ] Configure Slack/Discord alerts for:
  - Deployment failures
  - Error spikes
  - Payment failures
- [ ] Set up basic analytics: **Plausible**, **PostHog**, or **Vercel Analytics**

---

## 10. Legal & Compliance

### Action Items
- [ ] Privacy Policy page (required for Stripe, email providers)
- [ ] Terms of Service page
- [ ] Cookie consent banner (if serving EU users)
- [ ] Refund/cancellation policy
- [ ] PCI compliance confirmation (Stripe handles most of this)

---

## 11. Other Integrations (As Needed)

### Xero (International Accounting)
- [ ] Register at https://developer.xero.com/
- [ ] Set `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`
- [ ] Callback: `https://api.campeveryday.com/integrations/oauth/xero/callback`

### HubSpot (CRM)
- [ ] Register at https://developers.hubspot.com/
- [ ] Set `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET`

### Zendesk (Support)
- [ ] Create OAuth client in Zendesk admin
- [ ] Set `ZENDESK_CLIENT_ID`, `ZENDESK_CLIENT_SECRET`, `ZENDESK_SUBDOMAIN`

---

## 12. Pre-Launch Testing

### Action Items
- [ ] Create test campground account end-to-end
- [ ] Complete full booking flow with real (test mode) payment
- [ ] Test email delivery to multiple providers (Gmail, Outlook, Yahoo)
- [ ] Test on mobile devices (iOS Safari, Android Chrome)
- [ ] Load test critical endpoints
- [ ] Verify all "Coming Soon" features are properly gated

---

## Environment Variables Summary

```bash
# Production Essentials
NODE_ENV=production
DATABASE_URL=postgresql://...

# Domain
NEXT_PUBLIC_API_URL=https://api.campeveryday.com
NEXTAUTH_URL=https://app.campeveryday.com

# Auth
NEXTAUTH_SECRET=<generate new>
JWT_SECRET=<generate new>

# Stripe (LIVE)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
EMAIL_PROVIDER=resend
EMAIL_API_KEY=...
EMAIL_FROM=hello@campeveryday.com

# QuickBooks
QBO_CLIENT_ID=...
QBO_CLIENT_SECRET=...

# File Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...

# Monitoring
SENTRY_DSN=...
```

---

## Launch Day Checklist

- [ ] All environment variables set in Railway production
- [ ] DNS propagated (check with `dig` or online tools)
- [ ] SSL working on custom domain
- [ ] Real Stripe payment test passed
- [ ] Email delivery confirmed
- [ ] Monitoring/alerts active
- [ ] Backup verified
- [ ] Support email/chat ready
- [ ] Announcement ready (social, email list)

---

**Last Updated:** December 2024
