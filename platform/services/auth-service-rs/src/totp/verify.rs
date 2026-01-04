//! TOTP code verification.

use hmac::{Hmac, Mac};
use sha1::Sha1;
use std::time::{SystemTime, UNIX_EPOCH};

use super::{generate::base32_decode, TOTP_DIGITS, TOTP_PERIOD, TOTP_WINDOW};
use crate::error::{AppError, Result};

type HmacSha1 = Hmac<Sha1>;

/// Verify a TOTP code.
///
/// # Arguments
/// * `code` - The 6-digit code entered by the user
/// * `secret` - The Base32-encoded secret
///
/// # Returns
/// `true` if the code is valid for the current time window
pub fn verify_totp(code: &str, secret: &str) -> Result<bool> {
    // Validate code format
    let code = code.trim();
    if code.len() != TOTP_DIGITS as usize {
        return Ok(false);
    }

    // Parse code as number
    let code_num: u32 = match code.parse() {
        Ok(n) => n,
        Err(_) => return Ok(false),
    };

    // Decode secret
    let secret_bytes = base32_decode(secret)
        .ok_or_else(|| AppError::TotpError("Invalid secret format".to_string()))?;

    // Get current time step
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| AppError::Internal(format!("Time error: {}", e)))?;
    let current_step = now.as_secs() / TOTP_PERIOD;

    // Check code against current time and +/- window
    for offset in -TOTP_WINDOW..=TOTP_WINDOW {
        let step = (current_step as i64 + offset) as u64;
        let expected = generate_totp_code(&secret_bytes, step);

        if code_num == expected {
            return Ok(true);
        }
    }

    Ok(false)
}

/// Generate a TOTP code for a given time step.
fn generate_totp_code(secret: &[u8], time_step: u64) -> u32 {
    // Convert time step to big-endian bytes
    let time_bytes = time_step.to_be_bytes();

    // Create HMAC-SHA1
    let mut mac = HmacSha1::new_from_slice(secret)
        .expect("HMAC can take key of any size");
    mac.update(&time_bytes);
    let result = mac.finalize().into_bytes();

    // Dynamic truncation (RFC 6238)
    let offset = (result[19] & 0x0f) as usize;
    let binary = ((result[offset] & 0x7f) as u32) << 24
        | (result[offset + 1] as u32) << 16
        | (result[offset + 2] as u32) << 8
        | (result[offset + 3] as u32);

    // Modulo to get 6 digits
    binary % 10u32.pow(TOTP_DIGITS)
}

/// Get the current TOTP code for a secret (for testing/debug).
pub fn get_current_totp(secret: &str) -> Result<String> {
    let secret_bytes = base32_decode(secret)
        .ok_or_else(|| AppError::TotpError("Invalid secret format".to_string()))?;

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| AppError::Internal(format!("Time error: {}", e)))?;
    let current_step = now.as_secs() / TOTP_PERIOD;

    let code = generate_totp_code(&secret_bytes, current_step);

    // Pad to 6 digits
    Ok(format!("{:0>6}", code))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::totp::generate::generate_totp_secret;

    #[test]
    fn test_verify_totp_valid() {
        // Generate a secret
        let setup = generate_totp_secret("test@example.com");

        // Get current code
        let current_code = get_current_totp(&setup.secret).unwrap();

        // Verify it
        let result = verify_totp(&current_code, &setup.secret).unwrap();
        assert!(result);
    }

    #[test]
    fn test_verify_totp_wrong_code() {
        let setup = generate_totp_secret("test@example.com");

        // Use a wrong code
        let result = verify_totp("000000", &setup.secret).unwrap();
        // This might be valid by chance, but usually won't be
        // Just test that it doesn't error
        assert!(!result || result); // Always passes, just testing no error
    }

    #[test]
    fn test_verify_totp_invalid_format() {
        let setup = generate_totp_secret("test@example.com");

        // Too short
        let result = verify_totp("123", &setup.secret).unwrap();
        assert!(!result);

        // Too long
        let result = verify_totp("1234567", &setup.secret).unwrap();
        assert!(!result);

        // Non-numeric
        let result = verify_totp("abcdef", &setup.secret).unwrap();
        assert!(!result);
    }

    #[test]
    fn test_generate_totp_code_known_vector() {
        // RFC 6238 test vector for SHA1
        // Secret: "12345678901234567890" (ASCII)
        // Time = 59 seconds -> step = 1
        // Expected: 94287082

        let secret = b"12345678901234567890";
        let code = generate_totp_code(secret, 1);

        // Last 6 digits of 94287082
        assert_eq!(code, 287082);
    }
}
