//! Password hashing and verification module.

mod hash;
mod verify;

pub use hash::hash_password;
pub use verify::verify_password;

use serde::{Deserialize, Serialize};

/// Request to hash a password.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HashPasswordRequest {
    /// The plaintext password to hash
    pub password: String,
    /// Optional cost factor (default 12)
    pub cost: Option<u32>,
}

/// Response containing the hashed password.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HashPasswordResponse {
    /// The bcrypt hash
    pub hash: String,
}

/// Request to verify a password.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifyPasswordRequest {
    /// The plaintext password to verify
    pub password: String,
    /// The stored bcrypt hash
    pub hash: String,
}

/// Response from password verification.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifyPasswordResponse {
    /// Whether the password matches
    pub valid: bool,
}
