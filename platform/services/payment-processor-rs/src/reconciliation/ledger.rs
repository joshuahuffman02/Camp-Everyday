//! Double-entry ledger operations.
//!
//! Implements double-entry accounting for financial transactions.
//! Every financial event creates balanced debit and credit entries.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};

/// GL (General Ledger) codes for accounting.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum GlCode {
    /// Cash account (money received)
    Cash,
    /// Bank account (money in bank)
    Bank,
    /// Revenue from reservations
    Revenue,
    /// Stripe processing fees
    StripeFees,
    /// Platform fees
    PlatformFee,
    /// Chargebacks/disputes
    Chargebacks,
    /// Refunds issued
    Refunds,
    /// Accounts receivable
    AccountsReceivable,
    /// Deposits held
    Deposits,
}

impl std::fmt::Display for GlCode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            GlCode::Cash => write!(f, "CASH"),
            GlCode::Bank => write!(f, "BANK"),
            GlCode::Revenue => write!(f, "REVENUE"),
            GlCode::StripeFees => write!(f, "STRIPE_FEES"),
            GlCode::PlatformFee => write!(f, "PLATFORM_FEE"),
            GlCode::Chargebacks => write!(f, "CHARGEBACKS"),
            GlCode::Refunds => write!(f, "REFUNDS"),
            GlCode::AccountsReceivable => write!(f, "ACCOUNTS_RECEIVABLE"),
            GlCode::Deposits => write!(f, "DEPOSITS"),
        }
    }
}

/// Direction of a ledger entry.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum EntryDirection {
    Debit,
    Credit,
}

/// Source type for the ledger entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SourceType {
    Payment,
    Refund,
    Payout,
    Dispute,
    Fee,
    Adjustment,
}

/// A single ledger entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LedgerEntry {
    /// Unique entry ID
    pub id: String,
    /// Campground ID (tenant isolation)
    pub campground_id: String,
    /// Reservation ID (if applicable)
    pub reservation_id: Option<String>,
    /// Accounting period ID (optional)
    pub period_id: Option<String>,
    /// GL code
    pub gl_code: GlCode,
    /// Account name
    pub account: String,
    /// Description of the entry
    pub description: String,
    /// Amount in cents (always positive)
    pub amount_cents: u32,
    /// Debit or credit
    pub direction: EntryDirection,
    /// When the transaction occurred
    pub occurred_at: DateTime<Utc>,
    /// External reference (e.g., Stripe transaction ID)
    pub external_ref: Option<String>,
    /// Deduplication key
    pub dedupe_key: String,
    /// Source type
    pub source_type: SourceType,
    /// Source transaction ID
    pub source_tx_id: Option<String>,
    /// Source timestamp
    pub source_ts: Option<DateTime<Utc>>,
    /// Hash for integrity verification
    pub hash: String,
    /// Whether this is an adjustment entry
    pub adjustment: bool,
}

/// A balanced double-entry transaction.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DoubleEntry {
    /// Debit entry
    pub debit: LedgerEntry,
    /// Credit entry
    pub credit: LedgerEntry,
}

impl DoubleEntry {
    /// Validate that the double entry is balanced.
    pub fn is_balanced(&self) -> bool {
        self.debit.amount_cents == self.credit.amount_cents
            && self.debit.direction == EntryDirection::Debit
            && self.credit.direction == EntryDirection::Credit
    }
}

/// Create a balanced double entry for a fee.
pub fn create_fee_entry(
    campground_id: &str,
    fee_type: GlCode,
    amount_cents: u32,
    description: &str,
    external_ref: &str,
    occurred_at: DateTime<Utc>,
) -> DoubleEntry {
    let dedupe_key = format!("fee:{}:{}:{}", campground_id, external_ref, fee_type);
    let base_id = uuid::Uuid::new_v4().to_string();

    let debit = LedgerEntry {
        id: format!("{}-debit", base_id),
        campground_id: campground_id.to_string(),
        reservation_id: None,
        period_id: None,
        gl_code: fee_type,
        account: format!("{}_EXPENSE", fee_type),
        description: description.to_string(),
        amount_cents,
        direction: EntryDirection::Debit,
        occurred_at,
        external_ref: Some(external_ref.to_string()),
        dedupe_key: format!("{}-debit", dedupe_key),
        source_type: SourceType::Fee,
        source_tx_id: Some(external_ref.to_string()),
        source_ts: Some(occurred_at),
        hash: compute_entry_hash(&dedupe_key, amount_cents, EntryDirection::Debit),
        adjustment: false,
    };

    let credit = LedgerEntry {
        id: format!("{}-credit", base_id),
        campground_id: campground_id.to_string(),
        reservation_id: None,
        period_id: None,
        gl_code: GlCode::Cash,
        account: "CASH".to_string(),
        description: format!("Payment for: {}", description),
        amount_cents,
        direction: EntryDirection::Credit,
        occurred_at,
        external_ref: Some(external_ref.to_string()),
        dedupe_key: format!("{}-credit", dedupe_key),
        source_type: SourceType::Fee,
        source_tx_id: Some(external_ref.to_string()),
        source_ts: Some(occurred_at),
        hash: compute_entry_hash(&dedupe_key, amount_cents, EntryDirection::Credit),
        adjustment: false,
    };

    DoubleEntry { debit, credit }
}

/// Create a balanced double entry for a payout.
pub fn create_payout_entry(
    campground_id: &str,
    amount_cents: u32,
    payout_id: &str,
    occurred_at: DateTime<Utc>,
) -> DoubleEntry {
    let dedupe_key = format!("payout:{}:{}", campground_id, payout_id);
    let base_id = uuid::Uuid::new_v4().to_string();

    let debit = LedgerEntry {
        id: format!("{}-debit", base_id),
        campground_id: campground_id.to_string(),
        reservation_id: None,
        period_id: None,
        gl_code: GlCode::Bank,
        account: "BANK".to_string(),
        description: format!("Payout {}", payout_id),
        amount_cents,
        direction: EntryDirection::Debit,
        occurred_at,
        external_ref: Some(payout_id.to_string()),
        dedupe_key: format!("{}-debit", dedupe_key),
        source_type: SourceType::Payout,
        source_tx_id: Some(payout_id.to_string()),
        source_ts: Some(occurred_at),
        hash: compute_entry_hash(&dedupe_key, amount_cents, EntryDirection::Debit),
        adjustment: false,
    };

    let credit = LedgerEntry {
        id: format!("{}-credit", base_id),
        campground_id: campground_id.to_string(),
        reservation_id: None,
        period_id: None,
        gl_code: GlCode::Cash,
        account: "CASH".to_string(),
        description: format!("Transfer to bank for payout {}", payout_id),
        amount_cents,
        direction: EntryDirection::Credit,
        occurred_at,
        external_ref: Some(payout_id.to_string()),
        dedupe_key: format!("{}-credit", dedupe_key),
        source_type: SourceType::Payout,
        source_tx_id: Some(payout_id.to_string()),
        source_ts: Some(occurred_at),
        hash: compute_entry_hash(&dedupe_key, amount_cents, EntryDirection::Credit),
        adjustment: false,
    };

    DoubleEntry { debit, credit }
}

/// Create a balanced double entry for a chargeback.
pub fn create_chargeback_entry(
    campground_id: &str,
    reservation_id: Option<&str>,
    amount_cents: u32,
    dispute_id: &str,
    occurred_at: DateTime<Utc>,
) -> DoubleEntry {
    let dedupe_key = format!("chargeback:{}:{}", campground_id, dispute_id);
    let base_id = uuid::Uuid::new_v4().to_string();

    let debit = LedgerEntry {
        id: format!("{}-debit", base_id),
        campground_id: campground_id.to_string(),
        reservation_id: reservation_id.map(String::from),
        period_id: None,
        gl_code: GlCode::Chargebacks,
        account: "CHARGEBACKS".to_string(),
        description: format!("Chargeback {}", dispute_id),
        amount_cents,
        direction: EntryDirection::Debit,
        occurred_at,
        external_ref: Some(dispute_id.to_string()),
        dedupe_key: format!("{}-debit", dedupe_key),
        source_type: SourceType::Dispute,
        source_tx_id: Some(dispute_id.to_string()),
        source_ts: Some(occurred_at),
        hash: compute_entry_hash(&dedupe_key, amount_cents, EntryDirection::Debit),
        adjustment: false,
    };

    let credit = LedgerEntry {
        id: format!("{}-credit", base_id),
        campground_id: campground_id.to_string(),
        reservation_id: reservation_id.map(String::from),
        period_id: None,
        gl_code: GlCode::Cash,
        account: "CASH".to_string(),
        description: format!("Deduction for chargeback {}", dispute_id),
        amount_cents,
        direction: EntryDirection::Credit,
        occurred_at,
        external_ref: Some(dispute_id.to_string()),
        dedupe_key: format!("{}-credit", dedupe_key),
        source_type: SourceType::Dispute,
        source_tx_id: Some(dispute_id.to_string()),
        source_ts: Some(occurred_at),
        hash: compute_entry_hash(&dedupe_key, amount_cents, EntryDirection::Credit),
        adjustment: false,
    };

    DoubleEntry { debit, credit }
}

/// Compute a hash for a ledger entry for integrity verification.
fn compute_entry_hash(dedupe_key: &str, amount_cents: u32, direction: EntryDirection) -> String {
    let input = format!(
        "{}:{}:{}",
        dedupe_key,
        amount_cents,
        match direction {
            EntryDirection::Debit => "debit",
            EntryDirection::Credit => "credit",
        }
    );

    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    hex::encode(hasher.finalize())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_fee_entry_is_balanced() {
        let entry = create_fee_entry(
            "camp_123",
            GlCode::StripeFees,
            320,
            "Stripe processing fee",
            "txn_123",
            Utc::now(),
        );

        assert!(entry.is_balanced());
        assert_eq!(entry.debit.amount_cents, 320);
        assert_eq!(entry.credit.amount_cents, 320);
    }

    #[test]
    fn test_create_payout_entry_is_balanced() {
        let entry = create_payout_entry("camp_123", 100000, "po_123", Utc::now());

        assert!(entry.is_balanced());
        assert_eq!(entry.debit.gl_code, GlCode::Bank);
        assert_eq!(entry.credit.gl_code, GlCode::Cash);
    }

    #[test]
    fn test_create_chargeback_entry_is_balanced() {
        let entry = create_chargeback_entry(
            "camp_123",
            Some("res_123"),
            5000,
            "dp_123",
            Utc::now(),
        );

        assert!(entry.is_balanced());
        assert_eq!(entry.debit.gl_code, GlCode::Chargebacks);
    }
}
