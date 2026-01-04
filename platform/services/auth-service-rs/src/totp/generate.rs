//! TOTP secret generation.

use base64::{engine::general_purpose::STANDARD, Engine};
use rand::RngCore;

use super::{TOTP_DIGITS, TOTP_ISSUER, TOTP_PERIOD};

/// TOTP setup information.
#[derive(Debug, Clone)]
pub struct TotpSetup {
    /// Base32-encoded secret
    pub secret: String,
    /// OTPAuth URI for QR code generation
    pub otpauth_url: String,
}

/// Generate a new TOTP secret and setup info.
///
/// # Arguments
/// * `email` - User's email for the authenticator app label
///
/// # Returns
/// TOTP setup with secret and otpauth URL
pub fn generate_totp_secret(email: &str) -> TotpSetup {
    // Generate 20 random bytes for the secret
    let mut secret_bytes = [0u8; 20];
    rand::thread_rng().fill_bytes(&mut secret_bytes);

    // Encode as Base32 (standard for TOTP)
    let secret = base32_encode(&secret_bytes);

    // Build otpauth URL
    let otpauth_url = format!(
        "otpauth://totp/{}:{}?secret={}&issuer={}&algorithm=SHA1&digits={}&period={}",
        TOTP_ISSUER,
        urlencoding(&email),
        secret,
        TOTP_ISSUER,
        TOTP_DIGITS,
        TOTP_PERIOD
    );

    TotpSetup {
        secret,
        otpauth_url,
    }
}

/// Encode bytes as Base32.
fn base32_encode(bytes: &[u8]) -> String {
    const ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    let mut result = String::new();
    let mut buffer: u64 = 0;
    let mut bits_in_buffer = 0;

    for &byte in bytes {
        buffer = (buffer << 8) | (byte as u64);
        bits_in_buffer += 8;

        while bits_in_buffer >= 5 {
            bits_in_buffer -= 5;
            let index = ((buffer >> bits_in_buffer) & 0x1F) as usize;
            result.push(ALPHABET[index] as char);
        }
    }

    // Handle remaining bits
    if bits_in_buffer > 0 {
        let index = ((buffer << (5 - bits_in_buffer)) & 0x1F) as usize;
        result.push(ALPHABET[index] as char);
    }

    result
}

/// URL-encode a string.
fn urlencoding(s: &str) -> String {
    let mut result = String::new();
    for c in s.chars() {
        match c {
            'a'..='z' | 'A'..='Z' | '0'..='9' | '-' | '_' | '.' | '~' => {
                result.push(c);
            }
            _ => {
                for byte in c.to_string().bytes() {
                    result.push_str(&format!("%{:02X}", byte));
                }
            }
        }
    }
    result
}

/// Decode Base32 secret to bytes.
pub fn base32_decode(input: &str) -> Option<Vec<u8>> {
    const ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    let input = input.to_uppercase();
    let input = input.trim_end_matches('=');

    let mut result = Vec::new();
    let mut buffer: u64 = 0;
    let mut bits_in_buffer = 0;

    for c in input.chars() {
        let value = ALPHABET.iter().position(|&x| x == c as u8)?;
        buffer = (buffer << 5) | (value as u64);
        bits_in_buffer += 5;

        if bits_in_buffer >= 8 {
            bits_in_buffer -= 8;
            result.push((buffer >> bits_in_buffer) as u8);
            buffer &= (1 << bits_in_buffer) - 1;
        }
    }

    Some(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_totp_secret() {
        let setup = generate_totp_secret("test@example.com");

        // Secret should be Base32 encoded (uppercase letters and 2-7)
        assert!(setup.secret.chars().all(|c| c.is_ascii_uppercase() || ('2'..='7').contains(&c)));

        // URL should contain the secret
        assert!(setup.otpauth_url.contains(&setup.secret));
        assert!(setup.otpauth_url.contains("CampReserv"));
        assert!(setup.otpauth_url.contains("test%40example.com"));
    }

    #[test]
    fn test_base32_encode_decode() {
        let original = b"Hello World!";
        let encoded = base32_encode(original);
        let decoded = base32_decode(&encoded).unwrap();

        assert_eq!(original.to_vec(), decoded);
    }

    #[test]
    fn test_unique_secrets() {
        let setup1 = generate_totp_secret("test@example.com");
        let setup2 = generate_totp_secret("test@example.com");

        // Each call should generate a unique secret
        assert_ne!(setup1.secret, setup2.secret);
    }
}
