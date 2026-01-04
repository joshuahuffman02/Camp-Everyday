//! Database module for auth service.
//!
//! Currently uses runtime SQL queries for flexibility.
//! Database operations are minimal as most auth logic is stateless.

use sqlx::PgPool;

use crate::error::{AppError, Result};

/// Get a user's password hash by email.
pub async fn get_user_password_hash(
    pool: &PgPool,
    email: &str,
) -> Result<Option<(String, String)>> {
    let normalized_email = email.trim().to_lowercase();

    let row: Option<(String, Option<String>)> = sqlx::query_as(
        r#"
        SELECT id, "passwordHash"
        FROM "User"
        WHERE email = $1
        "#
    )
    .bind(&normalized_email)
    .fetch_optional(pool)
    .await?;

    match row {
        Some((id, Some(hash))) => Ok(Some((id, hash))),
        Some((_, None)) => Ok(None), // User exists but no password (OAuth only)
        None => Ok(None),
    }
}

/// Get user's TOTP secret.
pub async fn get_user_totp_secret(
    pool: &PgPool,
    user_id: &str,
) -> Result<Option<String>> {
    let row: Option<(Option<String>,)> = sqlx::query_as(
        r#"
        SELECT "totpSecret"
        FROM "User"
        WHERE id = $1
        "#
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    match row {
        Some((Some(secret),)) => Ok(Some(secret)),
        _ => Ok(None),
    }
}

/// Get user's backup codes.
pub async fn get_user_backup_codes(
    pool: &PgPool,
    user_id: &str,
) -> Result<Vec<String>> {
    let row: Option<(Option<Vec<String>>,)> = sqlx::query_as(
        r#"
        SELECT "totpBackupCodes"
        FROM "User"
        WHERE id = $1
        "#
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    match row {
        Some((Some(codes),)) => Ok(codes),
        _ => Ok(vec![]),
    }
}

/// Update user's backup codes (after one is used).
pub async fn update_user_backup_codes(
    pool: &PgPool,
    user_id: &str,
    codes: &[String],
) -> Result<()> {
    sqlx::query(
        r#"
        UPDATE "User"
        SET "totpBackupCodes" = $1, "updatedAt" = NOW()
        WHERE id = $2
        "#
    )
    .bind(codes)
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(())
}

/// Log a security event for audit.
pub async fn log_security_event(
    pool: &PgPool,
    user_id: Option<&str>,
    campground_id: Option<&str>,
    event_type: &str,
    severity: &str,
    ip_address: Option<&str>,
    user_agent: Option<&str>,
    details: Option<&str>,
) -> Result<()> {
    let action = format!("SECURITY:{}", event_type);

    sqlx::query(
        r#"
        INSERT INTO "AuditLog" (
            id, action, "tableName", "recordId",
            "userId", "campgroundId",
            "oldData", "newData",
            "ipAddress", "userAgent", "createdAt"
        )
        VALUES (
            gen_random_uuid()::text, $1, 'security_events', COALESCE($2, 'system'),
            $2, $3,
            NULL, jsonb_build_object('severity', $4, 'details', $5),
            $6, $7, NOW()
        )
        "#
    )
    .bind(&action)
    .bind(user_id)
    .bind(campground_id)
    .bind(severity)
    .bind(details)
    .bind(ip_address)
    .bind(user_agent)
    .execute(pool)
    .await?;

    Ok(())
}

/// Create a mobile session with refresh token.
pub async fn create_mobile_session(
    pool: &PgPool,
    user_id: &str,
    refresh_token_hash: &str,
    device_id: Option<&str>,
    device_name: Option<&str>,
    platform: Option<&str>,
    app_version: Option<&str>,
    expires_at: chrono::DateTime<chrono::Utc>,
) -> Result<String> {
    let row: (String,) = sqlx::query_as(
        r#"
        INSERT INTO "MobileSession" (
            id, "userId", "refreshTokenHash",
            "deviceId", "deviceName", "platform", "appVersion",
            "lastUsedAt", "expiresAt", "createdAt", "updatedAt"
        )
        VALUES (
            gen_random_uuid()::text, $1, $2,
            $3, $4, $5, $6,
            NOW(), $7, NOW(), NOW()
        )
        RETURNING id
        "#
    )
    .bind(user_id)
    .bind(refresh_token_hash)
    .bind(device_id)
    .bind(device_name)
    .bind(platform)
    .bind(app_version)
    .bind(expires_at)
    .fetch_one(pool)
    .await?;

    Ok(row.0)
}

/// Validate and get mobile session by refresh token hash.
pub async fn get_mobile_session(
    pool: &PgPool,
    refresh_token_hash: &str,
) -> Result<Option<MobileSession>> {
    let row: Option<(String, String, chrono::DateTime<chrono::Utc>, Option<chrono::DateTime<chrono::Utc>>)> = sqlx::query_as(
        r#"
        SELECT id, "userId", "expiresAt", "revokedAt"
        FROM "MobileSession"
        WHERE "refreshTokenHash" = $1
        "#
    )
    .bind(refresh_token_hash)
    .fetch_optional(pool)
    .await?;

    match row {
        Some((id, user_id, expires_at, revoked_at)) => {
            Ok(Some(MobileSession {
                id,
                user_id,
                expires_at,
                revoked_at,
            }))
        }
        None => Ok(None),
    }
}

/// Mobile session data.
#[derive(Debug)]
pub struct MobileSession {
    pub id: String,
    pub user_id: String,
    pub expires_at: chrono::DateTime<chrono::Utc>,
    pub revoked_at: Option<chrono::DateTime<chrono::Utc>>,
}

impl MobileSession {
    /// Check if session is valid (not expired or revoked).
    pub fn is_valid(&self) -> bool {
        self.revoked_at.is_none() && self.expires_at > chrono::Utc::now()
    }
}

/// Revoke a mobile session.
pub async fn revoke_mobile_session(
    pool: &PgPool,
    session_id: &str,
) -> Result<()> {
    sqlx::query(
        r#"
        UPDATE "MobileSession"
        SET "revokedAt" = NOW(), "updatedAt" = NOW()
        WHERE id = $1
        "#
    )
    .bind(session_id)
    .execute(pool)
    .await?;

    Ok(())
}

/// Update mobile session last used time.
pub async fn touch_mobile_session(
    pool: &PgPool,
    session_id: &str,
) -> Result<()> {
    sqlx::query(
        r#"
        UPDATE "MobileSession"
        SET "lastUsedAt" = NOW(), "updatedAt" = NOW()
        WHERE id = $1
        "#
    )
    .bind(session_id)
    .execute(pool)
    .await?;

    Ok(())
}
