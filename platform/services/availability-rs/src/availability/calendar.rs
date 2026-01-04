//! Calendar utilities.

use chrono::{Duration, NaiveDate, Datelike};

/// Generate all dates between two dates (inclusive of start, exclusive of end).
pub fn date_range(start: NaiveDate, end: NaiveDate) -> Vec<NaiveDate> {
    let mut dates = Vec::new();
    let mut current = start;

    while current < end {
        dates.push(current);
        current = current + Duration::days(1);
    }

    dates
}

/// Check if two date ranges overlap.
pub fn ranges_overlap(
    start1: NaiveDate,
    end1: NaiveDate,
    start2: NaiveDate,
    end2: NaiveDate,
) -> bool {
    start1 < end2 && start2 < end1
}

/// Get the day of week as a bitmask position.
/// Sunday = 0, Monday = 1, ..., Saturday = 6
pub fn dow_to_mask(date: NaiveDate) -> u8 {
    1u8 << date.weekday().num_days_from_sunday()
}

/// Check if a date matches a DOW mask.
pub fn matches_dow_mask(date: NaiveDate, mask: u8) -> bool {
    let dow_bit = dow_to_mask(date);
    mask & dow_bit != 0
}

/// Days between two dates (end - start).
pub fn days_between(start: NaiveDate, end: NaiveDate) -> i64 {
    end.signed_duration_since(start).num_days()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_date_range() {
        let start = NaiveDate::from_ymd_opt(2025, 6, 15).unwrap();
        let end = NaiveDate::from_ymd_opt(2025, 6, 18).unwrap();

        let dates = date_range(start, end);

        assert_eq!(dates.len(), 3);
        assert_eq!(dates[0], NaiveDate::from_ymd_opt(2025, 6, 15).unwrap());
        assert_eq!(dates[1], NaiveDate::from_ymd_opt(2025, 6, 16).unwrap());
        assert_eq!(dates[2], NaiveDate::from_ymd_opt(2025, 6, 17).unwrap());
    }

    #[test]
    fn test_ranges_overlap() {
        let june_15 = NaiveDate::from_ymd_opt(2025, 6, 15).unwrap();
        let june_18 = NaiveDate::from_ymd_opt(2025, 6, 18).unwrap();
        let june_17 = NaiveDate::from_ymd_opt(2025, 6, 17).unwrap();
        let june_20 = NaiveDate::from_ymd_opt(2025, 6, 20).unwrap();
        let june_10 = NaiveDate::from_ymd_opt(2025, 6, 10).unwrap();
        let june_14 = NaiveDate::from_ymd_opt(2025, 6, 14).unwrap();

        // Overlapping
        assert!(ranges_overlap(june_15, june_18, june_17, june_20));

        // Not overlapping (adjacent)
        assert!(!ranges_overlap(june_15, june_18, june_18, june_20));

        // Not overlapping (separate)
        assert!(!ranges_overlap(june_15, june_18, june_10, june_14));
    }

    #[test]
    fn test_dow_to_mask() {
        // Sunday
        let sunday = NaiveDate::from_ymd_opt(2025, 6, 15).unwrap(); // June 15, 2025 is Sunday
        assert_eq!(dow_to_mask(sunday), 1);

        // Saturday
        let saturday = NaiveDate::from_ymd_opt(2025, 6, 14).unwrap(); // June 14, 2025 is Saturday
        assert_eq!(dow_to_mask(saturday), 64);
    }

    #[test]
    fn test_matches_dow_mask() {
        let friday = NaiveDate::from_ymd_opt(2025, 6, 13).unwrap(); // Friday
        let saturday = NaiveDate::from_ymd_opt(2025, 6, 14).unwrap(); // Saturday
        let sunday = NaiveDate::from_ymd_opt(2025, 6, 15).unwrap(); // Sunday

        // Weekend mask: Fri(32) + Sat(64) = 96
        let weekend_mask: u8 = 96;

        assert!(matches_dow_mask(friday, weekend_mask));
        assert!(matches_dow_mask(saturday, weekend_mask));
        assert!(!matches_dow_mask(sunday, weekend_mask));
    }
}
