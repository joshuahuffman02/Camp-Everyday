//! Stripe webhook signature verification.

use hmac::{Hmac, Mac};
use sha2::Sha256;

use crate::error::{AppError, Result};

type HmacSha256 = Hmac<Sha256>;

/// Verify a Stripe webhook signature.
pub fn verify_webhook_signature(
    payload: &[u8],
    signature_header: &str,
    webhook_secret: &str,
) -> Result<()> {
    // Parse the signature header
    // Format: t=timestamp,v1=signature,v1=signature2,...
    let parts: std::collections::HashMap<&str, &str> = signature_header
        .split(',')
        .filter_map(|part| {
            let mut split = part.splitn(2, '=');
            Some((split.next()?, split.next()?))
        })
        .collect();

    let timestamp = parts
        .get("t")
        .ok_or_else(|| AppError::Validation("Missing timestamp in signature".to_string()))?;

    let expected_signature = parts
        .get("v1")
        .ok_or_else(|| AppError::Validation("Missing v1 signature".to_string()))?;

    // Validate timestamp is not too old (5 minutes tolerance)
    let ts: i64 = timestamp
        .parse()
        .map_err(|_| AppError::Validation("Invalid timestamp".to_string()))?;

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    if (now - ts).abs() > 300 {
        return Err(AppError::Validation("Webhook timestamp too old".to_string()));
    }

    // Compute the expected signature
    let signed_payload = format!("{}.{}", timestamp, String::from_utf8_lossy(payload));

    let mut mac = HmacSha256::new_from_slice(webhook_secret.as_bytes())
        .map_err(|_| AppError::Internal("Invalid webhook secret".to_string()))?;

    mac.update(signed_payload.as_bytes());
    let computed_signature = hex::encode(mac.finalize().into_bytes());

    // Constant-time comparison
    if !constant_time_compare(&computed_signature, expected_signature) {
        return Err(AppError::Validation("Invalid webhook signature".to_string()));
    }

    Ok(())
}

/// Constant-time string comparison to prevent timing attacks.
fn constant_time_compare(a: &str, b: &str) -> bool {
    if a.len() != b.len() {
        return false;
    }

    let mut result = 0u8;
    for (x, y) in a.bytes().zip(b.bytes()) {
        result |= x ^ y;
    }
    result == 0
}

/// Parse a webhook event from JSON payload.
pub fn parse_webhook_event(payload: &[u8]) -> Result<WebhookEvent> {
    serde_json::from_slice(payload)
        .map_err(|e| AppError::Validation(format!("Invalid webhook payload: {}", e)))
}

/// Stripe webhook event.
#[derive(Debug, Clone, serde::Deserialize)]
pub struct WebhookEvent {
    pub id: String,
    pub object: String,
    #[serde(rename = "type")]
    pub event_type: String,
    pub data: WebhookEventData,
    pub created: i64,
    pub livemode: bool,
    pub account: Option<String>,
}

/// Webhook event data.
#[derive(Debug, Clone, serde::Deserialize)]
pub struct WebhookEventData {
    pub object: serde_json::Value,
}

impl WebhookEvent {
    /// Get the event object as a specific type.
    pub fn get_object<T: serde::de::DeserializeOwned>(&self) -> Result<T> {
        serde_json::from_value(self.data.object.clone())
            .map_err(|e| AppError::Internal(format!("Failed to parse event object: {}", e)))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_constant_time_compare_equal() {
        assert!(constant_time_compare("abc123", "abc123"));
    }

    #[test]
    fn test_constant_time_compare_not_equal() {
        assert!(!constant_time_compare("abc123", "abc124"));
    }

    #[test]
    fn test_constant_time_compare_different_length() {
        assert!(!constant_time_compare("abc", "abcd"));
    }
}
