//! Password verification using bcrypt.

use crate::error::{AppError, Result};

/// Verify a password against a bcrypt hash.
///
/// # Arguments
/// * `password` - The plaintext password to verify
/// * `hash` - The stored bcrypt hash
///
/// # Returns
/// `true` if the password matches, `false` otherwise
pub fn verify_password(password: &str, hash: &str) -> Result<bool> {
    // Validate inputs
    if password.is_empty() {
        return Err(AppError::ValidationError(
            "Password cannot be empty".to_string(),
        ));
    }

    if hash.is_empty() {
        return Err(AppError::ValidationError(
            "Hash cannot be empty".to_string(),
        ));
    }

    // Verify the password
    match bcrypt::verify(password, hash) {
        Ok(valid) => Ok(valid),
        Err(bcrypt::BcryptError::InvalidHash(_)) => {
            // Invalid hash format - return false instead of error
            // This is consistent with the NestJS behavior
            Ok(false)
        }
        Err(e) => Err(AppError::Internal(format!("Bcrypt error: {}", e))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::password::hash_password;

    #[test]
    fn test_verify_password_correct() {
        let password = "correct_password";
        let hash = hash_password(password, Some(4)).unwrap();

        let result = verify_password(password, &hash).unwrap();
        assert!(result);
    }

    #[test]
    fn test_verify_password_incorrect() {
        let password = "correct_password";
        let hash = hash_password(password, Some(4)).unwrap();

        let result = verify_password("wrong_password", &hash).unwrap();
        assert!(!result);
    }

    #[test]
    fn test_verify_password_invalid_hash() {
        let result = verify_password("password", "invalid_hash").unwrap();
        assert!(!result);
    }

    #[test]
    fn test_verify_password_empty_password_fails() {
        let result = verify_password("", "$2a$12$somehash");
        assert!(result.is_err());
    }

    #[test]
    fn test_verify_password_empty_hash_fails() {
        let result = verify_password("password", "");
        assert!(result.is_err());
    }
}
