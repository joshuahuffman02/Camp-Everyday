//! Payment intent operations.

use crate::error::Result;
use super::client::StripeClient;
use super::types::*;

/// High-level payment operations.
pub struct PaymentService {
    client: StripeClient,
}

impl PaymentService {
    pub fn new(client: StripeClient) -> Self {
        Self { client }
    }

    /// Create a payment intent with platform fee for a connected account.
    pub async fn create_payment_intent_for_connected_account(
        &self,
        amount_cents: u64,
        currency: Currency,
        connected_account_id: &str,
        platform_fee_cents: u64,
        customer_id: Option<&str>,
        payment_method_id: Option<&str>,
        description: Option<&str>,
        metadata: Option<serde_json::Value>,
        capture_method: Option<&str>,
        idempotency_key: Option<&str>,
    ) -> Result<PaymentIntent> {
        let request = CreatePaymentIntentRequest {
            amount: amount_cents,
            currency: currency.to_string(),
            customer: customer_id.map(String::from),
            payment_method: payment_method_id.map(String::from),
            payment_method_types: Some(vec!["card".to_string()]),
            capture_method: capture_method.map(String::from),
            confirm: None,
            description: description.map(String::from),
            metadata,
            application_fee_amount: Some(platform_fee_cents),
            transfer_data: Some(TransferDataRequest {
                destination: connected_account_id.to_string(),
            }),
            on_behalf_of: Some(connected_account_id.to_string()),
        };

        self.client
            .create_payment_intent(&request, None, idempotency_key)
            .await
    }

    /// Capture a previously authorized payment intent.
    pub async fn capture_payment_intent(
        &self,
        payment_intent_id: &str,
        amount_to_capture: Option<u64>,
        connected_account_id: Option<&str>,
    ) -> Result<PaymentIntent> {
        self.client
            .capture_payment_intent(payment_intent_id, amount_to_capture, connected_account_id)
            .await
    }

    /// Cancel a payment intent.
    pub async fn cancel_payment_intent(
        &self,
        payment_intent_id: &str,
        connected_account_id: Option<&str>,
    ) -> Result<PaymentIntent> {
        self.client
            .cancel_payment_intent(payment_intent_id, connected_account_id)
            .await
    }

    /// Retrieve a payment intent.
    pub async fn get_payment_intent(
        &self,
        payment_intent_id: &str,
        connected_account_id: Option<&str>,
    ) -> Result<PaymentIntent> {
        self.client
            .get_payment_intent(payment_intent_id, connected_account_id)
            .await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_currency_display() {
        assert_eq!(Currency::Usd.to_string(), "usd");
        assert_eq!(Currency::Eur.to_string(), "eur");
    }
}
