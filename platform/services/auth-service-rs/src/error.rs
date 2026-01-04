//! Error types for auth service.

use actix_web::{HttpResponse, ResponseError};
use std::fmt;

/// Custom error type for auth service.
#[derive(Debug)]
pub enum AppError {
    /// Invalid credentials
    InvalidCredentials(String),
    /// Account locked
    AccountLocked(String),
    /// Invalid token
    InvalidToken(String),
    /// Token expired
    TokenExpired,
    /// Encryption error
    EncryptionError(String),
    /// Decryption error
    DecryptionError(String),
    /// TOTP error
    TotpError(String),
    /// Database error
    DatabaseError(String),
    /// Validation error
    ValidationError(String),
    /// Not found
    NotFound(String),
    /// Internal error
    Internal(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::InvalidCredentials(msg) => write!(f, "Invalid credentials: {}", msg),
            AppError::AccountLocked(msg) => write!(f, "Account locked: {}", msg),
            AppError::InvalidToken(msg) => write!(f, "Invalid token: {}", msg),
            AppError::TokenExpired => write!(f, "Token expired"),
            AppError::EncryptionError(msg) => write!(f, "Encryption error: {}", msg),
            AppError::DecryptionError(msg) => write!(f, "Decryption error: {}", msg),
            AppError::TotpError(msg) => write!(f, "TOTP error: {}", msg),
            AppError::DatabaseError(msg) => write!(f, "Database error: {}", msg),
            AppError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
            AppError::NotFound(msg) => write!(f, "Not found: {}", msg),
            AppError::Internal(msg) => write!(f, "Internal error: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        let (status, error_type) = match self {
            AppError::InvalidCredentials(_) => {
                (actix_web::http::StatusCode::UNAUTHORIZED, "invalid_credentials")
            }
            AppError::AccountLocked(_) => {
                (actix_web::http::StatusCode::FORBIDDEN, "account_locked")
            }
            AppError::InvalidToken(_) => {
                (actix_web::http::StatusCode::UNAUTHORIZED, "invalid_token")
            }
            AppError::TokenExpired => {
                (actix_web::http::StatusCode::UNAUTHORIZED, "token_expired")
            }
            AppError::EncryptionError(_) => {
                (actix_web::http::StatusCode::INTERNAL_SERVER_ERROR, "encryption_error")
            }
            AppError::DecryptionError(_) => {
                (actix_web::http::StatusCode::BAD_REQUEST, "decryption_error")
            }
            AppError::TotpError(_) => {
                (actix_web::http::StatusCode::BAD_REQUEST, "totp_error")
            }
            AppError::DatabaseError(_) => {
                (actix_web::http::StatusCode::INTERNAL_SERVER_ERROR, "database_error")
            }
            AppError::ValidationError(_) => {
                (actix_web::http::StatusCode::BAD_REQUEST, "validation_error")
            }
            AppError::NotFound(_) => {
                (actix_web::http::StatusCode::NOT_FOUND, "not_found")
            }
            AppError::Internal(_) => {
                (actix_web::http::StatusCode::INTERNAL_SERVER_ERROR, "internal_error")
            }
        };

        HttpResponse::build(status).json(serde_json::json!({
            "error": error_type,
            "message": self.to_string(),
        }))
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::DatabaseError(err.to_string())
    }
}

impl From<bcrypt::BcryptError> for AppError {
    fn from(err: bcrypt::BcryptError) -> Self {
        AppError::Internal(format!("Bcrypt error: {}", err))
    }
}

impl From<jsonwebtoken::errors::Error> for AppError {
    fn from(err: jsonwebtoken::errors::Error) -> Self {
        match err.kind() {
            jsonwebtoken::errors::ErrorKind::ExpiredSignature => AppError::TokenExpired,
            _ => AppError::InvalidToken(err.to_string()),
        }
    }
}

/// Result type for auth service.
pub type Result<T> = std::result::Result<T, AppError>;
