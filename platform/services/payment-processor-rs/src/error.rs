//! Error types for the payment processor service.

use actix_web::{HttpResponse, ResponseError};
use std::fmt;

/// Application-level error types.
#[derive(Debug)]
pub enum AppError {
    /// Stripe API error
    Stripe(StripeError),
    /// Database error
    Database(sqlx::Error),
    /// Validation error
    Validation(String),
    /// Not found
    NotFound(String),
    /// Unauthorized
    Unauthorized(String),
    /// Bad request
    BadRequest(String),
    /// Internal server error
    Internal(String),
    /// Conflict (e.g., duplicate payment)
    Conflict(String),
}

/// Stripe-specific errors.
#[derive(Debug)]
pub struct StripeError {
    pub code: String,
    pub message: String,
    pub decline_code: Option<String>,
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Stripe(e) => write!(f, "Stripe error: {} - {}", e.code, e.message),
            AppError::Database(e) => write!(f, "Database error: {}", e),
            AppError::Validation(msg) => write!(f, "Validation error: {}", msg),
            AppError::NotFound(msg) => write!(f, "Not found: {}", msg),
            AppError::Unauthorized(msg) => write!(f, "Unauthorized: {}", msg),
            AppError::BadRequest(msg) => write!(f, "Bad request: {}", msg),
            AppError::Internal(msg) => write!(f, "Internal error: {}", msg),
            AppError::Conflict(msg) => write!(f, "Conflict: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        match self {
            AppError::Stripe(e) => HttpResponse::BadGateway().json(serde_json::json!({
                "error": "stripe_error",
                "code": e.code,
                "message": e.message,
                "decline_code": e.decline_code,
            })),
            AppError::Database(_) => HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "database_error",
                "message": "A database error occurred",
            })),
            AppError::Validation(msg) => HttpResponse::BadRequest().json(serde_json::json!({
                "error": "validation_error",
                "message": msg,
            })),
            AppError::NotFound(msg) => HttpResponse::NotFound().json(serde_json::json!({
                "error": "not_found",
                "message": msg,
            })),
            AppError::Unauthorized(msg) => HttpResponse::Unauthorized().json(serde_json::json!({
                "error": "unauthorized",
                "message": msg,
            })),
            AppError::BadRequest(msg) => HttpResponse::BadRequest().json(serde_json::json!({
                "error": "bad_request",
                "message": msg,
            })),
            AppError::Internal(msg) => HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "internal_error",
                "message": msg,
            })),
            AppError::Conflict(msg) => HttpResponse::Conflict().json(serde_json::json!({
                "error": "conflict",
                "message": msg,
            })),
        }
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        tracing::error!("Database error: {:?}", err);
        AppError::Database(err)
    }
}

impl From<reqwest::Error> for AppError {
    fn from(err: reqwest::Error) -> Self {
        tracing::error!("HTTP client error: {:?}", err);
        AppError::Internal(format!("HTTP client error: {}", err))
    }
}

pub type Result<T> = std::result::Result<T, AppError>;
