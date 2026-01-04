//! JWT token creation and validation module.

mod create;
mod validate;

pub use create::create_jwt;
pub use validate::validate_jwt;

use serde::{Deserialize, Serialize};

/// JWT claims structure.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    /// Subject (user ID)
    pub sub: String,
    /// User email
    pub email: String,
    /// Issued at (Unix timestamp)
    pub iat: u64,
    /// Expiration time (Unix timestamp)
    pub exp: u64,
    /// Token type (optional: "access" or "refresh")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub token_type: Option<String>,
}

/// Request to create a JWT.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateJwtRequest {
    /// User ID
    pub user_id: String,
    /// User email
    pub email: String,
    /// TTL in seconds (optional, uses config default)
    pub ttl_seconds: Option<u64>,
    /// Token type (optional: "access" or "refresh")
    pub token_type: Option<String>,
}

/// Response containing the JWT.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateJwtResponse {
    /// The signed JWT token
    pub token: String,
    /// Expiration timestamp (Unix)
    pub expires_at: u64,
}

/// Request to validate a JWT.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidateJwtRequest {
    /// The JWT token to validate
    pub token: String,
}

/// Response from JWT validation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidateJwtResponse {
    /// Whether the token is valid
    pub valid: bool,
    /// Decoded claims (if valid)
    pub claims: Option<Claims>,
    /// Error message (if invalid)
    pub error: Option<String>,
}
