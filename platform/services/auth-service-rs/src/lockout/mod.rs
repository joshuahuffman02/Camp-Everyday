//! Account lockout module.

mod tracker;

pub use tracker::{LockoutTracker, LockoutRecord, LockoutConfig, LockoutStatus};

use serde::{Deserialize, Serialize};

/// Request to check lockout status.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckLockoutRequest {
    /// Email to check (normalized)
    pub email: String,
}

/// Response with lockout status.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckLockoutResponse {
    /// Whether the account is currently locked
    pub is_locked: bool,
    /// When the lock expires (Unix timestamp ms), if locked
    pub locked_until: Option<u64>,
    /// Number of failed attempts
    pub attempts: u32,
    /// Time until unlock in seconds, if locked
    pub time_remaining_seconds: Option<u64>,
}

/// Request to record a failed attempt.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordAttemptRequest {
    /// Email (normalized)
    pub email: String,
    /// Whether this was a successful login (clears attempts)
    pub success: bool,
}

/// Response from recording an attempt.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordAttemptResponse {
    /// Whether the account is now locked
    pub is_locked: bool,
    /// Remaining attempts before lockout (if not locked)
    pub remaining_attempts: Option<u32>,
    /// When the lock expires (Unix timestamp ms), if locked
    pub locked_until: Option<u64>,
}
