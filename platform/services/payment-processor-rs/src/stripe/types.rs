//! Stripe API types.

use serde::{Deserialize, Serialize};

/// Currency codes supported by Stripe.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Currency {
    Usd,
    Eur,
    Gbp,
    Cad,
    Aud,
}

impl Default for Currency {
    fn default() -> Self {
        Currency::Usd
    }
}

impl std::fmt::Display for Currency {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Currency::Usd => write!(f, "usd"),
            Currency::Eur => write!(f, "eur"),
            Currency::Gbp => write!(f, "gbp"),
            Currency::Cad => write!(f, "cad"),
            Currency::Aud => write!(f, "aud"),
        }
    }
}

/// Payment intent status.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum PaymentIntentStatus {
    RequiresPaymentMethod,
    RequiresConfirmation,
    RequiresAction,
    Processing,
    RequiresCapture,
    Canceled,
    Succeeded,
}

/// Stripe PaymentIntent object.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentIntent {
    pub id: String,
    pub object: String,
    pub amount: u64,
    pub amount_capturable: Option<u64>,
    pub amount_received: Option<u64>,
    pub application_fee_amount: Option<u64>,
    pub capture_method: Option<String>,
    pub client_secret: Option<String>,
    pub currency: String,
    pub customer: Option<String>,
    pub description: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub payment_method: Option<String>,
    pub payment_method_types: Vec<String>,
    pub status: PaymentIntentStatus,
    pub transfer_data: Option<TransferData>,
    pub latest_charge: Option<String>,
}

/// Transfer data for connected accounts.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferData {
    pub destination: String,
}

/// Stripe Charge object.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Charge {
    pub id: String,
    pub object: String,
    pub amount: u64,
    pub amount_refunded: u64,
    pub balance_transaction: Option<String>,
    pub captured: bool,
    pub currency: String,
    pub customer: Option<String>,
    pub description: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub payment_intent: Option<String>,
    pub payment_method: Option<String>,
    pub receipt_url: Option<String>,
    pub refunded: bool,
    pub status: String,
}

/// Stripe Refund object.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Refund {
    pub id: String,
    pub object: String,
    pub amount: u64,
    pub charge: Option<String>,
    pub currency: String,
    pub payment_intent: Option<String>,
    pub reason: Option<String>,
    pub status: String,
    pub balance_transaction: Option<String>,
}

/// Stripe Balance Transaction object.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BalanceTransaction {
    pub id: String,
    pub object: String,
    pub amount: i64,
    pub available_on: i64,
    pub created: i64,
    pub currency: String,
    pub description: Option<String>,
    pub fee: i64,
    pub fee_details: Vec<FeeDetail>,
    pub net: i64,
    pub source: Option<String>,
    #[serde(rename = "type")]
    pub transaction_type: String,
}

/// Fee detail within a balance transaction.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeeDetail {
    pub amount: i64,
    pub application: Option<String>,
    pub currency: String,
    pub description: Option<String>,
    #[serde(rename = "type")]
    pub fee_type: String,
}

/// Stripe Payout object.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Payout {
    pub id: String,
    pub object: String,
    pub amount: i64,
    pub arrival_date: i64,
    pub balance_transaction: Option<String>,
    pub created: i64,
    pub currency: String,
    pub description: Option<String>,
    pub destination: Option<String>,
    pub failure_code: Option<String>,
    pub failure_message: Option<String>,
    pub method: String,
    pub status: String,
    pub statement_descriptor: Option<String>,
}

/// Stripe Dispute object.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Dispute {
    pub id: String,
    pub object: String,
    pub amount: u64,
    pub charge: String,
    pub currency: String,
    pub evidence_details: Option<EvidenceDetails>,
    pub payment_intent: Option<String>,
    pub reason: String,
    pub status: String,
}

/// Evidence details for a dispute.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvidenceDetails {
    pub due_by: Option<i64>,
    pub has_evidence: bool,
    pub past_due: bool,
    pub submission_count: u32,
}

/// Request to create a payment intent.
#[derive(Debug, Clone, Serialize)]
pub struct CreatePaymentIntentRequest {
    pub amount: u64,
    pub currency: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub customer: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payment_method: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payment_method_types: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub capture_method: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confirm: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub application_fee_amount: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transfer_data: Option<TransferDataRequest>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub on_behalf_of: Option<String>,
}

/// Transfer data for payment intent creation.
#[derive(Debug, Clone, Serialize)]
pub struct TransferDataRequest {
    pub destination: String,
}

/// Request to capture a payment intent.
#[derive(Debug, Clone, Serialize)]
pub struct CapturePaymentIntentRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub amount_to_capture: Option<u64>,
}

/// Request to create a refund.
#[derive(Debug, Clone, Serialize)]
pub struct CreateRefundRequest {
    pub payment_intent: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub amount: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

/// Stripe API error response.
#[derive(Debug, Clone, Deserialize)]
pub struct StripeApiError {
    pub error: StripeErrorBody,
}

/// Stripe error body.
#[derive(Debug, Clone, Deserialize)]
pub struct StripeErrorBody {
    pub code: Option<String>,
    pub decline_code: Option<String>,
    pub message: String,
    #[serde(rename = "type")]
    pub error_type: String,
}

/// List response wrapper.
#[derive(Debug, Clone, Deserialize)]
pub struct ListResponse<T> {
    pub object: String,
    pub data: Vec<T>,
    pub has_more: bool,
    pub url: String,
}
