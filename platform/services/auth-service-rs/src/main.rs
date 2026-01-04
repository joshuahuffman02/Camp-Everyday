//! Auth Service for Campreserv
//!
//! Handles security-critical authentication operations:
//! - Password hashing (bcrypt)
//! - JWT creation and validation
//! - TOTP/2FA generation and verification
//! - PII encryption (AES-256-GCM)
//! - Account lockout tracking

use actix_web::{web, App, HttpResponse, HttpServer, middleware};
use std::sync::Arc;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod db;
mod encryption;
mod error;
mod jwt;
mod lockout;
mod password;
mod totp;

use config::Config;
use encryption::EncryptionConfig;
use error::Result;
use lockout::{LockoutConfig, LockoutTracker};

/// Application state shared across handlers.
struct AppState {
    config: Config,
    encryption_config: EncryptionConfig,
    lockout_tracker: LockoutTracker,
    // db_pool: sqlx::PgPool, // Uncomment when database is connected
}

// ============================================================================
// Health Check
// ============================================================================

async fn health() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "service": "auth-service-rs",
        "version": env!("CARGO_PKG_VERSION"),
    }))
}

// ============================================================================
// Password Handlers
// ============================================================================

/// Hash a password.
async fn hash_password(
    state: web::Data<Arc<AppState>>,
    body: web::Json<password::HashPasswordRequest>,
) -> Result<HttpResponse> {
    let cost = body.cost.unwrap_or(state.config.bcrypt_cost);
    let hash = password::hash_password(&body.password, Some(cost))?;

    Ok(HttpResponse::Ok().json(password::HashPasswordResponse { hash }))
}

/// Verify a password.
async fn verify_password(
    body: web::Json<password::VerifyPasswordRequest>,
) -> Result<HttpResponse> {
    let valid = password::verify_password(&body.password, &body.hash)?;

    Ok(HttpResponse::Ok().json(password::VerifyPasswordResponse { valid }))
}

// ============================================================================
// JWT Handlers
// ============================================================================

/// Create a JWT token.
async fn create_jwt(
    state: web::Data<Arc<AppState>>,
    body: web::Json<jwt::CreateJwtRequest>,
) -> Result<HttpResponse> {
    let ttl = body.ttl_seconds.unwrap_or(state.config.jwt_ttl_seconds);

    let (token, expires_at) = jwt::create_jwt(
        &body.user_id,
        &body.email,
        &state.config.jwt_secret,
        ttl,
        body.token_type.as_deref(),
    )?;

    Ok(HttpResponse::Ok().json(jwt::CreateJwtResponse { token, expires_at }))
}

/// Validate a JWT token.
async fn validate_jwt(
    state: web::Data<Arc<AppState>>,
    body: web::Json<jwt::ValidateJwtRequest>,
) -> Result<HttpResponse> {
    match jwt::validate_jwt(&body.token, &state.config.jwt_secret) {
        Ok(claims) => Ok(HttpResponse::Ok().json(jwt::ValidateJwtResponse {
            valid: true,
            claims: Some(claims),
            error: None,
        })),
        Err(e) => Ok(HttpResponse::Ok().json(jwt::ValidateJwtResponse {
            valid: false,
            claims: None,
            error: Some(e.to_string()),
        })),
    }
}

// ============================================================================
// TOTP Handlers
// ============================================================================

/// Generate TOTP setup (secret + QR URL + backup codes).
async fn generate_totp(
    body: web::Json<totp::GenerateTotpRequest>,
) -> Result<HttpResponse> {
    let setup = totp::generate_totp_secret(&body.email);
    let backup_codes = totp::generate_backup_codes()?;

    let (plaintexts, hashed): (Vec<String>, Vec<String>) = backup_codes
        .into_iter()
        .unzip();

    Ok(HttpResponse::Ok().json(totp::GenerateTotpResponse {
        secret: setup.secret,
        otpauth_url: setup.otpauth_url,
        backup_codes: plaintexts,
        backup_codes_hashed: hashed,
    }))
}

/// Verify a TOTP code.
async fn verify_totp(
    body: web::Json<totp::VerifyTotpRequest>,
) -> Result<HttpResponse> {
    let valid = totp::verify_totp(&body.code, &body.secret)?;

    Ok(HttpResponse::Ok().json(totp::VerifyTotpResponse { valid }))
}

/// Verify a backup code.
async fn verify_backup_code(
    body: web::Json<totp::VerifyBackupCodeRequest>,
) -> Result<HttpResponse> {
    let result = totp::verify_backup_code(&body.code, &body.hashed_codes)?;

    Ok(HttpResponse::Ok().json(totp::VerifyBackupCodeResponse {
        valid: result.is_some(),
        used_index: result,
    }))
}

// ============================================================================
// Encryption Handlers
// ============================================================================

/// Encrypt data.
async fn encrypt_data(
    state: web::Data<Arc<AppState>>,
    body: web::Json<encryption::EncryptRequest>,
) -> Result<HttpResponse> {
    let ciphertext = encryption::encrypt(&body.plaintext, &state.encryption_config)?;

    Ok(HttpResponse::Ok().json(encryption::EncryptResponse { ciphertext }))
}

/// Decrypt data.
async fn decrypt_data(
    state: web::Data<Arc<AppState>>,
    body: web::Json<encryption::DecryptRequest>,
) -> Result<HttpResponse> {
    let (plaintext, key_version, needs_reencrypt) =
        encryption::decrypt(&body.ciphertext, &state.encryption_config)?;

    Ok(HttpResponse::Ok().json(encryption::DecryptResponse {
        plaintext,
        key_version,
        needs_reencrypt,
    }))
}

// ============================================================================
// Lockout Handlers
// ============================================================================

/// Check if an account is locked.
async fn check_lockout(
    state: web::Data<Arc<AppState>>,
    body: web::Json<lockout::CheckLockoutRequest>,
) -> Result<HttpResponse> {
    let status = state.lockout_tracker.check_lockout(&body.email);

    let time_remaining = status.locked_until.map(|lu| {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;
        if lu > now {
            (lu - now) / 1000
        } else {
            0
        }
    });

    Ok(HttpResponse::Ok().json(lockout::CheckLockoutResponse {
        is_locked: status.is_locked,
        locked_until: status.locked_until,
        attempts: status.attempts,
        time_remaining_seconds: time_remaining,
    }))
}

/// Record a login attempt.
async fn record_attempt(
    state: web::Data<Arc<AppState>>,
    body: web::Json<lockout::RecordAttemptRequest>,
) -> Result<HttpResponse> {
    let status = state.lockout_tracker.record_attempt(&body.email, body.success);

    let remaining = if status.is_locked {
        None
    } else {
        Some(status.remaining_attempts)
    };

    Ok(HttpResponse::Ok().json(lockout::RecordAttemptResponse {
        is_locked: status.is_locked,
        remaining_attempts: remaining,
        locked_until: status.locked_until,
    }))
}

// ============================================================================
// Main Entry Point
// ============================================================================

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load configuration
    let config = Config::from_env().expect("Failed to load configuration");

    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(&config.rust_log))
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Starting Auth Service");

    // Create encryption config
    let encryption_config = EncryptionConfig::from_env(
        &config.pii_encryption_key,
        &config.pii_encryption_key_version,
    );

    // Create lockout tracker
    let lockout_config = LockoutConfig {
        max_attempts: config.lockout_max_attempts,
        lock_duration_ms: config.lockout_duration_ms,
        attempt_window_ms: config.lockout_window_ms,
    };
    let lockout_tracker = LockoutTracker::new(lockout_config);

    // Create app state
    let state = Arc::new(AppState {
        config: config.clone(),
        encryption_config,
        lockout_tracker,
    });

    let bind_addr = format!("{}:{}", config.host, config.port);
    tracing::info!("Listening on {}", bind_addr);

    // Start HTTP server
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(Arc::clone(&state)))
            .wrap(middleware::Logger::default())
            .wrap(middleware::Compress::default())
            // Health check
            .route("/health", web::get().to(health))
            // Password endpoints
            .route("/api/auth/hash-password", web::post().to(hash_password))
            .route("/api/auth/verify-password", web::post().to(verify_password))
            // JWT endpoints
            .route("/api/auth/create-jwt", web::post().to(create_jwt))
            .route("/api/auth/validate-jwt", web::post().to(validate_jwt))
            // TOTP endpoints
            .route("/api/auth/totp/generate", web::post().to(generate_totp))
            .route("/api/auth/totp/verify", web::post().to(verify_totp))
            .route("/api/auth/totp/verify-backup", web::post().to(verify_backup_code))
            // Encryption endpoints
            .route("/api/auth/encrypt", web::post().to(encrypt_data))
            .route("/api/auth/decrypt", web::post().to(decrypt_data))
            // Lockout endpoints
            .route("/api/auth/lockout/check", web::post().to(check_lockout))
            .route("/api/auth/lockout/record", web::post().to(record_attempt))
    })
    .bind(&bind_addr)?
    .run()
    .await
}
