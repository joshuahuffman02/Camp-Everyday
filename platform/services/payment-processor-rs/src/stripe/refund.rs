//! Refund operations.

use crate::error::Result;
use super::client::StripeClient;
use super::types::*;

/// High-level refund operations.
pub struct RefundService {
    client: StripeClient,
}

impl RefundService {
    pub fn new(client: StripeClient) -> Self {
        Self { client }
    }

    /// Create a full or partial refund for a payment intent.
    pub async fn create_refund(
        &self,
        payment_intent_id: &str,
        amount_cents: Option<u64>,
        reason: Option<&str>,
        metadata: Option<serde_json::Value>,
        connected_account_id: Option<&str>,
        idempotency_key: Option<&str>,
    ) -> Result<Refund> {
        let request = CreateRefundRequest {
            payment_intent: payment_intent_id.to_string(),
            amount: amount_cents,
            reason: reason.map(String::from),
            metadata,
        };

        self.client
            .create_refund(&request, connected_account_id, idempotency_key)
            .await
    }

    /// Validate that a refund amount is valid for the payment.
    pub fn validate_refund_amount(
        original_amount_cents: u64,
        already_refunded_cents: u64,
        requested_refund_cents: u64,
    ) -> Result<()> {
        let refundable = original_amount_cents.saturating_sub(already_refunded_cents);

        if requested_refund_cents > refundable {
            return Err(crate::error::AppError::Validation(format!(
                "Requested refund {} exceeds refundable amount {}",
                requested_refund_cents, refundable
            )));
        }

        if requested_refund_cents == 0 {
            return Err(crate::error::AppError::Validation(
                "Refund amount must be greater than 0".to_string(),
            ));
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_refund_amount_full() {
        let result = RefundService::validate_refund_amount(10000, 0, 10000);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_refund_amount_partial() {
        let result = RefundService::validate_refund_amount(10000, 0, 5000);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_refund_amount_exceeds() {
        let result = RefundService::validate_refund_amount(10000, 5000, 6000);
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_refund_amount_zero() {
        let result = RefundService::validate_refund_amount(10000, 0, 0);
        assert!(result.is_err());
    }
}
