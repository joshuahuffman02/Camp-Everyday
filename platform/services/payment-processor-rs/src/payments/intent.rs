//! Payment intent orchestration.

use crate::error::Result;
use crate::stripe::{PaymentIntent, StripeClient, CreatePaymentIntentRequest, TransferDataRequest};
use super::fees::{calculate_fees, FeeConfig};
use super::validation::CreatePaymentIntentDto;

/// Orchestrates payment intent creation with fee calculation.
pub struct PaymentIntentService {
    stripe_client: StripeClient,
    default_fee_config: FeeConfig,
}

impl PaymentIntentService {
    pub fn new(stripe_client: StripeClient, default_fee_config: FeeConfig) -> Self {
        Self {
            stripe_client,
            default_fee_config,
        }
    }

    /// Create a payment intent with automatic fee calculation.
    pub async fn create_payment_intent(
        &self,
        dto: &CreatePaymentIntentDto,
        fee_config: Option<&FeeConfig>,
    ) -> Result<PaymentIntent> {
        let config = fee_config.unwrap_or(&self.default_fee_config);

        // Calculate fees
        let fee_calculation = calculate_fees(dto.amount_cents as u32, config);

        // Build metadata
        let mut metadata = serde_json::json!({
            "campground_id": dto.campground_id,
            "base_amount_cents": fee_calculation.base_amount_cents,
            "platform_fee_cents": fee_calculation.platform_fee_cents,
            "gateway_fee_cents": fee_calculation.gateway_fee_cents,
        });

        if let Some(ref res_id) = dto.reservation_id {
            metadata["reservation_id"] = serde_json::Value::String(res_id.clone());
        }

        // Create the request
        let request = CreatePaymentIntentRequest {
            amount: fee_calculation.charge_amount_cents as u64,
            currency: dto.currency.to_lowercase(),
            customer: dto.customer_id.clone(),
            payment_method: dto.payment_method_id.clone(),
            payment_method_types: Some(vec!["card".to_string()]),
            capture_method: dto.capture_method.clone(),
            confirm: None,
            description: dto.description.clone(),
            metadata: Some(metadata),
            application_fee_amount: Some(fee_calculation.application_fee_cents as u64),
            transfer_data: Some(TransferDataRequest {
                destination: dto.connected_account_id.clone(),
            }),
            on_behalf_of: Some(dto.connected_account_id.clone()),
        };

        self.stripe_client
            .create_payment_intent(&request, None, dto.idempotency_key.as_deref())
            .await
    }

    /// Capture a previously authorized payment intent.
    pub async fn capture_payment_intent(
        &self,
        payment_intent_id: &str,
        amount_to_capture: Option<u64>,
        connected_account_id: Option<&str>,
    ) -> Result<PaymentIntent> {
        self.stripe_client
            .capture_payment_intent(
                payment_intent_id,
                amount_to_capture,
                connected_account_id,
            )
            .await
    }

    /// Get a payment intent.
    pub async fn get_payment_intent(
        &self,
        payment_intent_id: &str,
        connected_account_id: Option<&str>,
    ) -> Result<PaymentIntent> {
        self.stripe_client
            .get_payment_intent(payment_intent_id, connected_account_id)
            .await
    }

    /// Cancel a payment intent.
    pub async fn cancel_payment_intent(
        &self,
        payment_intent_id: &str,
        connected_account_id: Option<&str>,
    ) -> Result<PaymentIntent> {
        self.stripe_client
            .cancel_payment_intent(payment_intent_id, connected_account_id)
            .await
    }
}
