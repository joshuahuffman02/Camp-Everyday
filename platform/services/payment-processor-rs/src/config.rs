//! Configuration for the payment processor service.

use std::env;

/// Application configuration loaded from environment variables.
#[derive(Debug, Clone)]
pub struct Config {
    /// Database connection URL
    pub database_url: String,
    /// Stripe secret key
    pub stripe_secret_key: String,
    /// Stripe webhook secret
    pub stripe_webhook_secret: String,
    /// Server host
    pub host: String,
    /// Server port
    pub port: u16,
    /// Platform fee in cents (default $3.00)
    pub platform_fee_cents: u32,
    /// Payout drift threshold in cents (alert if drift > this)
    pub payout_drift_threshold_cents: u32,
    /// Alert webhook URL (e.g., Slack)
    pub alert_webhook_url: Option<String>,
    /// Rust log level
    pub rust_log: String,
}

impl Config {
    /// Load configuration from environment variables.
    pub fn from_env() -> Result<Self, env::VarError> {
        dotenvy::dotenv().ok();

        Ok(Config {
            database_url: env::var("DATABASE_URL")?,
            stripe_secret_key: env::var("STRIPE_SECRET_KEY")?,
            stripe_webhook_secret: env::var("STRIPE_WEBHOOK_SECRET")
                .unwrap_or_else(|_| String::new()),
            host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()
                .unwrap_or(8080),
            platform_fee_cents: env::var("PAYMENT_PLATFORM_FEE_CENTS")
                .unwrap_or_else(|_| "300".to_string())
                .parse()
                .unwrap_or(300),
            payout_drift_threshold_cents: env::var("PAYOUT_DRIFT_THRESHOLD_CENTS")
                .unwrap_or_else(|_| "100".to_string())
                .parse()
                .unwrap_or(100),
            alert_webhook_url: env::var("ALERT_WEBHOOK_URL").ok(),
            rust_log: env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string()),
        })
    }
}
