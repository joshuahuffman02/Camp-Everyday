//! Database queries for payment processing.
//!
//! Uses runtime queries to avoid requiring DATABASE_URL at compile time.

use sqlx::{PgPool, Row, FromRow};
use chrono::{DateTime, Utc};

use crate::error::{AppError, Result};
use crate::reconciliation::{LedgerEntry, EntryDirection, SourceType};

/// Get a campground's Stripe account ID.
pub async fn get_campground_stripe_account(
    pool: &PgPool,
    campground_id: &str,
) -> Result<Option<String>> {
    let row: Option<(Option<String>,)> = sqlx::query_as(
        r#"SELECT "stripeAccountId" FROM "Campground" WHERE id = $1"#
    )
    .bind(campground_id)
    .fetch_optional(pool)
    .await?;

    Ok(row.and_then(|r| r.0))
}

/// Get a reservation's balance amount.
pub async fn get_reservation_balance(
    pool: &PgPool,
    reservation_id: &str,
    campground_id: &str,
) -> Result<i64> {
    let row: Option<(i32,)> = sqlx::query_as(
        r#"SELECT "balanceAmount" FROM "Reservation" WHERE id = $1 AND "campgroundId" = $2"#
    )
    .bind(reservation_id)
    .bind(campground_id)
    .fetch_optional(pool)
    .await?;

    match row {
        Some((balance,)) => Ok(balance as i64),
        None => Err(AppError::NotFound(format!("Reservation {} not found", reservation_id))),
    }
}

/// Record a payment in the database.
pub async fn record_payment(
    pool: &PgPool,
    campground_id: &str,
    reservation_id: Option<&str>,
    amount_cents: i64,
    payment_intent_id: &str,
    charge_id: Option<&str>,
    payment_method_type: Option<&str>,
    payment_method_last4: Option<&str>,
    payment_method_brand: Option<&str>,
) -> Result<String> {
    let id = uuid::Uuid::new_v4().to_string();

    sqlx::query(
        r#"
        INSERT INTO "Payment" (
            id, "campgroundId", "reservationId", "amountCents",
            method, direction, "stripePaymentIntentId", "stripeChargeId",
            "paymentMethodType", "paymentMethodLast4", "paymentMethodBrand",
            "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, 'card', 'inbound', $5, $6, $7, $8, $9, NOW(), NOW())
        "#
    )
    .bind(&id)
    .bind(campground_id)
    .bind(reservation_id)
    .bind(amount_cents as i32)
    .bind(payment_intent_id)
    .bind(charge_id)
    .bind(payment_method_type)
    .bind(payment_method_last4)
    .bind(payment_method_brand)
    .execute(pool)
    .await?;

    Ok(id)
}

/// Update reservation balance after payment.
pub async fn update_reservation_balance(
    pool: &PgPool,
    reservation_id: &str,
    campground_id: &str,
    payment_amount_cents: i64,
) -> Result<()> {
    sqlx::query(
        r#"
        UPDATE "Reservation"
        SET "balanceAmount" = "balanceAmount" - $1,
            "updatedAt" = NOW()
        WHERE id = $2 AND "campgroundId" = $3
        "#
    )
    .bind(payment_amount_cents as i32)
    .bind(reservation_id)
    .bind(campground_id)
    .execute(pool)
    .await?;

    Ok(())
}

/// Insert a ledger entry.
pub async fn insert_ledger_entry(
    pool: &PgPool,
    entry: &LedgerEntry,
) -> Result<()> {
    let gl_code = entry.gl_code.to_string();
    let direction = match entry.direction {
        EntryDirection::Debit => "debit",
        EntryDirection::Credit => "credit",
    };
    let source_type = match entry.source_type {
        SourceType::Payment => "payment",
        SourceType::Refund => "refund",
        SourceType::Payout => "payout",
        SourceType::Dispute => "dispute",
        SourceType::Fee => "fee",
        SourceType::Adjustment => "adjustment",
    };

    sqlx::query(
        r#"
        INSERT INTO "LedgerEntry" (
            id, "campgroundId", "reservationId", "periodId",
            "glCode", account, description, "amountCents",
            direction, "occurredAt", "externalRef", "dedupeKey",
            "sourceType", "sourceTxId", "sourceTs", hash, adjustment,
            "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
        ON CONFLICT ("dedupeKey") DO NOTHING
        "#
    )
    .bind(&entry.id)
    .bind(&entry.campground_id)
    .bind(&entry.reservation_id)
    .bind(&entry.period_id)
    .bind(&gl_code)
    .bind(&entry.account)
    .bind(&entry.description)
    .bind(entry.amount_cents as i32)
    .bind(direction)
    .bind(entry.occurred_at)
    .bind(&entry.external_ref)
    .bind(&entry.dedupe_key)
    .bind(source_type)
    .bind(&entry.source_tx_id)
    .bind(entry.source_ts)
    .bind(&entry.hash)
    .bind(entry.adjustment)
    .execute(pool)
    .await?;

    Ok(())
}

/// Check if a payment already exists by Stripe payment intent ID.
pub async fn payment_exists_by_intent_id(
    pool: &PgPool,
    payment_intent_id: &str,
) -> Result<bool> {
    let row: Option<(String,)> = sqlx::query_as(
        r#"SELECT id FROM "Payment" WHERE "stripePaymentIntentId" = $1 LIMIT 1"#
    )
    .bind(payment_intent_id)
    .fetch_optional(pool)
    .await?;

    Ok(row.is_some())
}

/// Campground with Stripe account.
#[derive(Debug, FromRow)]
struct CampgroundStripeRow {
    id: String,
    #[sqlx(rename = "stripeAccountId")]
    stripe_account_id: Option<String>,
}

/// Get campgrounds with Stripe accounts for reconciliation.
pub async fn get_campgrounds_with_stripe_accounts(
    pool: &PgPool,
) -> Result<Vec<(String, String)>> {
    let rows: Vec<CampgroundStripeRow> = sqlx::query_as(
        r#"SELECT id, "stripeAccountId" FROM "Campground" WHERE "stripeAccountId" IS NOT NULL"#
    )
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .filter_map(|r| r.stripe_account_id.map(|sa| (r.id, sa)))
        .collect())
}

/// Upsert a payout record.
pub async fn upsert_payout(
    pool: &PgPool,
    campground_id: &str,
    stripe_payout_id: &str,
    stripe_account_id: &str,
    amount_cents: i64,
    fee_cents: i64,
    currency: &str,
    status: &str,
    arrival_date: DateTime<Utc>,
    paid_at: Option<DateTime<Utc>>,
    statement_descriptor: Option<&str>,
) -> Result<String> {
    let id = uuid::Uuid::new_v4().to_string();

    let row: (String,) = sqlx::query_as(
        r#"
        INSERT INTO "Payout" (
            id, "campgroundId", "stripePayoutId", "stripeAccountId",
            "amountCents", "feeCents", currency, status,
            "arrivalDate", "paidAt", "statementDescriptor",
            "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        ON CONFLICT ("stripePayoutId")
        DO UPDATE SET
            status = EXCLUDED.status,
            "paidAt" = EXCLUDED."paidAt",
            "updatedAt" = NOW()
        RETURNING id
        "#
    )
    .bind(&id)
    .bind(campground_id)
    .bind(stripe_payout_id)
    .bind(stripe_account_id)
    .bind(amount_cents as i32)
    .bind(fee_cents as i32)
    .bind(currency)
    .bind(status)
    .bind(arrival_date)
    .bind(paid_at)
    .bind(statement_descriptor)
    .fetch_one(pool)
    .await?;

    Ok(row.0)
}
