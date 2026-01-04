//! AES-256-GCM encryption module for PII.

mod aes_gcm;

pub use aes_gcm::{encrypt, decrypt, EncryptionConfig};

use serde::{Deserialize, Serialize};

/// Request to encrypt data.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptRequest {
    /// The plaintext to encrypt
    pub plaintext: String,
    /// Optional key version override
    pub key_version: Option<String>,
}

/// Response containing encrypted data.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptResponse {
    /// The encrypted ciphertext (format: version:iv:authTag:ciphertext)
    pub ciphertext: String,
}

/// Request to decrypt data.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecryptRequest {
    /// The ciphertext to decrypt (format: version:iv:authTag:ciphertext)
    pub ciphertext: String,
}

/// Response containing decrypted data.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecryptResponse {
    /// The decrypted plaintext
    pub plaintext: String,
    /// The key version used for decryption
    pub key_version: String,
    /// Whether re-encryption is recommended (key version mismatch)
    pub needs_reencrypt: bool,
}

/// List of fields that should be encrypted as PII.
pub const PII_FIELDS: &[&str] = &[
    "phone",
    "phoneNumber",
    "ssn",
    "socialSecurityNumber",
    "taxId",
    "driversLicense",
    "licenseNumber",
    "dateOfBirth",
    "bankAccount",
    "routingNumber",
];

/// Check if a field name should be encrypted.
pub fn is_pii_field(field_name: &str) -> bool {
    PII_FIELDS.iter().any(|&f| f.eq_ignore_ascii_case(field_name))
}
