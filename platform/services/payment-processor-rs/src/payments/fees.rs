//! Fee calculation logic.
//!
//! Implements the fee calculation rules for campground payments:
//! - Platform fee (flat or percentage)
//! - Gateway fee (Stripe's processing fee)
//! - Pass-through vs absorb modes

use serde::{Deserialize, Serialize};

/// Fee mode determines who pays the fee.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FeeMode {
    /// Platform/campground absorbs the fee (not charged to guest)
    Absorb,
    /// Fee is passed through to the guest (added to charge)
    PassThrough,
}

impl Default for FeeMode {
    fn default() -> Self {
        FeeMode::Absorb
    }
}

/// Fee calculation configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeeConfig {
    /// Platform fee in cents (flat amount)
    pub platform_fee_cents: u32,
    /// Platform fee percentage (0-100, e.g., 2.5 = 2.5%)
    pub platform_fee_percent: f64,
    /// How to handle platform fee
    pub platform_fee_mode: FeeMode,
    /// Gateway fee percentage (Stripe typically 2.9%)
    pub gateway_fee_percent: f64,
    /// Gateway fee flat amount in cents (Stripe typically 30 cents)
    pub gateway_fee_cents: u32,
    /// How to handle gateway fee
    pub gateway_fee_mode: FeeMode,
}

impl Default for FeeConfig {
    fn default() -> Self {
        Self {
            platform_fee_cents: 300, // $3.00
            platform_fee_percent: 0.0,
            platform_fee_mode: FeeMode::Absorb,
            gateway_fee_percent: 2.9,
            gateway_fee_cents: 30,
            gateway_fee_mode: FeeMode::Absorb,
        }
    }
}

/// Result of fee calculation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeeCalculation {
    /// Original base amount in cents
    pub base_amount_cents: u32,
    /// Platform fee in cents
    pub platform_fee_cents: u32,
    /// Gateway fee in cents
    pub gateway_fee_cents: u32,
    /// Total amount to charge the guest (base + pass-through fees)
    pub charge_amount_cents: u32,
    /// Net amount after all fees
    pub net_amount_cents: u32,
    /// Application fee amount for Stripe Connect
    pub application_fee_cents: u32,
}

/// Calculate fees for a payment.
///
/// # Arguments
/// * `base_amount_cents` - The base amount to charge in cents
/// * `config` - Fee configuration
///
/// # Returns
/// A `FeeCalculation` with all fee breakdowns
pub fn calculate_fees(base_amount_cents: u32, config: &FeeConfig) -> FeeCalculation {
    // Calculate platform fee
    let platform_fee_from_percent = if config.platform_fee_percent > 0.0 {
        ((base_amount_cents as f64) * (config.platform_fee_percent / 100.0)).round() as u32
    } else {
        0
    };
    let platform_fee_cents = config.platform_fee_cents + platform_fee_from_percent;

    // Calculate gateway fee
    let effective_amount_for_gateway = match config.platform_fee_mode {
        FeeMode::PassThrough => base_amount_cents + platform_fee_cents,
        FeeMode::Absorb => base_amount_cents,
    };

    let gateway_fee_from_percent = if config.gateway_fee_percent > 0.0 {
        ((effective_amount_for_gateway as f64) * (config.gateway_fee_percent / 100.0)).round()
            as u32
    } else {
        0
    };
    let gateway_fee_cents = config.gateway_fee_cents + gateway_fee_from_percent;

    // Calculate charge amount (what guest pays)
    let mut charge_amount_cents = base_amount_cents;
    if config.platform_fee_mode == FeeMode::PassThrough {
        charge_amount_cents = charge_amount_cents
            .checked_add(platform_fee_cents)
            .unwrap_or(u32::MAX);
    }
    if config.gateway_fee_mode == FeeMode::PassThrough {
        charge_amount_cents = charge_amount_cents
            .checked_add(gateway_fee_cents)
            .unwrap_or(u32::MAX);
    }

    // Calculate net amount (what campground receives)
    let total_fees = platform_fee_cents
        .checked_add(gateway_fee_cents)
        .unwrap_or(u32::MAX);
    let net_amount_cents = charge_amount_cents.saturating_sub(total_fees);

    // Application fee for Stripe Connect (platform's cut)
    let application_fee_cents = platform_fee_cents;

    FeeCalculation {
        base_amount_cents,
        platform_fee_cents,
        gateway_fee_cents,
        charge_amount_cents,
        net_amount_cents,
        application_fee_cents,
    }
}

/// Calculate the amount needed to ensure net amount after fees.
/// Used when campground wants to receive a specific net amount.
pub fn calculate_gross_for_net(net_amount_cents: u32, config: &FeeConfig) -> u32 {
    // This is the inverse calculation
    // For pass-through mode, we need to solve for gross where:
    // net = gross - fees(gross)

    // For simplicity in absorb mode, gross = net + fees
    if config.platform_fee_mode == FeeMode::Absorb && config.gateway_fee_mode == FeeMode::Absorb {
        let platform_fee = config.platform_fee_cents
            + ((net_amount_cents as f64) * (config.platform_fee_percent / 100.0)).round() as u32;
        let gateway_fee = config.gateway_fee_cents
            + ((net_amount_cents as f64) * (config.gateway_fee_percent / 100.0)).round() as u32;

        return net_amount_cents
            .checked_add(platform_fee)
            .and_then(|x| x.checked_add(gateway_fee))
            .unwrap_or(u32::MAX);
    }

    // For pass-through, use iterative approach
    let mut gross = net_amount_cents;
    for _ in 0..10 {
        let calc = calculate_fees(gross, config);
        if calc.net_amount_cents >= net_amount_cents {
            return gross;
        }
        let diff = net_amount_cents - calc.net_amount_cents;
        gross = gross.checked_add(diff).unwrap_or(u32::MAX);
    }

    gross
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_fees_absorb_mode() {
        let config = FeeConfig {
            platform_fee_cents: 300,
            platform_fee_percent: 0.0,
            platform_fee_mode: FeeMode::Absorb,
            gateway_fee_percent: 2.9,
            gateway_fee_cents: 30,
            gateway_fee_mode: FeeMode::Absorb,
        };

        let result = calculate_fees(10000, &config);

        // Base: $100.00
        // Platform fee: $3.00 (absorb)
        // Gateway fee: $2.90 + $0.30 = $3.20 (absorb)
        assert_eq!(result.base_amount_cents, 10000);
        assert_eq!(result.platform_fee_cents, 300);
        assert_eq!(result.gateway_fee_cents, 320); // 2.9% of 10000 = 290 + 30
        assert_eq!(result.charge_amount_cents, 10000); // Guest pays base only
        assert_eq!(result.net_amount_cents, 9380); // 10000 - 300 - 320
        assert_eq!(result.application_fee_cents, 300);
    }

    #[test]
    fn test_calculate_fees_pass_through_platform() {
        let config = FeeConfig {
            platform_fee_cents: 300,
            platform_fee_percent: 0.0,
            platform_fee_mode: FeeMode::PassThrough,
            gateway_fee_percent: 0.0,
            gateway_fee_cents: 0,
            gateway_fee_mode: FeeMode::Absorb,
        };

        let result = calculate_fees(10000, &config);

        // Base: $100.00
        // Platform fee: $3.00 (pass-through)
        assert_eq!(result.charge_amount_cents, 10300); // Guest pays base + platform fee
        assert_eq!(result.net_amount_cents, 10000); // Campground gets base amount
    }

    #[test]
    fn test_calculate_fees_percentage() {
        let config = FeeConfig {
            platform_fee_cents: 0,
            platform_fee_percent: 5.0, // 5%
            platform_fee_mode: FeeMode::Absorb,
            gateway_fee_percent: 0.0,
            gateway_fee_cents: 0,
            gateway_fee_mode: FeeMode::Absorb,
        };

        let result = calculate_fees(10000, &config);

        assert_eq!(result.platform_fee_cents, 500); // 5% of $100
    }

    #[test]
    fn test_calculate_fees_zero_amount() {
        let config = FeeConfig::default();
        let result = calculate_fees(0, &config);

        assert_eq!(result.base_amount_cents, 0);
        assert_eq!(result.platform_fee_cents, 300); // Flat fee still applies
    }
}
