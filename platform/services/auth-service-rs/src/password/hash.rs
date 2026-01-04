//! Password hashing using bcrypt.

use crate::error::{AppError, Result};

/// Default bcrypt cost factor (same as NestJS implementation).
pub const DEFAULT_COST: u32 = 12;

/// Hash a password using bcrypt.
///
/// # Arguments
/// * `password` - The plaintext password to hash
/// * `cost` - Optional cost factor (default 12)
///
/// # Returns
/// The bcrypt hash string
pub fn hash_password(password: &str, cost: Option<u32>) -> Result<String> {
    let cost = cost.unwrap_or(DEFAULT_COST);

    // Validate cost is reasonable (4-31)
    if !(4..=31).contains(&cost) {
        return Err(AppError::ValidationError(
            "Bcrypt cost must be between 4 and 31".to_string(),
        ));
    }

    // Validate password isn't empty
    if password.is_empty() {
        return Err(AppError::ValidationError(
            "Password cannot be empty".to_string(),
        ));
    }

    // Hash the password
    let hash = bcrypt::hash(password, cost)?;

    Ok(hash)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_password() {
        let password = "test_password_123";
        let hash = hash_password(password, None).unwrap();

        // Bcrypt hashes start with $2
        assert!(hash.starts_with("$2"));
        // Bcrypt hashes are 60 characters
        assert_eq!(hash.len(), 60);
    }

    #[test]
    fn test_hash_password_with_custom_cost() {
        let password = "test_password";
        let hash = hash_password(password, Some(4)).unwrap();

        assert!(hash.starts_with("$2"));
    }

    #[test]
    fn test_hash_password_different_results() {
        let password = "same_password";
        let hash1 = hash_password(password, Some(4)).unwrap();
        let hash2 = hash_password(password, Some(4)).unwrap();

        // Same password should produce different hashes (due to salt)
        assert_ne!(hash1, hash2);
    }

    #[test]
    fn test_hash_password_empty_fails() {
        let result = hash_password("", None);
        assert!(result.is_err());
    }
}
