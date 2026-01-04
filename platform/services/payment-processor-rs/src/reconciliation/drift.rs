//! Drift detection for reconciliation.
//!
//! Compares expected vs actual amounts to detect discrepancies.

use serde::{Deserialize, Serialize};

/// Reconciliation summary with drift detection.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReconciliationSummary {
    /// Payout ID
    pub payout_id: String,
    /// Campground ID
    pub campground_id: String,
    /// Expected amount from Stripe
    pub expected_amount_cents: i64,
    /// Actual amount from ledger
    pub actual_amount_cents: i64,
    /// Drift amount (expected - actual)
    pub drift_cents: i64,
    /// Whether drift exceeds threshold
    pub has_drift: bool,
    /// Breakdown of amounts by category
    pub breakdown: ReconciliationBreakdown,
}

/// Breakdown of amounts by category.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReconciliationBreakdown {
    /// Total payments
    pub payments_cents: i64,
    /// Total refunds
    pub refunds_cents: i64,
    /// Total Stripe fees
    pub stripe_fees_cents: i64,
    /// Total platform fees
    pub platform_fees_cents: i64,
    /// Total chargebacks
    pub chargebacks_cents: i64,
    /// Net amount (should match payout)
    pub net_cents: i64,
}

/// Compute reconciliation summary.
pub fn compute_reconciliation_summary(
    payout_id: &str,
    campground_id: &str,
    stripe_amount_cents: i64,
    payments_cents: i64,
    refunds_cents: i64,
    stripe_fees_cents: i64,
    platform_fees_cents: i64,
    chargebacks_cents: i64,
    drift_threshold_cents: i64,
) -> ReconciliationSummary {
    let net_cents = payments_cents - refunds_cents - stripe_fees_cents - platform_fees_cents - chargebacks_cents;
    let drift_cents = stripe_amount_cents - net_cents;
    let has_drift = drift_cents.abs() > drift_threshold_cents;

    ReconciliationSummary {
        payout_id: payout_id.to_string(),
        campground_id: campground_id.to_string(),
        expected_amount_cents: stripe_amount_cents,
        actual_amount_cents: net_cents,
        drift_cents,
        has_drift,
        breakdown: ReconciliationBreakdown {
            payments_cents,
            refunds_cents,
            stripe_fees_cents,
            platform_fees_cents,
            chargebacks_cents,
            net_cents,
        },
    }
}

/// Alert data for drift notification.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DriftAlert {
    /// Payout ID
    pub payout_id: String,
    /// Campground ID
    pub campground_id: String,
    /// Drift amount in cents
    pub drift_cents: i64,
    /// Human-readable message
    pub message: String,
    /// Severity level
    pub severity: AlertSeverity,
}

/// Severity level for alerts.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AlertSeverity {
    Warning,
    Critical,
}

/// Create a drift alert if needed.
pub fn create_drift_alert(
    summary: &ReconciliationSummary,
    warning_threshold_cents: i64,
    critical_threshold_cents: i64,
) -> Option<DriftAlert> {
    if !summary.has_drift {
        return None;
    }

    let abs_drift = summary.drift_cents.abs();
    let severity = if abs_drift >= critical_threshold_cents {
        AlertSeverity::Critical
    } else if abs_drift >= warning_threshold_cents {
        AlertSeverity::Warning
    } else {
        return None;
    };

    let drift_dollars = (summary.drift_cents as f64) / 100.0;
    let message = format!(
        "Payout {} for campground {} has drift of ${:.2}",
        summary.payout_id, summary.campground_id, drift_dollars
    );

    Some(DriftAlert {
        payout_id: summary.payout_id.clone(),
        campground_id: summary.campground_id.clone(),
        drift_cents: summary.drift_cents,
        message,
        severity,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_reconciliation_no_drift() {
        let summary = compute_reconciliation_summary(
            "po_123",
            "camp_123",
            9680, // Expected payout
            10000, // Payments
            0,     // Refunds
            320,   // Stripe fees (2.9% + $0.30)
            0,     // Platform fees
            0,     // Chargebacks
            100,   // Threshold: $1.00
        );

        assert_eq!(summary.drift_cents, 0);
        assert!(!summary.has_drift);
        assert_eq!(summary.breakdown.net_cents, 9680);
    }

    #[test]
    fn test_compute_reconciliation_with_drift() {
        let summary = compute_reconciliation_summary(
            "po_123",
            "camp_123",
            9700, // Expected payout (wrong)
            10000, // Payments
            0,
            320,
            0,
            0,
            100, // Threshold: $1.00
        );

        // Drift = 9700 - 9680 = 20
        assert_eq!(summary.drift_cents, 20);
        assert!(!summary.has_drift); // Under threshold
    }

    #[test]
    fn test_compute_reconciliation_with_significant_drift() {
        let summary = compute_reconciliation_summary(
            "po_123",
            "camp_123",
            10000, // Expected (wrong)
            10000,
            0,
            320,
            0,
            0,
            100,
        );

        // Drift = 10000 - 9680 = 320
        assert_eq!(summary.drift_cents, 320);
        assert!(summary.has_drift); // Over threshold
    }

    #[test]
    fn test_create_drift_alert_warning() {
        let summary = ReconciliationSummary {
            payout_id: "po_123".to_string(),
            campground_id: "camp_123".to_string(),
            expected_amount_cents: 10200,
            actual_amount_cents: 10000,
            drift_cents: 200,
            has_drift: true,
            breakdown: ReconciliationBreakdown {
                payments_cents: 10000,
                refunds_cents: 0,
                stripe_fees_cents: 0,
                platform_fees_cents: 0,
                chargebacks_cents: 0,
                net_cents: 10000,
            },
        };

        let alert = create_drift_alert(&summary, 100, 1000);
        assert!(alert.is_some());

        let alert = alert.unwrap();
        assert!(matches!(alert.severity, AlertSeverity::Warning));
    }

    #[test]
    fn test_create_drift_alert_critical() {
        let summary = ReconciliationSummary {
            payout_id: "po_123".to_string(),
            campground_id: "camp_123".to_string(),
            expected_amount_cents: 15000,
            actual_amount_cents: 10000,
            drift_cents: 5000,
            has_drift: true,
            breakdown: ReconciliationBreakdown {
                payments_cents: 10000,
                refunds_cents: 0,
                stripe_fees_cents: 0,
                platform_fees_cents: 0,
                chargebacks_cents: 0,
                net_cents: 10000,
            },
        };

        let alert = create_drift_alert(&summary, 100, 1000);
        assert!(alert.is_some());

        let alert = alert.unwrap();
        assert!(matches!(alert.severity, AlertSeverity::Critical));
    }
}
