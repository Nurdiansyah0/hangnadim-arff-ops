use crate::repository::leave_repository::LeaveRepository;
use chrono::{Datelike, Weekday};
use std::sync::Arc;
use uuid::Uuid;

#[derive(Clone)]
pub struct LeaveService {
    repo: Arc<LeaveRepository>,
}

impl LeaveService {
    pub fn new(repo: Arc<LeaveRepository>) -> Self {
        Self { repo }
    }

    pub async fn submit_request(
        &self,
        personnel_id: Uuid,
        start_date: chrono::NaiveDate,
        end_date: chrono::NaiveDate,
        reason: &str,
        personnel_repo: &crate::repository::personnel_repository::PersonnelRepository,
    ) -> Result<Uuid, String> {
        if start_date > end_date {
            return Err("Tanggal mulai tidak boleh lebih besar dari tanggal selesai".to_string());
        }

        // 1. Get personnel's team (shift column)
        let personnel = personnel_repo
            .get_by_id(personnel_id)
            .await
            .map_err(|e| e.to_string())?;
        let team = personnel
            .shift
            .ok_or("Personel tidak memiliki penugasan tim/shift")?;

        // 2. Fetch holidays for the year(s)
        let holidays =
            crate::service::holiday_service::HolidayService::get_holidays(start_date.year())
                .await
                .unwrap_or_default();

        // 3. Baseline for roster calculation
        let baseline_date = chrono::NaiveDate::from_ymd_opt(2026, 4, 12).unwrap();

        // 4. Iterate through each day to check quota
        let mut current = start_date;
        let mut working_days = 0;
        while current <= end_date {
            // Determine if the team is working on this day
            let is_working = if team == "Normal" {
                current.weekday() != Weekday::Sat
                    && current.weekday() != Weekday::Sun
                    && !holidays.contains(&current)
            } else {
                // Alpha, Bravo, Charlie rotation logic
                let delta = (current - baseline_date).num_days();
                let cycle_idx = if delta >= 0 {
                    delta % 6
                } else {
                    (6 + (delta % 6)) % 6
                };

                let (m_team, n_team) = match cycle_idx {
                    0 => ("Alpha", "Charlie"),
                    1 => ("Bravo", "Alpha"),
                    2 => ("Bravo", "Alpha"),
                    3 => ("Charlie", "Bravo"),
                    4 => ("Charlie", "Bravo"),
                    5 => ("Alpha", "Charlie"),
                    _ => unreachable!(),
                };

                team == m_team || team == n_team
            };

            if is_working {
                working_days += 1;
                let count = self
                    .repo
                    .count_overlapping_requests_by_team(&team, current)
                    .await?;
                if count >= 2 {
                    return Err(format!(
                        "Kuota cuti penuh untuk tanggal {}. Maksimal 2 orang per shift/tim.",
                        current.format("%Y-%m-%d")
                    ));
                }
            }

            current = current.succ_opt().unwrap();
        }

        // 5. Check annual leave quota
        let remaining = personnel.remaining_leave.unwrap_or(0);
        if remaining < working_days {
            return Err(format!(
                "Sisa cuti tahunan tidak mencukupi. Dibutuhkan: {} hari, Tersisa: {} hari.",
                working_days, remaining
            ));
        }

        self.repo
            .create_leave_request(personnel_id, start_date, end_date, reason)
            .await
    }

    pub async fn list_requests(&self) -> Result<Vec<serde_json::Value>, String> {
        self.repo.get_all_requests().await
    }

    pub async fn process_request(
        &self,
        id: Uuid,
        status: &str,
        personnel_repo: &crate::repository::personnel_repository::PersonnelRepository,
    ) -> Result<(), String> {
        if status == "APPROVED" {
            // 1. Fetch request details
            let req = self.repo.get_request_by_id(id).await?;
            let personnel_id = Uuid::parse_str(req["personnel_id"].as_str().unwrap_or_default())
                .map_err(|e| e.to_string())?;
            let start_date = chrono::NaiveDate::parse_from_str(
                req["start_date"].as_str().unwrap_or_default(),
                "%Y-%m-%d",
            )
            .map_err(|e| e.to_string())?;
            let end_date = chrono::NaiveDate::parse_from_str(
                req["end_date"].as_str().unwrap_or_default(),
                "%Y-%m-%d",
            )
            .map_err(|e| e.to_string())?;

            // 2. Get personnel and team
            let personnel = personnel_repo
                .get_by_id(personnel_id)
                .await
                .map_err(|e| e.to_string())?;
            let team = personnel
                .shift
                .ok_or("Personel tidak memiliki penugasan tim/shift")?;

            // 3. Fetch holidays
            let holidays =
                crate::service::holiday_service::HolidayService::get_holidays(start_date.year())
                    .await
                    .unwrap_or_default();
            let baseline_date = chrono::NaiveDate::from_ymd_opt(2026, 4, 12).unwrap();

            // 4. Calculate working days
            let mut current = start_date;
            let mut working_days = 0;
            while current <= end_date {
                let is_working = if team == "Normal" {
                    current.weekday() != Weekday::Sat
                        && current.weekday() != Weekday::Sun
                        && !holidays.contains(&current)
                } else {
                    let delta = (current - baseline_date).num_days();
                    let cycle_idx = if delta >= 0 {
                        delta % 6
                    } else {
                        (6 + (delta % 6)) % 6
                    };
                    let (m_team, n_team) = match cycle_idx {
                        0 => ("Alpha", "Charlie"),
                        1 => ("Bravo", "Alpha"),
                        2 => ("Bravo", "Alpha"),
                        3 => ("Charlie", "Bravo"),
                        4 => ("Charlie", "Bravo"),
                        5 => ("Alpha", "Charlie"),
                        _ => unreachable!(),
                    };
                    team == m_team || team == n_team
                };

                if is_working {
                    working_days += 1;
                }
                current = current.succ_opt().unwrap();
            }

            // 5. Deduct from personnel
            personnel_repo
                .deduct_leave(personnel_id, working_days)
                .await
                .map_err(|e| e.to_string())?;
        }

        self.repo.update_status(id, status).await
    }
}
