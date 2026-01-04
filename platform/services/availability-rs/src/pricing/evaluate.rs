//! Pricing evaluation engine.
//!
//! Implements the complex pricing evaluation with rule stacking,
//! demand adjustments, and nightly breakdown.

use chrono::{Duration, NaiveDate};
use std::collections::HashSet;

use crate::error::{AppError, Result};
use super::types::*;
use super::rules::{rule_applies, compute_adjustment, compute_demand_adjustment, compute_nights};

/// Evaluate pricing for a reservation.
pub fn evaluate_pricing(request: &EvaluatePricingRequest) -> Result<PricingResult> {
    let nights = compute_nights(request.arrival_date, request.departure_date);

    if nights == 0 {
        return Err(AppError::Validation(
            "Departure must be after arrival".to_string(),
        ));
    }

    let base_subtotal_cents = request
        .base_rate_cents
        .checked_mul(nights)
        .ok_or_else(|| AppError::Overflow("Base subtotal overflow".to_string()))?;

    // Sort rules by priority (lower = higher priority)
    let mut sorted_rules: Vec<&PricingRule> = request.rules.iter().collect();
    sorted_rules.sort_by_key(|r| r.priority);

    let mut night_breakdown = Vec::with_capacity(nights as usize);
    let mut total_cents: u32 = 0;
    let mut applied_rules_set = HashSet::new();

    // Evaluate each night
    for i in 0..nights {
        let date = request.arrival_date + Duration::days(i as i64);
        let (night_result, rules_used) = evaluate_night(
            date,
            request.base_rate_cents,
            nights,
            &sorted_rules,
            request.demand_bands.as_deref(),
            request.current_occupancy,
        )?;

        // Track which rules were applied
        for rule_id in &rules_used {
            applied_rules_set.insert(rule_id.clone());
        }

        // Add to total with overflow check
        total_cents = total_cents
            .checked_add(night_result.final_rate_cents)
            .ok_or_else(|| AppError::Overflow("Total price overflow".to_string()))?;

        night_breakdown.push(night_result);
    }

    let rules_delta_cents = total_cents as i32 - base_subtotal_cents as i32;
    let avg_nightly_rate_cents = if nights > 0 {
        total_cents / nights
    } else {
        0
    };

    Ok(PricingResult {
        nights,
        base_subtotal_cents,
        total_cents,
        rules_delta_cents,
        avg_nightly_rate_cents,
        night_breakdown,
        applied_rules: applied_rules_set.into_iter().collect(),
    })
}

/// Evaluate pricing for a single night.
fn evaluate_night(
    date: NaiveDate,
    base_rate_cents: u32,
    total_nights: u32,
    rules: &[&PricingRule],
    demand_bands: Option<&[DemandBand]>,
    current_occupancy: Option<i32>,
) -> Result<(NightBreakdown, Vec<String>)> {
    let mut night_rate = base_rate_cents as i32;
    let mut rules_applied = Vec::new();
    let mut max_adjustment: Option<i32> = None;

    // Group rules by stack mode for proper handling
    for rule in rules {
        if !rule_applies(rule, date, total_nights) {
            continue;
        }

        let adjustment = compute_adjustment(base_rate_cents, rule);

        match rule.stack_mode {
            PricingStackMode::Override => {
                // First matching override wins, apply and stop
                night_rate = (base_rate_cents as i32) + adjustment;
                rules_applied.clear();
                rules_applied.push(rule.id.clone());
                break;
            }
            PricingStackMode::Additive => {
                // Add adjustment to current rate
                night_rate = night_rate
                    .checked_add(adjustment)
                    .ok_or_else(|| AppError::Overflow("Night rate overflow".to_string()))?;
                rules_applied.push(rule.id.clone());
            }
            PricingStackMode::Max => {
                // Track maximum adjustment
                match max_adjustment {
                    Some(current_max) if adjustment > current_max => {
                        max_adjustment = Some(adjustment);
                        // Replace with this rule
                        rules_applied.retain(|id| {
                            rules.iter().any(|r| &r.id == id && r.stack_mode != PricingStackMode::Max)
                        });
                        rules_applied.push(rule.id.clone());
                    }
                    None => {
                        max_adjustment = Some(adjustment);
                        rules_applied.push(rule.id.clone());
                    }
                    _ => {}
                }
            }
        }
    }

    // Apply max adjustment if any
    if let Some(max_adj) = max_adjustment {
        night_rate = night_rate
            .checked_add(max_adj)
            .ok_or_else(|| AppError::Overflow("Night rate overflow with max".to_string()))?;
    }

    // Apply demand adjustment last
    if let (Some(bands), Some(occupancy)) = (demand_bands, current_occupancy) {
        let demand_adj = compute_demand_adjustment(base_rate_cents, occupancy, bands);
        if demand_adj != 0 {
            night_rate = night_rate
                .checked_add(demand_adj)
                .ok_or_else(|| AppError::Overflow("Night rate overflow with demand".to_string()))?;
            rules_applied.push("demand_adjustment".to_string());
        }
    }

    // Ensure rate doesn't go negative
    let final_rate_cents = night_rate.max(0) as u32;
    let adjustment_cents = final_rate_cents as i32 - base_rate_cents as i32;

    Ok((
        NightBreakdown {
            date,
            base_rate_cents,
            final_rate_cents,
            adjustment_cents,
            rules_applied: rules_applied.clone(),
        },
        rules_applied,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_rule(
        id: &str,
        adjustment_value: i32,
        stack_mode: PricingStackMode,
        priority: i32,
    ) -> PricingRule {
        PricingRule {
            id: id.to_string(),
            name: id.to_string(),
            rule_type: PricingRuleType::Season,
            priority,
            stack_mode,
            adjustment_type: AdjustmentType::Percent,
            adjustment_value,
            start_date: None,
            end_date: None,
            dow_mask: None,
            min_nights: None,
            site_class_id: None,
            campground_id: "camp1".to_string(),
        }
    }

    #[test]
    fn test_evaluate_pricing_no_rules() {
        let request = EvaluatePricingRequest {
            campground_id: "camp1".to_string(),
            site_class_id: None,
            base_rate_cents: 5000, // $50/night
            arrival_date: NaiveDate::from_ymd_opt(2025, 6, 15).unwrap(),
            departure_date: NaiveDate::from_ymd_opt(2025, 6, 18).unwrap(),
            rules: vec![],
            demand_bands: None,
            current_occupancy: None,
        };

        let result = evaluate_pricing(&request).unwrap();

        assert_eq!(result.nights, 3);
        assert_eq!(result.base_subtotal_cents, 15000); // $150
        assert_eq!(result.total_cents, 15000);
        assert_eq!(result.rules_delta_cents, 0);
    }

    #[test]
    fn test_evaluate_pricing_with_additive_rules() {
        let request = EvaluatePricingRequest {
            campground_id: "camp1".to_string(),
            site_class_id: None,
            base_rate_cents: 5000, // $50/night
            arrival_date: NaiveDate::from_ymd_opt(2025, 6, 15).unwrap(),
            departure_date: NaiveDate::from_ymd_opt(2025, 6, 17).unwrap(),
            rules: vec![
                create_test_rule("summer", 10, PricingStackMode::Additive, 1), // +10%
                create_test_rule("promo", -5, PricingStackMode::Additive, 2),   // -5%
            ],
            demand_bands: None,
            current_occupancy: None,
        };

        let result = evaluate_pricing(&request).unwrap();

        assert_eq!(result.nights, 2);
        // Base: $50/night, +10% = $5, -5% = -$2.50 -> $52.50/night
        // 2 nights = $105
        assert_eq!(result.total_cents, 10500);
        assert_eq!(result.rules_delta_cents, 500); // $5 more than base
    }

    #[test]
    fn test_evaluate_pricing_with_override_rule() {
        let request = EvaluatePricingRequest {
            campground_id: "camp1".to_string(),
            site_class_id: None,
            base_rate_cents: 5000, // $50/night
            arrival_date: NaiveDate::from_ymd_opt(2025, 6, 15).unwrap(),
            departure_date: NaiveDate::from_ymd_opt(2025, 6, 16).unwrap(),
            rules: vec![
                create_test_rule("holiday", 50, PricingStackMode::Override, 1), // +50% override
                create_test_rule("summer", 10, PricingStackMode::Additive, 2),   // Should be ignored
            ],
            demand_bands: None,
            current_occupancy: None,
        };

        let result = evaluate_pricing(&request).unwrap();

        assert_eq!(result.nights, 1);
        // Override takes precedence: $50 + 50% = $75
        assert_eq!(result.total_cents, 7500);
    }

    #[test]
    fn test_evaluate_pricing_invalid_dates() {
        let request = EvaluatePricingRequest {
            campground_id: "camp1".to_string(),
            site_class_id: None,
            base_rate_cents: 5000,
            arrival_date: NaiveDate::from_ymd_opt(2025, 6, 18).unwrap(),
            departure_date: NaiveDate::from_ymd_opt(2025, 6, 15).unwrap(), // Before arrival
            rules: vec![],
            demand_bands: None,
            current_occupancy: None,
        };

        let result = evaluate_pricing(&request);
        assert!(result.is_err());
    }
}
