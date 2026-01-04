//! JWT token validation.

use jsonwebtoken::{decode, DecodingKey, Validation};

use super::Claims;
use crate::error::{AppError, Result};

/// Validate a JWT token.
///
/// # Arguments
/// * `token` - The JWT token to validate
/// * `secret` - The JWT secret key
///
/// # Returns
/// The decoded claims if valid
pub fn validate_jwt(token: &str, secret: &str) -> Result<Claims> {
    // Remove "Bearer " prefix if present
    let token = token.strip_prefix("Bearer ").unwrap_or(token);
    let token = token.trim();

    if token.is_empty() {
        return Err(AppError::InvalidToken("Token is empty".to_string()));
    }

    let mut validation = Validation::default();
    validation.validate_exp = true;
    validation.leeway = 0; // No leeway for expiration check (default is 60 seconds)

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )?;

    Ok(token_data.claims)
}

/// Validate a JWT token without checking expiration.
/// Use this for debugging or special cases only.
pub fn validate_jwt_ignore_exp(token: &str, secret: &str) -> Result<Claims> {
    let token = token.strip_prefix("Bearer ").unwrap_or(token);
    let token = token.trim();

    if token.is_empty() {
        return Err(AppError::InvalidToken("Token is empty".to_string()));
    }

    let mut validation = Validation::default();
    validation.validate_exp = false;

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )?;

    Ok(token_data.claims)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::jwt::create_jwt;

    #[test]
    fn test_validate_jwt_valid() {
        let secret = "test_secret_key_at_least_32_chars";
        let (token, _) = create_jwt(
            "user123",
            "test@example.com",
            secret,
            3600,
            None,
        ).unwrap();

        let claims = validate_jwt(&token, secret).unwrap();
        assert_eq!(claims.sub, "user123");
        assert_eq!(claims.email, "test@example.com");
    }

    #[test]
    fn test_validate_jwt_with_bearer_prefix() {
        let secret = "test_secret_key_at_least_32_chars";
        let (token, _) = create_jwt(
            "user123",
            "test@example.com",
            secret,
            3600,
            None,
        ).unwrap();

        let bearer_token = format!("Bearer {}", token);
        let claims = validate_jwt(&bearer_token, secret).unwrap();
        assert_eq!(claims.sub, "user123");
    }

    #[test]
    fn test_validate_jwt_wrong_secret() {
        let secret = "test_secret_key_at_least_32_chars";
        let wrong_secret = "wrong_secret_key_at_least_32_char";
        let (token, _) = create_jwt(
            "user123",
            "test@example.com",
            secret,
            3600,
            None,
        ).unwrap();

        let result = validate_jwt(&token, wrong_secret);
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_jwt_expired() {
        let secret = "test_secret_key_at_least_32_chars";
        // Create token that's already expired (TTL = 0)
        let (token, _) = create_jwt(
            "user123",
            "test@example.com",
            secret,
            0,
            None,
        ).unwrap();

        // Wait for at least 1.5 seconds to ensure token is expired
        // JWT uses second-level precision, so we need to wait past the exp second
        std::thread::sleep(std::time::Duration::from_millis(1500));

        let result = validate_jwt(&token, secret);
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_jwt_empty() {
        let secret = "test_secret_key_at_least_32_chars";
        let result = validate_jwt("", secret);
        assert!(result.is_err());
    }
}
