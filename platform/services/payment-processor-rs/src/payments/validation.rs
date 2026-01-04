//! Payment request validation.

use serde::{Deserialize, Serialize};
use validator::Validate;

use crate::error::{AppError, Result};

/// Maximum payment amount: $1,000,000 (100_000_000 cents)
pub const MAX_PAYMENT_AMOUNT_CENTS: u64 = 100_000_000;

/// Minimum payment amount: $0.50 (50 cents) - Stripe minimum
pub const MIN_PAYMENT_AMOUNT_CENTS: u64 = 50;

/// Request to create a payment intent.
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreatePaymentIntentDto {
    /// Amount in cents (must be positive and within limits)
    #[validate(range(min = 50, max = 100000000))]
    pub amount_cents: u64,

    /// Currency code (lowercase, e.g., "usd")
    #[validate(length(equal = 3))]
    pub currency: String,

    /// Connected account ID (Stripe account for the campground)
    #[validate(length(min = 1))]
    pub connected_account_id: String,

    /// Campground ID for metadata
    #[validate(length(min = 1))]
    pub campground_id: String,

    /// Reservation ID for metadata (optional)
    pub reservation_id: Option<String>,

    /// Customer ID (optional, for saved payment methods)
    pub customer_id: Option<String>,

    /// Payment method ID (optional, for saved cards)
    pub payment_method_id: Option<String>,

    /// Description for the payment
    pub description: Option<String>,

    /// Capture method: "automatic" or "manual"
    #[validate(custom(function = "validate_capture_method"))]
    pub capture_method: Option<String>,

    /// Idempotency key for preventing duplicate payments
    pub idempotency_key: Option<String>,
}

fn validate_capture_method(value: &str) -> std::result::Result<(), validator::ValidationError> {
    match value {
        "automatic" | "manual" => Ok(()),
        _ => Err(validator::ValidationError::new("invalid_capture_method")),
    }
}

/// Request to capture a payment intent.
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CapturePaymentIntentDto {
    /// Payment intent ID to capture
    #[validate(length(min = 1))]
    pub payment_intent_id: String,

    /// Amount to capture in cents (optional, for partial capture)
    #[validate(range(min = 1, max = 100000000))]
    pub amount_to_capture: Option<u64>,

    /// Connected account ID
    pub connected_account_id: Option<String>,
}

/// Request to create a refund.
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreateRefundDto {
    /// Payment intent ID to refund
    #[validate(length(min = 1))]
    pub payment_intent_id: String,

    /// Amount to refund in cents (optional, for partial refund)
    #[validate(range(min = 1, max = 100000000))]
    pub amount_cents: Option<u64>,

    /// Reason for refund
    #[validate(custom(function = "validate_refund_reason"))]
    pub reason: Option<String>,

    /// Connected account ID
    pub connected_account_id: Option<String>,

    /// Idempotency key
    pub idempotency_key: Option<String>,
}

fn validate_refund_reason(value: &str) -> std::result::Result<(), validator::ValidationError> {
    match value {
        "duplicate" | "fraudulent" | "requested_by_customer" => Ok(()),
        _ => Err(validator::ValidationError::new("invalid_refund_reason")),
    }
}

/// Response from creating a payment intent.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentIntentResponse {
    pub id: String,
    pub client_secret: String,
    pub status: String,
    pub amount_cents: u64,
    pub currency: String,
}

/// Response from capturing a payment intent.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureResponse {
    pub id: String,
    pub status: String,
    pub amount_captured: u64,
    pub receipt_url: Option<String>,
}

/// Response from creating a refund.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefundResponse {
    pub id: String,
    pub status: String,
    pub amount_cents: u64,
}

/// Validate a create payment intent request.
pub fn validate_create_payment_intent(dto: &CreatePaymentIntentDto) -> Result<()> {
    use validator::Validate;

    dto.validate().map_err(|e| {
        AppError::Validation(format!("Invalid payment intent request: {}", e))
    })?;

    // Additional business rules
    if dto.amount_cents < MIN_PAYMENT_AMOUNT_CENTS {
        return Err(AppError::Validation(format!(
            "Amount must be at least {} cents",
            MIN_PAYMENT_AMOUNT_CENTS
        )));
    }

    if dto.amount_cents > MAX_PAYMENT_AMOUNT_CENTS {
        return Err(AppError::Validation(format!(
            "Amount cannot exceed {} cents",
            MAX_PAYMENT_AMOUNT_CENTS
        )));
    }

    // Validate currency
    let valid_currencies = ["usd", "eur", "gbp", "cad", "aud"];
    if !valid_currencies.contains(&dto.currency.to_lowercase().as_str()) {
        return Err(AppError::Validation(format!(
            "Unsupported currency: {}",
            dto.currency
        )));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_create_payment_intent_valid() {
        let dto = CreatePaymentIntentDto {
            amount_cents: 10000,
            currency: "usd".to_string(),
            connected_account_id: "acct_123".to_string(),
            campground_id: "camp_123".to_string(),
            reservation_id: None,
            customer_id: None,
            payment_method_id: None,
            description: None,
            capture_method: None,
            idempotency_key: None,
        };

        assert!(validate_create_payment_intent(&dto).is_ok());
    }

    #[test]
    fn test_validate_create_payment_intent_amount_too_low() {
        let dto = CreatePaymentIntentDto {
            amount_cents: 10, // Too low
            currency: "usd".to_string(),
            connected_account_id: "acct_123".to_string(),
            campground_id: "camp_123".to_string(),
            reservation_id: None,
            customer_id: None,
            payment_method_id: None,
            description: None,
            capture_method: None,
            idempotency_key: None,
        };

        assert!(validate_create_payment_intent(&dto).is_err());
    }

    #[test]
    fn test_validate_create_payment_intent_invalid_currency() {
        let dto = CreatePaymentIntentDto {
            amount_cents: 10000,
            currency: "xyz".to_string(), // Invalid
            connected_account_id: "acct_123".to_string(),
            campground_id: "camp_123".to_string(),
            reservation_id: None,
            customer_id: None,
            payment_method_id: None,
            description: None,
            capture_method: None,
            idempotency_key: None,
        };

        assert!(validate_create_payment_intent(&dto).is_err());
    }
}
