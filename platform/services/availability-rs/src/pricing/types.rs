//! Pricing types and data structures.

use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

/// Type of pricing rule.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PricingRuleType {
    /// Seasonal pricing (summer, winter, etc.)
    Season,
    /// Weekend premium
    Weekend,
    /// Holiday pricing
    Holiday,
    /// Event-based pricing
    Event,
    /// Demand-based pricing
    Demand,
}

/// How multiple rules should be combined.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PricingStackMode {
    /// Add adjustments together
    Additive,
    /// Take the maximum adjustment
    Max,
    /// First matching rule wins, stop evaluating
    Override,
}

impl Default for PricingStackMode {
    fn default() -> Self {
        PricingStackMode::Additive
    }
}

/// Type of adjustment.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AdjustmentType {
    /// Percentage adjustment (e.g., 10 = +10%)
    Percent,
    /// Flat amount adjustment in cents
    Flat,
}

/// A pricing rule.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PricingRule {
    /// Rule ID
    pub id: String,
    /// Rule name
    pub name: String,
    /// Rule type
    pub rule_type: PricingRuleType,
    /// Priority (lower = higher priority)
    pub priority: i32,
    /// Stack mode
    pub stack_mode: PricingStackMode,
    /// Adjustment type
    pub adjustment_type: AdjustmentType,
    /// Adjustment value (percentage or flat cents)
    pub adjustment_value: i32,
    /// Start date (inclusive)
    pub start_date: Option<NaiveDate>,
    /// End date (inclusive)
    pub end_date: Option<NaiveDate>,
    /// Day of week mask (0=Sun, 1=Mon, ..., 6=Sat)
    /// 127 = all days, 96 = Fri+Sat, etc.
    pub dow_mask: Option<u8>,
    /// Minimum nights required
    pub min_nights: Option<i32>,
    /// Site class ID (if rule is class-specific)
    pub site_class_id: Option<String>,
    /// Campground ID
    pub campground_id: String,
}

/// A demand band for occupancy-based pricing.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DemandBand {
    /// Band ID
    pub id: String,
    /// Minimum occupancy percentage (0-100)
    pub min_occupancy: i32,
    /// Maximum occupancy percentage (0-100)
    pub max_occupancy: i32,
    /// Adjustment type
    pub adjustment_type: AdjustmentType,
    /// Adjustment value
    pub adjustment_value: i32,
    /// Campground ID
    pub campground_id: String,
}

/// Result of pricing evaluation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PricingResult {
    /// Number of nights
    pub nights: u32,
    /// Base subtotal (base rate * nights) in cents
    pub base_subtotal_cents: u32,
    /// Total after all adjustments in cents
    pub total_cents: u32,
    /// Total adjustment from rules in cents (can be negative)
    pub rules_delta_cents: i32,
    /// Average nightly rate in cents
    pub avg_nightly_rate_cents: u32,
    /// Breakdown per night
    pub night_breakdown: Vec<NightBreakdown>,
    /// Rules that were applied
    pub applied_rules: Vec<String>,
}

/// Breakdown for a single night.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NightBreakdown {
    /// Date of the night
    pub date: NaiveDate,
    /// Base rate in cents
    pub base_rate_cents: u32,
    /// Final rate after adjustments in cents
    pub final_rate_cents: u32,
    /// Adjustment amount in cents
    pub adjustment_cents: i32,
    /// Rules applied this night
    pub rules_applied: Vec<String>,
}

/// Request to evaluate pricing.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvaluatePricingRequest {
    /// Campground ID
    pub campground_id: String,
    /// Site class ID (optional)
    pub site_class_id: Option<String>,
    /// Base rate per night in cents
    pub base_rate_cents: u32,
    /// Arrival date
    pub arrival_date: NaiveDate,
    /// Departure date
    pub departure_date: NaiveDate,
    /// Pricing rules to apply
    pub rules: Vec<PricingRule>,
    /// Demand bands (optional)
    pub demand_bands: Option<Vec<DemandBand>>,
    /// Current occupancy percentage (0-100, for demand pricing)
    pub current_occupancy: Option<i32>,
}
