//! Deposit calculation module.

use serde::{Deserialize, Serialize};

use crate::error::{AppError, Result};

/// Deposit calculation strategy.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DepositStrategy {
    /// Deposit is the first night's rate
    FirstNight,
    /// Deposit is a percentage of total
    Percent,
    /// Deposit is a fixed amount
    Fixed,
}

/// What the deposit applies to.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DepositApplyTo {
    /// Apply to lodging only
    LodgingOnly,
    /// Apply to lodging plus fees
    LodgingPlusFees,
}

/// Deposit policy configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DepositPolicy {
    /// Policy ID
    pub id: String,
    /// Strategy for calculating deposit
    pub strategy: DepositStrategy,
    /// Value for strategy (percentage or fixed cents)
    pub value: u32,
    /// What to apply deposit to
    pub apply_to: DepositApplyTo,
    /// Minimum deposit cap in cents
    pub min_cap: Option<u32>,
    /// Maximum deposit cap in cents
    pub max_cap: Option<u32>,
}

/// Request to calculate deposit.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CalculateDepositRequest {
    /// Total lodging amount in cents
    pub lodging_cents: u32,
    /// First night's rate in cents
    pub first_night_rate_cents: u32,
    /// Total fees in cents
    pub fees_cents: u32,
    /// Deposit policy to apply
    pub policy: DepositPolicy,
}

/// Result of deposit calculation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DepositResult {
    /// Deposit amount in cents
    pub deposit_cents: u32,
    /// Base amount used for calculation
    pub base_amount_cents: u32,
    /// Strategy used
    pub strategy: DepositStrategy,
    /// Whether min cap was applied
    pub min_cap_applied: bool,
    /// Whether max cap was applied
    pub max_cap_applied: bool,
}

/// Calculate deposit amount based on policy.
pub fn calculate_deposit(request: &CalculateDepositRequest) -> Result<DepositResult> {
    let policy = &request.policy;

    // Determine base amount
    let base_amount_cents = match policy.apply_to {
        DepositApplyTo::LodgingOnly => request.lodging_cents,
        DepositApplyTo::LodgingPlusFees => request
            .lodging_cents
            .checked_add(request.fees_cents)
            .ok_or_else(|| AppError::Overflow("Base amount overflow".to_string()))?,
    };

    // Calculate deposit based on strategy
    let mut deposit_cents = match policy.strategy {
        DepositStrategy::FirstNight => request.first_night_rate_cents,
        DepositStrategy::Percent => {
            let deposit = (base_amount_cents as f64) * (policy.value as f64 / 100.0);
            deposit.round() as u32
        }
        DepositStrategy::Fixed => policy.value,
    };

    let mut min_cap_applied = false;
    let mut max_cap_applied = false;

    // Apply minimum cap
    if let Some(min) = policy.min_cap {
        if deposit_cents < min {
            deposit_cents = min;
            min_cap_applied = true;
        }
    }

    // Apply maximum cap
    if let Some(max) = policy.max_cap {
        if deposit_cents > max {
            deposit_cents = max;
            max_cap_applied = true;
        }
    }

    // Deposit cannot exceed base amount
    if deposit_cents > base_amount_cents {
        deposit_cents = base_amount_cents;
    }

    Ok(DepositResult {
        deposit_cents,
        base_amount_cents,
        strategy: policy.strategy,
        min_cap_applied,
        max_cap_applied,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_policy(strategy: DepositStrategy, value: u32) -> DepositPolicy {
        DepositPolicy {
            id: "policy1".to_string(),
            strategy,
            value,
            apply_to: DepositApplyTo::LodgingOnly,
            min_cap: None,
            max_cap: None,
        }
    }

    #[test]
    fn test_calculate_deposit_first_night() {
        let request = CalculateDepositRequest {
            lodging_cents: 30000, // $300 total
            first_night_rate_cents: 10000, // $100/night
            fees_cents: 0,
            policy: create_test_policy(DepositStrategy::FirstNight, 0),
        };

        let result = calculate_deposit(&request).unwrap();
        assert_eq!(result.deposit_cents, 10000); // First night
    }

    #[test]
    fn test_calculate_deposit_percent() {
        let request = CalculateDepositRequest {
            lodging_cents: 30000, // $300 total
            first_night_rate_cents: 10000,
            fees_cents: 0,
            policy: create_test_policy(DepositStrategy::Percent, 50), // 50%
        };

        let result = calculate_deposit(&request).unwrap();
        assert_eq!(result.deposit_cents, 15000); // 50% of $300 = $150
    }

    #[test]
    fn test_calculate_deposit_fixed() {
        let request = CalculateDepositRequest {
            lodging_cents: 30000,
            first_night_rate_cents: 10000,
            fees_cents: 0,
            policy: create_test_policy(DepositStrategy::Fixed, 5000), // $50 fixed
        };

        let result = calculate_deposit(&request).unwrap();
        assert_eq!(result.deposit_cents, 5000);
    }

    #[test]
    fn test_calculate_deposit_with_min_cap() {
        let mut policy = create_test_policy(DepositStrategy::Percent, 10); // 10%
        policy.min_cap = Some(5000); // $50 minimum

        let request = CalculateDepositRequest {
            lodging_cents: 10000, // $100 -> 10% = $10, below minimum
            first_night_rate_cents: 10000,
            fees_cents: 0,
            policy,
        };

        let result = calculate_deposit(&request).unwrap();
        assert_eq!(result.deposit_cents, 5000); // Minimum cap applied
        assert!(result.min_cap_applied);
    }

    #[test]
    fn test_calculate_deposit_with_max_cap() {
        let mut policy = create_test_policy(DepositStrategy::Percent, 50); // 50%
        policy.max_cap = Some(10000); // $100 maximum

        let request = CalculateDepositRequest {
            lodging_cents: 50000, // $500 -> 50% = $250, above maximum
            first_night_rate_cents: 10000,
            fees_cents: 0,
            policy,
        };

        let result = calculate_deposit(&request).unwrap();
        assert_eq!(result.deposit_cents, 10000); // Maximum cap applied
        assert!(result.max_cap_applied);
    }

    #[test]
    fn test_calculate_deposit_with_fees() {
        let mut policy = create_test_policy(DepositStrategy::Percent, 50);
        policy.apply_to = DepositApplyTo::LodgingPlusFees;

        let request = CalculateDepositRequest {
            lodging_cents: 30000, // $300
            first_night_rate_cents: 10000,
            fees_cents: 2000, // $20 fees
            policy,
        };

        let result = calculate_deposit(&request).unwrap();
        assert_eq!(result.base_amount_cents, 32000); // $300 + $20
        assert_eq!(result.deposit_cents, 16000); // 50% of $320 = $160
    }

    #[test]
    fn test_calculate_deposit_cannot_exceed_total() {
        let request = CalculateDepositRequest {
            lodging_cents: 5000, // $50 total
            first_night_rate_cents: 5000,
            fees_cents: 0,
            policy: create_test_policy(DepositStrategy::Fixed, 10000), // $100 fixed (exceeds total)
        };

        let result = calculate_deposit(&request).unwrap();
        assert_eq!(result.deposit_cents, 5000); // Capped at total
    }
}
