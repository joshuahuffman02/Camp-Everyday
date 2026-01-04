//! Backup codes for TOTP fallback.

use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use rand::RngCore;

use crate::error::Result;
use crate::password::{hash_password, verify_password};

/// Number of backup codes to generate.
pub const BACKUP_CODE_COUNT: usize = 8;
/// Length of each backup code.
pub const BACKUP_CODE_LENGTH: usize = 8;
/// Bcrypt cost for backup code hashing (lower than password for performance).
pub const BACKUP_CODE_BCRYPT_COST: u32 = 10;

/// Generate backup codes for 2FA recovery.
///
/// # Returns
/// A vector of (plaintext, hashed) backup code pairs
pub fn generate_backup_codes() -> Result<Vec<(String, String)>> {
    let mut codes = Vec::with_capacity(BACKUP_CODE_COUNT);

    for _ in 0..BACKUP_CODE_COUNT {
        let code = generate_single_code();
        let hashed = hash_backup_code(&code)?;
        codes.push((code, hashed));
    }

    Ok(codes)
}

/// Generate a single backup code.
fn generate_single_code() -> String {
    // Generate 8 random bytes (more than needed to ensure we have enough alphanumeric chars)
    let mut bytes = [0u8; 8];
    rand::thread_rng().fill_bytes(&mut bytes);

    // Encode as Base64 and clean up
    let encoded = URL_SAFE_NO_PAD.encode(bytes);

    // Convert to uppercase alphanumeric, keeping only valid chars
    // URL_SAFE_NO_PAD may include '-' and '_' which we filter out
    let mut result: String = encoded
        .chars()
        .filter(|c| c.is_ascii_alphanumeric())
        .take(BACKUP_CODE_LENGTH)
        .collect::<String>()
        .to_uppercase();

    // Pad with random digits if we don't have enough chars (shouldn't happen normally)
    while result.len() < BACKUP_CODE_LENGTH {
        let digit = (rand::random::<u8>() % 10) as char;
        result.push(char::from_digit(digit as u32, 10).unwrap_or('0'));
    }

    result
}

/// Hash a backup code for secure storage.
pub fn hash_backup_code(code: &str) -> Result<String> {
    hash_password(&code.to_uppercase(), Some(BACKUP_CODE_BCRYPT_COST))
}

/// Verify a backup code against a list of hashed codes.
///
/// # Arguments
/// * `code` - The backup code entered by the user
/// * `hashed_codes` - List of stored hashed backup codes
///
/// # Returns
/// The index of the matching code, or None if no match
pub fn verify_backup_code(code: &str, hashed_codes: &[String]) -> Result<Option<usize>> {
    let code_upper = code.trim().to_uppercase();

    for (index, hashed) in hashed_codes.iter().enumerate() {
        if verify_password(&code_upper, hashed)? {
            return Ok(Some(index));
        }
    }

    Ok(None)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_backup_codes() {
        let codes = generate_backup_codes().unwrap();

        // Should generate 8 codes
        assert_eq!(codes.len(), BACKUP_CODE_COUNT);

        // Each code should be 8 characters
        for (plaintext, hashed) in &codes {
            assert_eq!(plaintext.len(), BACKUP_CODE_LENGTH);
            // Hashed should be bcrypt format
            assert!(hashed.starts_with("$2"));
        }

        // All codes should be unique
        let plaintexts: Vec<&String> = codes.iter().map(|(p, _)| p).collect();
        for i in 0..plaintexts.len() {
            for j in (i + 1)..plaintexts.len() {
                assert_ne!(plaintexts[i], plaintexts[j]);
            }
        }
    }

    #[test]
    fn test_generate_single_code_format() {
        let code = generate_single_code();

        // Should be uppercase alphanumeric
        assert!(code.chars().all(|c| c.is_ascii_uppercase() || c.is_ascii_digit()));
        // Should be 8 characters
        assert_eq!(code.len(), BACKUP_CODE_LENGTH);
    }

    #[test]
    fn test_verify_backup_code() {
        let codes = generate_backup_codes().unwrap();
        let hashed: Vec<String> = codes.iter().map(|(_, h)| h.clone()).collect();

        // Verify first code
        let (plaintext, _) = &codes[0];
        let result = verify_backup_code(plaintext, &hashed).unwrap();
        assert_eq!(result, Some(0));

        // Verify with lowercase (should still work)
        let lowercase = plaintext.to_lowercase();
        let result = verify_backup_code(&lowercase, &hashed).unwrap();
        assert_eq!(result, Some(0));

        // Wrong code should not match
        let result = verify_backup_code("WRONGCOD", &hashed).unwrap();
        assert_eq!(result, None);
    }
}
