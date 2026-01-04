//! Rule matching and adjustment calculation.

use chrono::{Datelike, NaiveDate};

use super::types::{AdjustmentType, PricingRule, DemandBand};

/// Check if a rule applies to a given date.
pub fn rule_applies(rule: &PricingRule, date: NaiveDate, nights: u32) -> bool {
    // Check date range
    if let Some(start) = rule.start_date {
        if date < start {
            return false;
        }
    }
    if let Some(end) = rule.end_date {
        if date > end {
            return false;
        }
    }

    // Check day of week mask
    if let Some(mask) = rule.dow_mask {
        let dow = date.weekday().num_days_from_sunday() as u8;
        let dow_bit = 1u8 << dow;
        if mask & dow_bit == 0 {
            return false;
        }
    }

    // Check minimum nights
    if let Some(min) = rule.min_nights {
        if (nights as i32) < min {
            return false;
        }
    }

    true
}

/// Compute the adjustment amount for a rule.
pub fn compute_adjustment(base_rate_cents: u32, rule: &PricingRule) -> i32 {
    match rule.adjustment_type {
        AdjustmentType::Percent => {
            // Percentage adjustment
            // e.g., 10 means +10%, -10 means -10%
            let adjustment = (base_rate_cents as f64) * (rule.adjustment_value as f64 / 100.0);
            adjustment.round() as i32
        }
        AdjustmentType::Flat => {
            // Flat adjustment in cents
            rule.adjustment_value
        }
    }
}

/// Compute demand adjustment based on occupancy.
pub fn compute_demand_adjustment(
    base_rate_cents: u32,
    occupancy: i32,
    demand_bands: &[DemandBand],
) -> i32 {
    // Find the matching demand band
    for band in demand_bands {
        if occupancy >= band.min_occupancy && occupancy <= band.max_occupancy {
            return match band.adjustment_type {
                AdjustmentType::Percent => {
                    let adjustment = (base_rate_cents as f64) * (band.adjustment_value as f64 / 100.0);
                    adjustment.round() as i32
                }
                AdjustmentType::Flat => band.adjustment_value,
            };
        }
    }

    0 // No matching band
}

/// Compute the number of nights between two dates.
pub fn compute_nights(arrival: NaiveDate, departure: NaiveDate) -> u32 {
    if departure <= arrival {
        return 0;
    }

    let duration = departure.signed_duration_since(arrival);
    duration.num_days().max(0) as u32
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::types::*;

    #[test]
    fn test_compute_nights() {
        let arrival = NaiveDate::from_ymd_opt(2025, 6, 15).unwrap();
        let departure = NaiveDate::from_ymd_opt(2025, 6, 20).unwrap();
        assert_eq!(compute_nights(arrival, departure), 5);
    }

    #[test]
    fn test_compute_nights_same_day() {
        let date = NaiveDate::from_ymd_opt(2025, 6, 15).unwrap();
        assert_eq!(compute_nights(date, date), 0);
    }

    #[test]
    fn test_compute_nights_departure_before_arrival() {
        let arrival = NaiveDate::from_ymd_opt(2025, 6, 20).unwrap();
        let departure = NaiveDate::from_ymd_opt(2025, 6, 15).unwrap();
        assert_eq!(compute_nights(arrival, departure), 0);
    }

    #[test]
    fn test_rule_applies_date_range() {
        let rule = PricingRule {
            id: "rule1".to_string(),
            name: "Summer".to_string(),
            rule_type: PricingRuleType::Season,
            priority: 1,
            stack_mode: PricingStackMode::Additive,
            adjustment_type: AdjustmentType::Percent,
            adjustment_value: 20,
            start_date: Some(NaiveDate::from_ymd_opt(2025, 6, 1).unwrap()),
            end_date: Some(NaiveDate::from_ymd_opt(2025, 8, 31).unwrap()),
            dow_mask: None,
            min_nights: None,
            site_class_id: None,
            campground_id: "camp1".to_string(),
        };

        // Inside range
        assert!(rule_applies(
            &rule,
            NaiveDate::from_ymd_opt(2025, 7, 15).unwrap(),
            3
        ));

        // Before range
        assert!(!rule_applies(
            &rule,
            NaiveDate::from_ymd_opt(2025, 5, 15).unwrap(),
            3
        ));

        // After range
        assert!(!rule_applies(
            &rule,
            NaiveDate::from_ymd_opt(2025, 9, 15).unwrap(),
            3
        ));
    }

    #[test]
    fn test_rule_applies_dow_mask() {
        // Weekend only (Fri=5, Sat=6) = bits 5,6 = 32+64 = 96
        let rule = PricingRule {
            id: "rule1".to_string(),
            name: "Weekend".to_string(),
            rule_type: PricingRuleType::Weekend,
            priority: 1,
            stack_mode: PricingStackMode::Additive,
            adjustment_type: AdjustmentType::Percent,
            adjustment_value: 15,
            start_date: None,
            end_date: None,
            dow_mask: Some(96), // Fri + Sat
            min_nights: None,
            site_class_id: None,
            campground_id: "camp1".to_string(),
        };

        // Saturday
        assert!(rule_applies(
            &rule,
            NaiveDate::from_ymd_opt(2025, 6, 14).unwrap(), // Saturday
            2
        ));

        // Monday
        assert!(!rule_applies(
            &rule,
            NaiveDate::from_ymd_opt(2025, 6, 16).unwrap(), // Monday
            2
        ));
    }

    #[test]
    fn test_compute_adjustment_percent() {
        let rule = PricingRule {
            id: "rule1".to_string(),
            name: "Test".to_string(),
            rule_type: PricingRuleType::Season,
            priority: 1,
            stack_mode: PricingStackMode::Additive,
            adjustment_type: AdjustmentType::Percent,
            adjustment_value: 10, // +10%
            start_date: None,
            end_date: None,
            dow_mask: None,
            min_nights: None,
            site_class_id: None,
            campground_id: "camp1".to_string(),
        };

        // 10% of $100 = $10
        assert_eq!(compute_adjustment(10000, &rule), 1000);
    }

    #[test]
    fn test_compute_adjustment_flat() {
        let rule = PricingRule {
            id: "rule1".to_string(),
            name: "Test".to_string(),
            rule_type: PricingRuleType::Holiday,
            priority: 1,
            stack_mode: PricingStackMode::Additive,
            adjustment_type: AdjustmentType::Flat,
            adjustment_value: 2500, // +$25
            start_date: None,
            end_date: None,
            dow_mask: None,
            min_nights: None,
            site_class_id: None,
            campground_id: "camp1".to_string(),
        };

        assert_eq!(compute_adjustment(10000, &rule), 2500);
    }

    #[test]
    fn test_compute_demand_adjustment() {
        let bands = vec![
            DemandBand {
                id: "band1".to_string(),
                min_occupancy: 0,
                max_occupancy: 50,
                adjustment_type: AdjustmentType::Percent,
                adjustment_value: -10, // -10% discount
                campground_id: "camp1".to_string(),
            },
            DemandBand {
                id: "band2".to_string(),
                min_occupancy: 51,
                max_occupancy: 80,
                adjustment_type: AdjustmentType::Percent,
                adjustment_value: 0, // No change
                campground_id: "camp1".to_string(),
            },
            DemandBand {
                id: "band3".to_string(),
                min_occupancy: 81,
                max_occupancy: 100,
                adjustment_type: AdjustmentType::Percent,
                adjustment_value: 20, // +20% premium
                campground_id: "camp1".to_string(),
            },
        ];

        // Low occupancy: -10%
        assert_eq!(compute_demand_adjustment(10000, 30, &bands), -1000);

        // Medium occupancy: 0%
        assert_eq!(compute_demand_adjustment(10000, 70, &bands), 0);

        // High occupancy: +20%
        assert_eq!(compute_demand_adjustment(10000, 90, &bands), 2000);
    }
}
