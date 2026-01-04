//! AES-256-GCM encryption implementation.

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use rand::RngCore;
use sha2::{Sha256, Digest};
use std::collections::HashMap;

use crate::error::{AppError, Result};

/// IV size in bytes (128 bits).
const IV_SIZE: usize = 12;
/// Auth tag is appended by AES-GCM (16 bytes).
const AUTH_TAG_SIZE: usize = 16;

/// Encryption configuration with key rotation support.
#[derive(Debug, Clone)]
pub struct EncryptionConfig {
    /// Current key version
    pub current_version: String,
    /// Map of version -> key
    pub keys: HashMap<String, Vec<u8>>,
}

impl EncryptionConfig {
    /// Create a new encryption config from environment.
    pub fn from_env(
        key_string: &str,
        current_version: &str,
    ) -> Self {
        let mut keys = HashMap::new();

        // Derive 256-bit key from string using SHA-256
        let key = derive_key(key_string);
        keys.insert(current_version.to_string(), key);

        Self {
            current_version: current_version.to_string(),
            keys,
        }
    }

    /// Add a historical key for decryption.
    pub fn add_key(&mut self, version: &str, key_string: &str) {
        let key = derive_key(key_string);
        self.keys.insert(version.to_string(), key);
    }
}

/// Derive a 256-bit key from a string using SHA-256.
fn derive_key(input: &str) -> Vec<u8> {
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    hasher.finalize().to_vec()
}

/// Encrypt plaintext using AES-256-GCM.
///
/// # Arguments
/// * `plaintext` - The text to encrypt
/// * `config` - Encryption configuration with keys
///
/// # Returns
/// Encrypted string in format: `version:iv_hex:authTag_hex:ciphertext_hex`
pub fn encrypt(plaintext: &str, config: &EncryptionConfig) -> Result<String> {
    let version = &config.current_version;
    let key = config.keys.get(version)
        .ok_or_else(|| AppError::EncryptionError("Key not found for version".to_string()))?;

    // Generate random IV
    let mut iv = [0u8; IV_SIZE];
    rand::thread_rng().fill_bytes(&mut iv);

    // Create cipher
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| AppError::EncryptionError(format!("Invalid key: {}", e)))?;

    // Encrypt
    let nonce = Nonce::from_slice(&iv);
    let ciphertext_with_tag = cipher.encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| AppError::EncryptionError(format!("Encryption failed: {}", e)))?;

    // Split ciphertext and auth tag
    // AES-GCM appends the auth tag to the ciphertext
    let tag_start = ciphertext_with_tag.len() - AUTH_TAG_SIZE;
    let ciphertext = &ciphertext_with_tag[..tag_start];
    let auth_tag = &ciphertext_with_tag[tag_start..];

    // Format: version:iv:authTag:ciphertext (all hex)
    let result = format!(
        "{}:{}:{}:{}",
        version,
        hex::encode(&iv),
        hex::encode(auth_tag),
        hex::encode(ciphertext)
    );

    Ok(result)
}

/// Decrypt ciphertext using AES-256-GCM.
///
/// # Arguments
/// * `encrypted` - The encrypted string (format: version:iv:authTag:ciphertext)
/// * `config` - Encryption configuration with keys
///
/// # Returns
/// Tuple of (plaintext, key_version, needs_reencrypt)
pub fn decrypt(encrypted: &str, config: &EncryptionConfig) -> Result<(String, String, bool)> {
    // Parse format: version:iv:authTag:ciphertext
    let parts: Vec<&str> = encrypted.splitn(4, ':').collect();

    if parts.len() != 4 {
        return Err(AppError::DecryptionError(
            "Invalid encrypted format".to_string(),
        ));
    }

    let version = parts[0];
    let iv_hex = parts[1];
    let auth_tag_hex = parts[2];
    let ciphertext_hex = parts[3];

    // Get key for this version
    let key = config.keys.get(version)
        .ok_or_else(|| AppError::DecryptionError(
            format!("No key found for version: {}", version)
        ))?;

    // Decode hex values
    let iv = hex::decode(iv_hex)
        .map_err(|e| AppError::DecryptionError(format!("Invalid IV: {}", e)))?;
    let auth_tag = hex::decode(auth_tag_hex)
        .map_err(|e| AppError::DecryptionError(format!("Invalid auth tag: {}", e)))?;
    let ciphertext = hex::decode(ciphertext_hex)
        .map_err(|e| AppError::DecryptionError(format!("Invalid ciphertext: {}", e)))?;

    // Reconstruct ciphertext with auth tag (as AES-GCM expects)
    let mut ciphertext_with_tag = ciphertext;
    ciphertext_with_tag.extend_from_slice(&auth_tag);

    // Create cipher
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| AppError::DecryptionError(format!("Invalid key: {}", e)))?;

    // Decrypt
    let nonce = Nonce::from_slice(&iv);
    let plaintext_bytes = cipher.decrypt(nonce, ciphertext_with_tag.as_slice())
        .map_err(|_| AppError::DecryptionError(
            "Decryption failed (invalid key or corrupted data)".to_string()
        ))?;

    let plaintext = String::from_utf8(plaintext_bytes)
        .map_err(|e| AppError::DecryptionError(format!("Invalid UTF-8: {}", e)))?;

    // Check if re-encryption is needed (different version)
    let needs_reencrypt = version != config.current_version;

    Ok((plaintext, version.to_string(), needs_reencrypt))
}

/// Helper module for hex encoding (since we can't use the hex crate directly)
mod hex {
    pub fn encode(bytes: &[u8]) -> String {
        bytes.iter().map(|b| format!("{:02x}", b)).collect()
    }

    pub fn decode(s: &str) -> std::result::Result<Vec<u8>, String> {
        if s.len() % 2 != 0 {
            return Err("Invalid hex length".to_string());
        }

        (0..s.len())
            .step_by(2)
            .map(|i| {
                u8::from_str_radix(&s[i..i + 2], 16)
                    .map_err(|e| e.to_string())
            })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_config() -> EncryptionConfig {
        EncryptionConfig::from_env("test_encryption_key_32_bytes!!", "v1")
    }

    #[test]
    fn test_encrypt_decrypt() {
        let config = test_config();
        let plaintext = "Sensitive data 123";

        let encrypted = encrypt(plaintext, &config).unwrap();
        let (decrypted, version, needs_reencrypt) = decrypt(&encrypted, &config).unwrap();

        assert_eq!(decrypted, plaintext);
        assert_eq!(version, "v1");
        assert!(!needs_reencrypt);
    }

    #[test]
    fn test_encrypted_format() {
        let config = test_config();
        let encrypted = encrypt("test", &config).unwrap();

        // Should have 4 parts
        let parts: Vec<&str> = encrypted.split(':').collect();
        assert_eq!(parts.len(), 4);
        assert_eq!(parts[0], "v1"); // version
    }

    #[test]
    fn test_different_plaintexts_different_ciphertexts() {
        let config = test_config();

        let encrypted1 = encrypt("plaintext1", &config).unwrap();
        let encrypted2 = encrypt("plaintext2", &config).unwrap();

        assert_ne!(encrypted1, encrypted2);
    }

    #[test]
    fn test_same_plaintext_different_ciphertexts() {
        let config = test_config();

        // Same plaintext should produce different ciphertext (due to random IV)
        let encrypted1 = encrypt("same text", &config).unwrap();
        let encrypted2 = encrypt("same text", &config).unwrap();

        assert_ne!(encrypted1, encrypted2);

        // But both should decrypt to the same value
        let (plain1, _, _) = decrypt(&encrypted1, &config).unwrap();
        let (plain2, _, _) = decrypt(&encrypted2, &config).unwrap();

        assert_eq!(plain1, "same text");
        assert_eq!(plain2, "same text");
    }

    #[test]
    fn test_key_rotation() {
        let mut config = test_config();

        // Encrypt with v1
        let encrypted_v1 = encrypt("test data", &config).unwrap();

        // Add v2 key and set as current
        config.add_key("v2", "new_encryption_key_32_bytes!!!");
        config.current_version = "v2".to_string();

        // Should still decrypt v1 data
        let (decrypted, version, needs_reencrypt) = decrypt(&encrypted_v1, &config).unwrap();

        assert_eq!(decrypted, "test data");
        assert_eq!(version, "v1");
        assert!(needs_reencrypt); // Old version, should re-encrypt
    }

    #[test]
    fn test_invalid_ciphertext() {
        let config = test_config();

        // Invalid format
        let result = decrypt("invalid", &config);
        assert!(result.is_err());

        // Invalid hex
        let result = decrypt("v1:xxx:xxx:xxx", &config);
        assert!(result.is_err());
    }

    #[test]
    fn test_wrong_key_fails() {
        let config1 = EncryptionConfig::from_env("key1_32_bytes_long_enough!!!!!", "v1");
        let config2 = EncryptionConfig::from_env("key2_32_bytes_long_enough!!!!!", "v1");

        let encrypted = encrypt("secret", &config1).unwrap();

        // Should fail with wrong key
        let result = decrypt(&encrypted, &config2);
        assert!(result.is_err());
    }
}
