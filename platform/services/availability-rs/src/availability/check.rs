//! Availability checking logic.

use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

use super::calendar::ranges_overlap;

/// A site's availability status.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SiteAvailability {
    /// Site ID
    pub site_id: String,
    /// Site name/number
    pub site_name: String,
    /// Site class ID
    pub site_class_id: String,
    /// Whether the site is available
    pub is_available: bool,
    /// Reason if not available
    pub unavailable_reason: Option<String>,
    /// Base rate per night in cents
    pub base_rate_cents: Option<u32>,
}

/// Request to check availability.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckAvailabilityRequest {
    /// Campground ID
    pub campground_id: String,
    /// Site class ID (optional, filter to specific class)
    pub site_class_id: Option<String>,
    /// Arrival date
    pub arrival_date: NaiveDate,
    /// Departure date
    pub departure_date: NaiveDate,
    /// Number of guests (optional)
    pub guest_count: Option<i32>,
    /// Required amenities (optional)
    pub required_amenities: Option<Vec<String>>,
}

/// Response from availability check.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckAvailabilityResponse {
    /// Available sites
    pub available_sites: Vec<SiteAvailability>,
    /// Total sites checked
    pub total_sites_checked: usize,
    /// Number of available sites
    pub available_count: usize,
}

/// An existing reservation blocking a site.
#[derive(Debug, Clone)]
pub struct ExistingReservation {
    pub site_id: String,
    pub arrival_date: NaiveDate,
    pub departure_date: NaiveDate,
    pub status: String,
}

/// A site's maintenance block.
#[derive(Debug, Clone)]
pub struct MaintenanceBlock {
    pub site_id: String,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub reason: String,
}

/// Check if a site is available for a date range.
pub fn is_site_available(
    site_id: &str,
    arrival: NaiveDate,
    departure: NaiveDate,
    reservations: &[ExistingReservation],
    maintenance: &[MaintenanceBlock],
) -> Result<(), String> {
    // Check against existing reservations
    for res in reservations {
        if res.site_id != site_id {
            continue;
        }

        // Skip cancelled reservations
        if res.status == "cancelled" {
            continue;
        }

        if ranges_overlap(arrival, departure, res.arrival_date, res.departure_date) {
            return Err(format!(
                "Conflicts with existing reservation from {} to {}",
                res.arrival_date, res.departure_date
            ));
        }
    }

    // Check against maintenance blocks
    for block in maintenance {
        if block.site_id != site_id {
            continue;
        }

        if ranges_overlap(arrival, departure, block.start_date, block.end_date) {
            return Err(format!(
                "Site under maintenance from {} to {}: {}",
                block.start_date, block.end_date, block.reason
            ));
        }
    }

    Ok(())
}

/// Filter sites by availability.
pub fn filter_available_sites(
    sites: &[SiteInfo],
    arrival: NaiveDate,
    departure: NaiveDate,
    reservations: &[ExistingReservation],
    maintenance: &[MaintenanceBlock],
) -> CheckAvailabilityResponse {
    let mut available_sites = Vec::new();
    let total_sites_checked = sites.len();

    for site in sites {
        let availability = match is_site_available(
            &site.id,
            arrival,
            departure,
            reservations,
            maintenance,
        ) {
            Ok(()) => SiteAvailability {
                site_id: site.id.clone(),
                site_name: site.name.clone(),
                site_class_id: site.site_class_id.clone(),
                is_available: true,
                unavailable_reason: None,
                base_rate_cents: site.base_rate_cents,
            },
            Err(reason) => SiteAvailability {
                site_id: site.id.clone(),
                site_name: site.name.clone(),
                site_class_id: site.site_class_id.clone(),
                is_available: false,
                unavailable_reason: Some(reason),
                base_rate_cents: site.base_rate_cents,
            },
        };

        if availability.is_available {
            available_sites.push(availability);
        }
    }

    let available_count = available_sites.len();

    CheckAvailabilityResponse {
        available_sites,
        total_sites_checked,
        available_count,
    }
}

/// Basic site information.
#[derive(Debug, Clone)]
pub struct SiteInfo {
    pub id: String,
    pub name: String,
    pub site_class_id: String,
    pub base_rate_cents: Option<u32>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_site_available_no_conflicts() {
        let reservations = vec![];
        let maintenance = vec![];

        let result = is_site_available(
            "site1",
            NaiveDate::from_ymd_opt(2025, 6, 15).unwrap(),
            NaiveDate::from_ymd_opt(2025, 6, 18).unwrap(),
            &reservations,
            &maintenance,
        );

        assert!(result.is_ok());
    }

    #[test]
    fn test_is_site_available_with_conflict() {
        let reservations = vec![ExistingReservation {
            site_id: "site1".to_string(),
            arrival_date: NaiveDate::from_ymd_opt(2025, 6, 16).unwrap(),
            departure_date: NaiveDate::from_ymd_opt(2025, 6, 20).unwrap(),
            status: "confirmed".to_string(),
        }];
        let maintenance = vec![];

        let result = is_site_available(
            "site1",
            NaiveDate::from_ymd_opt(2025, 6, 15).unwrap(),
            NaiveDate::from_ymd_opt(2025, 6, 18).unwrap(),
            &reservations,
            &maintenance,
        );

        assert!(result.is_err());
    }

    #[test]
    fn test_is_site_available_cancelled_ignored() {
        let reservations = vec![ExistingReservation {
            site_id: "site1".to_string(),
            arrival_date: NaiveDate::from_ymd_opt(2025, 6, 16).unwrap(),
            departure_date: NaiveDate::from_ymd_opt(2025, 6, 20).unwrap(),
            status: "cancelled".to_string(), // Cancelled reservation should be ignored
        }];
        let maintenance = vec![];

        let result = is_site_available(
            "site1",
            NaiveDate::from_ymd_opt(2025, 6, 15).unwrap(),
            NaiveDate::from_ymd_opt(2025, 6, 18).unwrap(),
            &reservations,
            &maintenance,
        );

        assert!(result.is_ok());
    }

    #[test]
    fn test_is_site_available_maintenance_block() {
        let reservations = vec![];
        let maintenance = vec![MaintenanceBlock {
            site_id: "site1".to_string(),
            start_date: NaiveDate::from_ymd_opt(2025, 6, 15).unwrap(),
            end_date: NaiveDate::from_ymd_opt(2025, 6, 17).unwrap(),
            reason: "Plumbing repair".to_string(),
        }];

        let result = is_site_available(
            "site1",
            NaiveDate::from_ymd_opt(2025, 6, 15).unwrap(),
            NaiveDate::from_ymd_opt(2025, 6, 18).unwrap(),
            &reservations,
            &maintenance,
        );

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Plumbing repair"));
    }
}
