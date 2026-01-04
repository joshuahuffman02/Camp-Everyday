//! TOTP (Time-based One-Time Password) module for 2FA.

mod generate;
mod verify;
mod backup;

pub use generate::{generate_totp_secret, TotpSetup};
pub use verify::verify_totp;
pub use backup::{generate_backup_codes, verify_backup_code, hash_backup_code};

use serde::{Deserialize, Serialize};

/// TOTP configuration constants.
pub const TOTP_DIGITS: u32 = 6;
pub const TOTP_PERIOD: u64 = 30; // seconds
pub const TOTP_WINDOW: i64 = 1; // Allow +/- 1 period for clock drift
pub const TOTP_ISSUER: &str = "CampReserv";

/// Request to generate TOTP setup.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateTotpRequest {
    /// User email for the authenticator app label
    pub email: String,
}

/// Response containing TOTP setup info.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateTotpResponse {
    /// Base32-encoded secret
    pub secret: String,
    /// OTPAuth URI for QR code
    pub otpauth_url: String,
    /// Backup codes (8 codes)
    pub backup_codes: Vec<String>,
    /// Hashed backup codes for storage
    pub backup_codes_hashed: Vec<String>,
}

/// Request to verify TOTP code.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifyTotpRequest {
    /// The 6-digit TOTP code
    pub code: String,
    /// The Base32-encoded secret
    pub secret: String,
}

/// Response from TOTP verification.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifyTotpResponse {
    /// Whether the code is valid
    pub valid: bool,
}

/// Request to verify backup code.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifyBackupCodeRequest {
    /// The backup code to verify
    pub code: String,
    /// List of hashed backup codes
    pub hashed_codes: Vec<String>,
}

/// Response from backup code verification.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifyBackupCodeResponse {
    /// Whether the code is valid
    pub valid: bool,
    /// Index of the used code (for removal)
    pub used_index: Option<usize>,
}
