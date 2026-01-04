//! Account lockout tracking implementation.

use std::collections::HashMap;
use std::sync::RwLock;
use std::time::{SystemTime, UNIX_EPOCH};

/// Lockout configuration.
#[derive(Debug, Clone)]
pub struct LockoutConfig {
    /// Maximum failed attempts before lockout
    pub max_attempts: u32,
    /// Lockout duration in milliseconds
    pub lock_duration_ms: u64,
    /// Window for counting attempts in milliseconds
    pub attempt_window_ms: u64,
}

impl Default for LockoutConfig {
    fn default() -> Self {
        Self {
            max_attempts: 5,
            lock_duration_ms: 15 * 60 * 1000,     // 15 minutes
            attempt_window_ms: 60 * 60 * 1000,    // 1 hour
        }
    }
}

/// Record of failed login attempts for an account.
#[derive(Debug, Clone)]
pub struct LockoutRecord {
    /// Number of failed attempts
    pub attempts: u32,
    /// Timestamp of first attempt in current window (ms)
    pub first_attempt: u64,
    /// When the lock expires (ms), if locked
    pub locked_until: Option<u64>,
    /// Timestamp of last attempt (ms)
    pub last_attempt: u64,
}

impl Default for LockoutRecord {
    fn default() -> Self {
        Self {
            attempts: 0,
            first_attempt: 0,
            locked_until: None,
            last_attempt: 0,
        }
    }
}

/// Lockout status for an account.
#[derive(Debug, Clone)]
pub struct LockoutStatus {
    /// Whether the account is locked
    pub is_locked: bool,
    /// When the lock expires (ms)
    pub locked_until: Option<u64>,
    /// Number of failed attempts
    pub attempts: u32,
    /// Remaining attempts before lockout
    pub remaining_attempts: u32,
}

/// In-memory lockout tracker.
/// In production, this would use Redis for distributed state.
pub struct LockoutTracker {
    records: RwLock<HashMap<String, LockoutRecord>>,
    config: LockoutConfig,
}

impl LockoutTracker {
    /// Create a new lockout tracker.
    pub fn new(config: LockoutConfig) -> Self {
        Self {
            records: RwLock::new(HashMap::new()),
            config,
        }
    }

    /// Get current timestamp in milliseconds.
    fn now_ms() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64
    }

    /// Normalize email for lookup.
    fn normalize_email(email: &str) -> String {
        email.trim().to_lowercase()
    }

    /// Check if an account is locked.
    pub fn check_lockout(&self, email: &str) -> LockoutStatus {
        let email = Self::normalize_email(email);
        let now = Self::now_ms();

        let records = self.records.read().unwrap();

        if let Some(record) = records.get(&email) {
            // Check if lock has expired
            if let Some(locked_until) = record.locked_until {
                if now < locked_until {
                    return LockoutStatus {
                        is_locked: true,
                        locked_until: Some(locked_until),
                        attempts: record.attempts,
                        remaining_attempts: 0,
                    };
                }
            }

            // Check if we're still in the attempt window
            if now - record.first_attempt < self.config.attempt_window_ms {
                let remaining = self.config.max_attempts.saturating_sub(record.attempts);
                return LockoutStatus {
                    is_locked: false,
                    locked_until: None,
                    attempts: record.attempts,
                    remaining_attempts: remaining,
                };
            }
        }

        // No record or expired - fresh start
        LockoutStatus {
            is_locked: false,
            locked_until: None,
            attempts: 0,
            remaining_attempts: self.config.max_attempts,
        }
    }

    /// Record a login attempt.
    ///
    /// # Arguments
    /// * `email` - The email attempting login
    /// * `success` - Whether the login was successful
    ///
    /// # Returns
    /// The resulting lockout status
    pub fn record_attempt(&self, email: &str, success: bool) -> LockoutStatus {
        let email = Self::normalize_email(email);
        let now = Self::now_ms();

        let mut records = self.records.write().unwrap();

        if success {
            // Clear on successful login
            records.remove(&email);
            return LockoutStatus {
                is_locked: false,
                locked_until: None,
                attempts: 0,
                remaining_attempts: self.config.max_attempts,
            };
        }

        // Failed attempt
        let record = records.entry(email).or_insert_with(|| LockoutRecord {
            attempts: 0,
            first_attempt: now,
            locked_until: None,
            last_attempt: now,
        });

        // Reset window if outside attempt window
        if now - record.first_attempt >= self.config.attempt_window_ms {
            record.attempts = 0;
            record.first_attempt = now;
            record.locked_until = None;
        }

        // Increment attempts
        record.attempts += 1;
        record.last_attempt = now;

        // Check if should lock
        if record.attempts >= self.config.max_attempts && record.locked_until.is_none() {
            record.locked_until = Some(now + self.config.lock_duration_ms);
        }

        let is_locked = record.locked_until.map(|lu| now < lu).unwrap_or(false);
        let remaining = if is_locked {
            0
        } else {
            self.config.max_attempts.saturating_sub(record.attempts)
        };

        LockoutStatus {
            is_locked,
            locked_until: record.locked_until,
            attempts: record.attempts,
            remaining_attempts: remaining,
        }
    }

    /// Clear lockout for an account (admin action).
    pub fn clear_lockout(&self, email: &str) {
        let email = Self::normalize_email(email);
        let mut records = self.records.write().unwrap();
        records.remove(&email);
    }

    /// Clean up expired records (call periodically).
    pub fn cleanup_expired(&self) {
        let now = Self::now_ms();
        let max_age = self.config.attempt_window_ms.max(self.config.lock_duration_ms) + 60_000;

        let mut records = self.records.write().unwrap();
        records.retain(|_, record| {
            now - record.last_attempt < max_age
        });
    }

    /// Get the number of tracked accounts (for monitoring).
    pub fn tracked_count(&self) -> usize {
        self.records.read().unwrap().len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_config() -> LockoutConfig {
        LockoutConfig {
            max_attempts: 3,
            lock_duration_ms: 1000, // 1 second for testing
            attempt_window_ms: 5000, // 5 seconds for testing
        }
    }

    #[test]
    fn test_check_lockout_fresh() {
        let tracker = LockoutTracker::new(test_config());

        let status = tracker.check_lockout("test@example.com");

        assert!(!status.is_locked);
        assert_eq!(status.attempts, 0);
        assert_eq!(status.remaining_attempts, 3);
    }

    #[test]
    fn test_record_failed_attempts() {
        let tracker = LockoutTracker::new(test_config());

        // First failure
        let status = tracker.record_attempt("test@example.com", false);
        assert!(!status.is_locked);
        assert_eq!(status.attempts, 1);
        assert_eq!(status.remaining_attempts, 2);

        // Second failure
        let status = tracker.record_attempt("test@example.com", false);
        assert!(!status.is_locked);
        assert_eq!(status.attempts, 2);
        assert_eq!(status.remaining_attempts, 1);

        // Third failure - should lock
        let status = tracker.record_attempt("test@example.com", false);
        assert!(status.is_locked);
        assert_eq!(status.attempts, 3);
        assert_eq!(status.remaining_attempts, 0);
    }

    #[test]
    fn test_successful_login_clears() {
        let tracker = LockoutTracker::new(test_config());

        // Some failures
        tracker.record_attempt("test@example.com", false);
        tracker.record_attempt("test@example.com", false);

        let status = tracker.check_lockout("test@example.com");
        assert_eq!(status.attempts, 2);

        // Successful login
        let status = tracker.record_attempt("test@example.com", true);
        assert!(!status.is_locked);
        assert_eq!(status.attempts, 0);
        assert_eq!(status.remaining_attempts, 3);
    }

    #[test]
    fn test_lockout_expires() {
        let config = LockoutConfig {
            max_attempts: 1,
            lock_duration_ms: 50, // 50ms for testing
            attempt_window_ms: 5000,
        };
        let tracker = LockoutTracker::new(config);

        // Trigger lockout
        let status = tracker.record_attempt("test@example.com", false);
        assert!(status.is_locked);

        // Wait for expiry
        std::thread::sleep(std::time::Duration::from_millis(100));

        // Should be unlocked now
        let status = tracker.check_lockout("test@example.com");
        assert!(!status.is_locked);
    }

    #[test]
    fn test_email_normalization() {
        let tracker = LockoutTracker::new(test_config());

        tracker.record_attempt("TEST@Example.COM", false);
        let status = tracker.check_lockout("  test@example.com  ");

        assert_eq!(status.attempts, 1);
    }

    #[test]
    fn test_clear_lockout() {
        let tracker = LockoutTracker::new(test_config());

        // Lock account
        for _ in 0..3 {
            tracker.record_attempt("test@example.com", false);
        }

        let status = tracker.check_lockout("test@example.com");
        assert!(status.is_locked);

        // Admin clears
        tracker.clear_lockout("test@example.com");

        let status = tracker.check_lockout("test@example.com");
        assert!(!status.is_locked);
        assert_eq!(status.attempts, 0);
    }
}
