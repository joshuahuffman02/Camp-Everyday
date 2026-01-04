//! Error types for the availability calculator service.

use actix_web::{HttpResponse, ResponseError};
use std::fmt;

/// Application-level error types.
#[derive(Debug)]
pub enum AppError {
    /// Database error
    Database(sqlx::Error),
    /// Validation error
    Validation(String),
    /// Not found
    NotFound(String),
    /// Bad request
    BadRequest(String),
    /// Internal server error
    Internal(String),
    /// Overflow error (e.g., price calculation overflow)
    Overflow(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Database(e) => write!(f, "Database error: {}", e),
            AppError::Validation(msg) => write!(f, "Validation error: {}", msg),
            AppError::NotFound(msg) => write!(f, "Not found: {}", msg),
            AppError::BadRequest(msg) => write!(f, "Bad request: {}", msg),
            AppError::Internal(msg) => write!(f, "Internal error: {}", msg),
            AppError::Overflow(msg) => write!(f, "Overflow error: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        match self {
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
            AppError::BadRequest(msg) => HttpResponse::BadRequest().json(serde_json::json!({
                "error": "bad_request",
                "message": msg,
            })),
            AppError::Internal(msg) => HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "internal_error",
                "message": msg,
            })),
            AppError::Overflow(msg) => HttpResponse::BadRequest().json(serde_json::json!({
                "error": "overflow_error",
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

pub type Result<T> = std::result::Result<T, AppError>;
