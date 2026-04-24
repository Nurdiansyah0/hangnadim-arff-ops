use chrono::NaiveDate;
use serde::Deserialize;
use std::collections::HashSet;

#[derive(Debug, Deserialize)]
pub struct Holiday {
    pub date: String,
    pub name: String,
}

pub struct HolidayService;

impl HolidayService {
    /// Fetch Indonesian public holidays for a given year.
    pub async fn get_holidays(year: i32) -> Result<HashSet<NaiveDate>, String> {
        // Using open source API
        let url = format!("https://libur.deno.dev/api?year={}", year);

        let response = reqwest::get(&url)
            .await
            .map_err(|e| format!("Failed to fetch holidays: {}", e))?;

        let holidays: Vec<Holiday> = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse holidays: {}", e))?;

        let holiday_dates: HashSet<NaiveDate> = holidays
            .into_iter()
            .filter_map(|h| NaiveDate::parse_from_str(&h.date, "%Y-%m-%d").ok())
            .collect();

        Ok(holiday_dates)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_fetch_holidays() {
        let holidays = HolidayService::get_holidays(2026).await.unwrap();
        println!("\n=== BUKTI INTEGRASI API HARI LIBUR (2026) ===");
        println!("Berhasil mengambil {} hari libur nasional.", holidays.len());

        let mut sorted_dates: Vec<_> = holidays.iter().collect();
        sorted_dates.sort();

        for (i, d) in sorted_dates.iter().enumerate().take(5) {
            println!("{}. {}", i + 1, d.format("%Y-%m-%d"));
        }
        if sorted_dates.len() > 5 {
            println!("... dan {} hari lainnya.", sorted_dates.len() - 5);
        }
        println!("=============================================\n");
        assert!(!holidays.is_empty(), "Holidays should not be empty");
    }
}
