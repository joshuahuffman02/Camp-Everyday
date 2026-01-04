//! Stripe API client.

use reqwest::Client;
use serde::de::DeserializeOwned;
use std::collections::HashMap;

use crate::error::{AppError, Result, StripeError};
use super::types::*;

const STRIPE_API_BASE: &str = "https://api.stripe.com/v1";

/// Stripe API client for making authenticated requests.
#[derive(Clone)]
pub struct StripeClient {
    client: Client,
    secret_key: String,
}

impl StripeClient {
    /// Create a new Stripe client with the given secret key.
    pub fn new(secret_key: String) -> Self {
        Self {
            client: Client::new(),
            secret_key,
        }
    }

    /// Make a POST request to the Stripe API.
    async fn post<T: DeserializeOwned>(
        &self,
        path: &str,
        params: &HashMap<String, String>,
        stripe_account: Option<&str>,
    ) -> Result<T> {
        let url = format!("{}{}", STRIPE_API_BASE, path);

        let mut request = self
            .client
            .post(&url)
            .basic_auth(&self.secret_key, None::<&str>)
            .form(params);

        if let Some(account) = stripe_account {
            request = request.header("Stripe-Account", account);
        }

        let response = request.send().await?;
        self.handle_response(response).await
    }

    /// Make a GET request to the Stripe API.
    async fn get<T: DeserializeOwned>(
        &self,
        path: &str,
        params: &HashMap<String, String>,
        stripe_account: Option<&str>,
    ) -> Result<T> {
        let url = format!("{}{}", STRIPE_API_BASE, path);

        let mut request = self
            .client
            .get(&url)
            .basic_auth(&self.secret_key, None::<&str>)
            .query(params);

        if let Some(account) = stripe_account {
            request = request.header("Stripe-Account", account);
        }

        let response = request.send().await?;
        self.handle_response(response).await
    }

    /// Handle the API response, parsing errors if present.
    async fn handle_response<T: DeserializeOwned>(
        &self,
        response: reqwest::Response,
    ) -> Result<T> {
        let status = response.status();
        let body = response.text().await?;

        if status.is_success() {
            serde_json::from_str(&body).map_err(|e| {
                tracing::error!("Failed to parse Stripe response: {}", e);
                AppError::Internal(format!("Failed to parse Stripe response: {}", e))
            })
        } else {
            let error: StripeApiError = serde_json::from_str(&body).map_err(|e| {
                tracing::error!("Failed to parse Stripe error: {} - Body: {}", e, body);
                AppError::Internal(format!("Stripe API error: {}", status))
            })?;

            Err(AppError::Stripe(StripeError {
                code: error.error.code.unwrap_or_else(|| "unknown".to_string()),
                message: error.error.message,
                decline_code: error.error.decline_code,
            }))
        }
    }

    /// Create a payment intent.
    pub async fn create_payment_intent(
        &self,
        request: &CreatePaymentIntentRequest,
        stripe_account: Option<&str>,
        idempotency_key: Option<&str>,
    ) -> Result<PaymentIntent> {
        let mut params = HashMap::new();
        params.insert("amount".to_string(), request.amount.to_string());
        params.insert("currency".to_string(), request.currency.clone());

        if let Some(ref customer) = request.customer {
            params.insert("customer".to_string(), customer.clone());
        }
        if let Some(ref pm) = request.payment_method {
            params.insert("payment_method".to_string(), pm.clone());
        }
        if let Some(ref pmt) = request.payment_method_types {
            for (i, t) in pmt.iter().enumerate() {
                params.insert(format!("payment_method_types[{}]", i), t.clone());
            }
        }
        if let Some(ref cm) = request.capture_method {
            params.insert("capture_method".to_string(), cm.clone());
        }
        if let Some(confirm) = request.confirm {
            params.insert("confirm".to_string(), confirm.to_string());
        }
        if let Some(ref desc) = request.description {
            params.insert("description".to_string(), desc.clone());
        }
        if let Some(ref metadata) = request.metadata {
            if let Some(obj) = metadata.as_object() {
                for (k, v) in obj {
                    if let Some(s) = v.as_str() {
                        params.insert(format!("metadata[{}]", k), s.to_string());
                    }
                }
            }
        }
        if let Some(fee) = request.application_fee_amount {
            params.insert("application_fee_amount".to_string(), fee.to_string());
        }
        if let Some(ref td) = request.transfer_data {
            params.insert("transfer_data[destination]".to_string(), td.destination.clone());
        }
        if let Some(ref obo) = request.on_behalf_of {
            params.insert("on_behalf_of".to_string(), obo.clone());
        }

        if let Some(key) = idempotency_key {
            params.insert("idempotency_key".to_string(), key.to_string());
        }

        self.post("/payment_intents", &params, stripe_account).await
    }

    /// Retrieve a payment intent.
    pub async fn get_payment_intent(
        &self,
        payment_intent_id: &str,
        stripe_account: Option<&str>,
    ) -> Result<PaymentIntent> {
        let path = format!("/payment_intents/{}", payment_intent_id);
        self.get(&path, &HashMap::new(), stripe_account).await
    }

    /// Capture a payment intent.
    pub async fn capture_payment_intent(
        &self,
        payment_intent_id: &str,
        amount_to_capture: Option<u64>,
        stripe_account: Option<&str>,
    ) -> Result<PaymentIntent> {
        let path = format!("/payment_intents/{}/capture", payment_intent_id);
        let mut params = HashMap::new();

        if let Some(amount) = amount_to_capture {
            params.insert("amount_to_capture".to_string(), amount.to_string());
        }

        self.post(&path, &params, stripe_account).await
    }

    /// Cancel a payment intent.
    pub async fn cancel_payment_intent(
        &self,
        payment_intent_id: &str,
        stripe_account: Option<&str>,
    ) -> Result<PaymentIntent> {
        let path = format!("/payment_intents/{}/cancel", payment_intent_id);
        self.post(&path, &HashMap::new(), stripe_account).await
    }

    /// Create a refund.
    pub async fn create_refund(
        &self,
        request: &CreateRefundRequest,
        stripe_account: Option<&str>,
        idempotency_key: Option<&str>,
    ) -> Result<Refund> {
        let mut params = HashMap::new();
        params.insert("payment_intent".to_string(), request.payment_intent.clone());

        if let Some(amount) = request.amount {
            params.insert("amount".to_string(), amount.to_string());
        }
        if let Some(ref reason) = request.reason {
            params.insert("reason".to_string(), reason.clone());
        }
        if let Some(ref metadata) = request.metadata {
            if let Some(obj) = metadata.as_object() {
                for (k, v) in obj {
                    if let Some(s) = v.as_str() {
                        params.insert(format!("metadata[{}]", k), s.to_string());
                    }
                }
            }
        }
        if let Some(key) = idempotency_key {
            params.insert("idempotency_key".to_string(), key.to_string());
        }

        self.post("/refunds", &params, stripe_account).await
    }

    /// Retrieve a charge.
    pub async fn get_charge(
        &self,
        charge_id: &str,
        stripe_account: Option<&str>,
    ) -> Result<Charge> {
        let path = format!("/charges/{}", charge_id);
        self.get(&path, &HashMap::new(), stripe_account).await
    }

    /// List balance transactions for a payout.
    pub async fn list_balance_transactions_for_payout(
        &self,
        payout_id: &str,
        stripe_account: Option<&str>,
        limit: Option<u32>,
    ) -> Result<ListResponse<BalanceTransaction>> {
        let mut params = HashMap::new();
        params.insert("payout".to_string(), payout_id.to_string());
        params.insert("limit".to_string(), limit.unwrap_or(100).to_string());

        self.get("/balance_transactions", &params, stripe_account).await
    }

    /// Retrieve a payout.
    pub async fn get_payout(
        &self,
        payout_id: &str,
        stripe_account: Option<&str>,
    ) -> Result<Payout> {
        let path = format!("/payouts/{}", payout_id);
        self.get(&path, &HashMap::new(), stripe_account).await
    }

    /// List payouts.
    pub async fn list_payouts(
        &self,
        stripe_account: Option<&str>,
        limit: Option<u32>,
        starting_after: Option<&str>,
    ) -> Result<ListResponse<Payout>> {
        let mut params = HashMap::new();
        params.insert("limit".to_string(), limit.unwrap_or(10).to_string());

        if let Some(sa) = starting_after {
            params.insert("starting_after".to_string(), sa.to_string());
        }

        self.get("/payouts", &params, stripe_account).await
    }

    /// Retrieve a dispute.
    pub async fn get_dispute(
        &self,
        dispute_id: &str,
        stripe_account: Option<&str>,
    ) -> Result<Dispute> {
        let path = format!("/disputes/{}", dispute_id);
        self.get(&path, &HashMap::new(), stripe_account).await
    }
}
