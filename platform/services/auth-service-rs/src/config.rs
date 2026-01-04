//! Configuration module for auth service.

use std::env;

/// Auth service configuration loaded from environment.
#[derive(Debug, Clone)]
pub struct Config {
    /// Server host
    pub host: String,
    /// Server port
    pub port: u16,
    /// Database URL
    pub database_url: String,
    /// JWT secret key
    pub jwt_secret: String,
    /// Web JWT TTL in seconds (default 7 days)
    pub jwt_ttl_seconds: u64,
    /// Mobile access token TTL in seconds (default 15 minutes)
    pub mobile_access_token_ttl: u64,
    /// Mobile refresh token TTL in seconds (default 30 days)
    pub mobile_refresh_token_ttl: u64,
    /// Bcrypt cost factor (default 12)
    pub bcrypt_cost: u32,
    /// TOTP encryption key (falls back to JWT secret)
    pub totp_encryption_key: String,
    /// PII encryption key (falls back to JWT secret)
    pub pii_encryption_key: String,
    /// PII encryption key version
    pub pii_encryption_key_version: String,
    /// Lockout max attempts (default 5)
    pub lockout_max_attempts: u32,
    /// Lockout duration in ms (default 15 minutes)
    pub lockout_duration_ms: u64,
    /// Lockout window in ms (default 1 hour)
    pub lockout_window_ms: u64,
    /// Log level
    pub rust_log: String,
}

impl Config {
    /// Load configuration from environment variables.
    pub fn from_env() -> Result<Self, String> {
        dotenvy::dotenv().ok();

        let jwt_secret = env::var("JWT_SECRET")
            .map_err(|_| "JWT_SECRET is required".to_string())?;

        // Validate JWT secret in production
        let is_production = env::var("NODE_ENV")
            .map(|v| v == "production")
            .unwrap_or(false);

        if is_production && jwt_secret.len() < 32 {
            return Err("JWT_SECRET must be at least 32 characters in production".to_string());
        }

        Ok(Self {
            host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "8082".to_string())
                .parse()
                .unwrap_or(8082),
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgresql://localhost/campreserv".to_string()),
            jwt_ttl_seconds: env::var("JWT_TTL_SECONDS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(7 * 24 * 60 * 60), // 7 days
            mobile_access_token_ttl: env::var("MOBILE_ACCESS_TOKEN_TTL")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(900), // 15 minutes
            mobile_refresh_token_ttl: env::var("MOBILE_REFRESH_TOKEN_TTL")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(30 * 24 * 60 * 60), // 30 days
            bcrypt_cost: env::var("BCRYPT_COST")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(12),
            totp_encryption_key: env::var("TOTP_ENCRYPTION_KEY")
                .unwrap_or_else(|_| jwt_secret.clone()),
            pii_encryption_key: env::var("PII_ENCRYPTION_KEY")
                .unwrap_or_else(|_| jwt_secret.clone()),
            pii_encryption_key_version: env::var("PII_ENCRYPTION_KEY_VERSION")
                .unwrap_or_else(|_| "v1".to_string()),
            jwt_secret,
            lockout_max_attempts: env::var("LOCKOUT_MAX_ATTEMPTS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(5),
            lockout_duration_ms: env::var("LOCKOUT_DURATION_MS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(15 * 60 * 1000), // 15 minutes
            lockout_window_ms: env::var("LOCKOUT_WINDOW_MS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(60 * 60 * 1000), // 1 hour
            rust_log: env::var("RUST_LOG")
                .unwrap_or_else(|_| "info,auth_service=debug".to_string()),
        })
    }
}
