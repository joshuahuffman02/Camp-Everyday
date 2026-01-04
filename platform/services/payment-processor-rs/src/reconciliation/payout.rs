//! Payout reconciliation logic.
//!
//! Matches Stripe payouts to internal ledger entries and
//! identifies discrepancies.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::stripe::{BalanceTransaction, Payout, StripeClient};
use crate::error::Result;
use super::ledger::{create_fee_entry, create_payout_entry, DoubleEntry, GlCode};

/// A payout record with its associated transactions.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PayoutRecord {
    /// Payout ID
    pub id: String,
    /// Campground ID
    pub campground_id: String,
    /// Stripe payout ID
    pub stripe_payout_id: String,
    /// Stripe account ID
    pub stripe_account_id: String,
    /// Amount in cents
    pub amount_cents: i64,
    /// Fee in cents
    pub fee_cents: i64,
    /// Currency
    pub currency: String,
    /// Status
    pub status: String,
    /// Arrival date
    pub arrival_date: DateTime<Utc>,
    /// When it was paid
    pub paid_at: Option<DateTime<Utc>>,
    /// Statement descriptor
    pub statement_descriptor: Option<String>,
    /// Associated transactions
    pub lines: Vec<PayoutLine>,
}

/// A line item in a payout.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PayoutLine {
    /// Line ID
    pub id: String,
    /// Payout ID
    pub payout_id: String,
    /// Transaction type
    pub line_type: String,
    /// Amount in cents
    pub amount_cents: i64,
    /// Currency
    pub currency: String,
    /// Description
    pub description: Option<String>,
    /// Related reservation ID
    pub reservation_id: Option<String>,
    /// Payment intent ID
    pub payment_intent_id: Option<String>,
    /// Charge ID
    pub charge_id: Option<String>,
    /// Balance transaction ID
    pub balance_transaction_id: String,
}

/// Service for reconciling payouts.
pub struct PayoutReconciliationService {
    stripe_client: StripeClient,
}

impl PayoutReconciliationService {
    pub fn new(stripe_client: StripeClient) -> Self {
        Self { stripe_client }
    }

    /// Fetch and process a payout with all its transactions.
    pub async fn process_payout(
        &self,
        payout_id: &str,
        campground_id: &str,
        stripe_account_id: &str,
    ) -> Result<(PayoutRecord, Vec<DoubleEntry>)> {
        // Fetch payout details
        let payout = self
            .stripe_client
            .get_payout(payout_id, Some(stripe_account_id))
            .await?;

        // Fetch balance transactions for this payout
        let transactions = self
            .stripe_client
            .list_balance_transactions_for_payout(payout_id, Some(stripe_account_id), Some(100))
            .await?;

        // Process transactions and create ledger entries
        let (lines, entries) = self.process_transactions(
            payout_id,
            campground_id,
            &payout,
            &transactions.data,
        );

        let record = PayoutRecord {
            id: uuid::Uuid::new_v4().to_string(),
            campground_id: campground_id.to_string(),
            stripe_payout_id: payout.id.clone(),
            stripe_account_id: stripe_account_id.to_string(),
            amount_cents: payout.amount,
            fee_cents: 0, // Will be calculated from transactions
            currency: payout.currency.clone(),
            status: payout.status.clone(),
            arrival_date: DateTime::from_timestamp(payout.arrival_date, 0)
                .unwrap_or_else(Utc::now),
            paid_at: if payout.status == "paid" {
                Some(DateTime::from_timestamp(payout.created, 0).unwrap_or_else(Utc::now))
            } else {
                None
            },
            statement_descriptor: payout.statement_descriptor,
            lines,
        };

        Ok((record, entries))
    }

    /// Process balance transactions into payout lines and ledger entries.
    fn process_transactions(
        &self,
        payout_id: &str,
        campground_id: &str,
        payout: &Payout,
        transactions: &[BalanceTransaction],
    ) -> (Vec<PayoutLine>, Vec<DoubleEntry>) {
        let mut lines = Vec::new();
        let mut entries = Vec::new();

        let payout_date = DateTime::from_timestamp(payout.created, 0).unwrap_or_else(Utc::now);

        for txn in transactions {
            let line = PayoutLine {
                id: uuid::Uuid::new_v4().to_string(),
                payout_id: payout_id.to_string(),
                line_type: txn.transaction_type.clone(),
                amount_cents: txn.amount,
                currency: txn.currency.clone(),
                description: txn.description.clone(),
                reservation_id: None, // Would need to be looked up
                payment_intent_id: None,
                charge_id: txn.source.clone(),
                balance_transaction_id: txn.id.clone(),
            };
            lines.push(line);

            // Create ledger entries based on transaction type
            match txn.transaction_type.as_str() {
                "stripe_fee" => {
                    let entry = create_fee_entry(
                        campground_id,
                        GlCode::StripeFees,
                        txn.fee.unsigned_abs() as u32,
                        "Stripe processing fee",
                        &txn.id,
                        payout_date,
                    );
                    entries.push(entry);
                }
                "application_fee" => {
                    let entry = create_fee_entry(
                        campground_id,
                        GlCode::PlatformFee,
                        txn.amount.unsigned_abs() as u32,
                        "Platform fee",
                        &txn.id,
                        payout_date,
                    );
                    entries.push(entry);
                }
                "payout" => {
                    let entry = create_payout_entry(
                        campground_id,
                        txn.amount.unsigned_abs() as u32,
                        &payout.id,
                        payout_date,
                    );
                    entries.push(entry);
                }
                _ => {
                    // Other transaction types (charge, refund, etc.)
                    // These are typically already recorded when they happen
                    tracing::debug!(
                        "Skipping transaction type {} for {}",
                        txn.transaction_type,
                        txn.id
                    );
                }
            }
        }

        (lines, entries)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_payout_line_serialization() {
        let line = PayoutLine {
            id: "line_123".to_string(),
            payout_id: "po_123".to_string(),
            line_type: "payment".to_string(),
            amount_cents: 10000,
            currency: "usd".to_string(),
            description: Some("Payment for reservation".to_string()),
            reservation_id: Some("res_123".to_string()),
            payment_intent_id: Some("pi_123".to_string()),
            charge_id: Some("ch_123".to_string()),
            balance_transaction_id: "txn_123".to_string(),
        };

        let json = serde_json::to_string(&line).unwrap();
        assert!(json.contains("line_123"));
    }
}
