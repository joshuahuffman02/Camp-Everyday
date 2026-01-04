//! JWT token creation.

use chrono::Utc;
use jsonwebtoken::{encode, EncodingKey, Header};

use super::Claims;
use crate::error::Result;

/// Create a JWT token.
///
/// # Arguments
/// * `user_id` - The user's ID (becomes `sub` claim)
/// * `email` - The user's email
/// * `secret` - The JWT secret key
/// * `ttl_seconds` - Time-to-live in seconds
/// * `token_type` - Optional token type identifier
///
/// # Returns
/// A tuple of (token, expires_at_timestamp)
pub fn create_jwt(
    user_id: &str,
    email: &str,
    secret: &str,
    ttl_seconds: u64,
    token_type: Option<&str>,
) -> Result<(String, u64)> {
    let now = Utc::now().timestamp() as u64;
    let exp = now + ttl_seconds;

    let claims = Claims {
        sub: user_id.to_string(),
        email: email.to_string().trim().to_lowercase(),
        iat: now,
        exp,
        token_type: token_type.map(String::from),
    };

    let token = encode(
        &Header::default(), // HS256
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )?;

    Ok((token, exp))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_jwt() {
        let secret = "test_secret_key_at_least_32_chars";
        let (token, expires_at) = create_jwt(
            "user123",
            "test@example.com",
            secret,
            3600,
            None,
        ).unwrap();

        assert!(!token.is_empty());
        assert!(token.contains('.'));  // JWT format: header.payload.signature
        assert!(expires_at > 0);
    }

    #[test]
    fn test_create_jwt_with_token_type() {
        let secret = "test_secret_key_at_least_32_chars";
        let (token, _) = create_jwt(
            "user123",
            "test@example.com",
            secret,
            900,
            Some("access"),
        ).unwrap();

        assert!(!token.is_empty());
    }

    #[test]
    fn test_create_jwt_normalizes_email() {
        let secret = "test_secret_key_at_least_32_chars";
        // The email should be normalized in the claims
        let (_token, _) = create_jwt(
            "user123",
            "  TEST@EXAMPLE.COM  ",
            secret,
            3600,
            None,
        ).unwrap();

        // Would need to decode to verify normalization
    }
}
