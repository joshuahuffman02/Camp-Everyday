//! Revenue forecasting module.

use chrono::{Duration, NaiveDate};
use serde::{Deserialize, Serialize};

/// Request for revenue forecast.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForecastRequest {
    /// Campground ID
    pub campground_id: String,
    /// Start date for forecast
    pub start_date: NaiveDate,
    /// Number of days to forecast
    pub days: u32,
    /// Average daily rate in cents
    pub avg_daily_rate_cents: u32,
    /// Current occupancy data per date
    pub occupancy_data: Vec<OccupancyPoint>,
}

/// Occupancy data for a single date.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OccupancyPoint {
    /// Date
    pub date: NaiveDate,
    /// Occupied sites count
    pub occupied_sites: u32,
    /// Total sites count
    pub total_sites: u32,
}

/// Forecast result for a single date.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyForecast {
    /// Date
    pub date: NaiveDate,
    /// Projected occupancy percentage
    pub occupancy_percent: f64,
    /// Projected revenue in cents
    pub projected_revenue_cents: u32,
    /// Confidence level (0-1)
    pub confidence: f64,
}

/// Complete forecast result.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForecastResult {
    /// Campground ID
    pub campground_id: String,
    /// Daily forecasts
    pub daily_forecasts: Vec<DailyForecast>,
    /// Total projected revenue in cents
    pub total_revenue_cents: u32,
    /// Average occupancy percentage
    pub avg_occupancy_percent: f64,
}

/// Generate a revenue forecast.
pub fn generate_forecast(request: &ForecastRequest) -> ForecastResult {
    let mut daily_forecasts = Vec::with_capacity(request.days as usize);
    let mut total_revenue: u32 = 0;
    let mut total_occupancy: f64 = 0.0;

    for i in 0..request.days {
        let date = request.start_date + Duration::days(i as i64);

        // Find occupancy for this date, or use a default
        let occupancy = request
            .occupancy_data
            .iter()
            .find(|p| p.date == date)
            .map(|p| {
                if p.total_sites > 0 {
                    (p.occupied_sites as f64 / p.total_sites as f64) * 100.0
                } else {
                    0.0
                }
            })
            .unwrap_or(50.0); // Default 50% if no data

        // Calculate projected revenue
        let sites_occupied = (occupancy / 100.0 * request.occupancy_data.first()
            .map(|p| p.total_sites)
            .unwrap_or(10) as f64).round() as u32;

        let daily_revenue = sites_occupied
            .checked_mul(request.avg_daily_rate_cents)
            .unwrap_or(0);

        // Confidence decreases for dates further in the future
        let days_out = i as f64;
        let confidence = (1.0 - (days_out / (request.days as f64 * 2.0))).max(0.3);

        daily_forecasts.push(DailyForecast {
            date,
            occupancy_percent: occupancy,
            projected_revenue_cents: daily_revenue,
            confidence,
        });

        total_revenue = total_revenue.saturating_add(daily_revenue);
        total_occupancy += occupancy;
    }

    let avg_occupancy = if request.days > 0 {
        total_occupancy / request.days as f64
    } else {
        0.0
    };

    ForecastResult {
        campground_id: request.campground_id.clone(),
        daily_forecasts,
        total_revenue_cents: total_revenue,
        avg_occupancy_percent: avg_occupancy,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_forecast() {
        let request = ForecastRequest {
            campground_id: "camp1".to_string(),
            start_date: NaiveDate::from_ymd_opt(2025, 6, 1).unwrap(),
            days: 7,
            avg_daily_rate_cents: 5000, // $50/night
            occupancy_data: vec![
                OccupancyPoint {
                    date: NaiveDate::from_ymd_opt(2025, 6, 1).unwrap(),
                    occupied_sites: 8,
                    total_sites: 10,
                },
            ],
        };

        let result = generate_forecast(&request);

        assert_eq!(result.daily_forecasts.len(), 7);
        assert!(result.total_revenue_cents > 0);
        assert!(result.avg_occupancy_percent > 0.0);
    }
}
