use crate::domain::models::{DutyAssignment, Shift};
use crate::repository::roster_repository::RosterRepository;
use crate::repository::shift_repository::ShiftRepository;
use crate::repository::vehicle_repository::{VehicleRepoTrait, VehicleRepository};
use crate::service::holiday_service::HolidayService;
use chrono::{Datelike, NaiveDate, Weekday};
use std::collections::HashMap;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Clone)]
pub struct RosterService {
    roster_repo: Arc<RosterRepository>,
    shift_repo: Arc<ShiftRepository>,
    vehicle_repo: Arc<VehicleRepository>,
}

impl RosterService {
    pub fn new(
        roster_repo: Arc<RosterRepository>,
        shift_repo: Arc<ShiftRepository>,
        vehicle_repo: Arc<VehicleRepository>,
    ) -> Self {
        Self {
            roster_repo,
            shift_repo,
            vehicle_repo,
        }
    }

    /// Generates a roster for an entire month based on RACI and rotation rules.
    pub async fn generate_monthly_roster(&self, month: u32, year: i32) -> Result<(), String> {
        // 1. Fetch Master Data
        let all_shifts = self
            .shift_repo
            .get_all_shifts()
            .await
            .map_err(|e| e.to_string())?;
        let all_vehicles = self
            .vehicle_repo
            .get_all_vehicles()
            .await
            .map_err(|e| e.to_string())?;
        let holidays = HolidayService::get_holidays(year).await.unwrap_or_default();

        let mut vehicle_map: HashMap<Uuid, String> = HashMap::new();
        for v in &all_vehicles {
            vehicle_map.insert(v.id, v.code.clone());
        }

        // Map Shift IDs by Name (Morning, Night, Normal)
        let morning_shift = all_shifts
            .iter()
            .find(|s| s.name == "Morning")
            .ok_or("Morning shift not defined")?;
        let night_shift = all_shifts
            .iter()
            .find(|s| s.name == "Night")
            .ok_or("Night shift not defined")?;
        let normal_shift = all_shifts
            .iter()
            .find(|s| s.name == "Normal")
            .ok_or("Normal shift not defined")?;

        // Replacement priority: Pull from Utility first, then Ambulance, etc.
        let replacement_priority = vec![
            "UTILITY",
            "AMBULANCE 1",
            "AMBULANCE 2",
            "NURSE TENDER 1",
            "NURSE TENDER 2",
            "FOAM TENDER 5",
            "FOAM TENDER 4",
            "FOAM TENDER 3",
        ];

        let num_days = self.days_in_month(month, year);
        let baseline_date = NaiveDate::from_ymd_opt(2026, 4, 12).unwrap();

        for day_idx in 1..=num_days {
            let current_date = NaiveDate::from_ymd_opt(year, month, day_idx).unwrap();
            let delta = (current_date - baseline_date).num_days();

            // Calculate Teams based on 6-day cycle pattern provided by user:
            // Day 0 (April 12): (A, C)
            // Day 1: (B, A)
            // Day 2: (B, A)
            // Day 3: (C, B)
            // Day 4: (C, B)
            // Day 5: (A, C)
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

            // Generate assignments for Morning Shift
            self.generate_slot_roster(
                current_date,
                m_team,
                morning_shift,
                &vehicle_map,
                &replacement_priority,
            )
            .await?;

            // Generate assignments for Night Shift
            self.generate_slot_roster(
                current_date,
                n_team,
                night_shift,
                &vehicle_map,
                &replacement_priority,
            )
            .await?;

            // Generate assignments for Normal Shift (Mon-Fri, not Holiday)
            let is_weekend =
                current_date.weekday() == Weekday::Sat || current_date.weekday() == Weekday::Sun;
            if !is_weekend && !holidays.contains(&current_date) {
                self.generate_slot_roster(
                    current_date,
                    "Normal",
                    normal_shift,
                    &vehicle_map,
                    &replacement_priority,
                )
                .await?;
            }
        }

        Ok(())
    }

    async fn generate_slot_roster(
        &self,
        date: NaiveDate,
        team: &str,
        shift: &Shift,
        vehicle_map: &HashMap<Uuid, String>,
        replacement_priority: &[&str],
    ) -> Result<(), String> {
        let personnels = self
            .roster_repo
            .get_personnel_by_team(team)
            .await
            .map_err(|e| e.to_string())?;
        if personnels.is_empty() {
            return Ok(());
        }

        let _pns_list: Vec<Uuid> = personnels
            .iter()
            .filter(|(_, status, _)| status == "PNS")
            .map(|(id, _, _)| *id)
            .collect();
        let pkwt_list: Vec<Uuid> = personnels
            .iter()
            .filter(|(_, status, _)| status == "PKWT")
            .map(|(id, _, _)| *id)
            .collect();

        // Baseline: To avoid chaotic shuffling, we fetch the previous assigned roster for this team.
        // If not found, we use a global sequence logic.
        let baseline = self
            .roster_repo
            .get_last_roster_baseline()
            .await
            .map_err(|e| e.to_string())?;

        // Pick PKWT for Watchroom (simplistic rotation: based on day of year % pkwt count)
        // Adjust logic if user wants strict sequential tracking.
        let mut daily_assignments: HashMap<Uuid, DutyAssignment> = HashMap::new();
        let watchroom_idx = (date.ordinal() as usize) % pkwt_list.len();
        let w_id = pkwt_list[watchroom_idx];

        // 1. Process Assignments
        for (p_id, _, job_title) in &personnels {
            let is_leader = job_title.contains("Leader");
            
            let mut assignment =
                if let Some(base) = baseline.iter().find(|b| b.personnel_id == *p_id) {
                    let mut a = self.create_assignment(p_id, shift, base, date);
                    // If they are a leader but stuck in RESCUEMAN from previous bad data, upgrade them
                    if is_leader && a.position == "RESCUEMAN" {
                        a.position = "OSC".to_string();
                    }
                    a
                } else {
                    self.empty_assignment(p_id, shift, date, job_title)
                };

            if *p_id == w_id {
                assignment.vehicle_id = None;
                assignment.position = "WATCHROOM".to_string();
            }
            daily_assignments.insert(*p_id, assignment);
        }

        // 2. FT Replacement Logic
        let w_original_vehicle_id = baseline
            .iter()
            .find(|b| b.personnel_id == w_id)
            .and_then(|b| b.vehicle_id);
        let w_original_code = w_original_vehicle_id.and_then(|id| vehicle_map.get(&id));

        if let Some(code) = w_original_code
            && (code == "FOAM TENDER 1" || code == "FOAM TENDER 2")
        {
            let mut replacement_found = false;
            for &prio_code in replacement_priority {
                if replacement_found {
                    break;
                }
                let replacement_candidate = daily_assignments
                    .values()
                    .find(|a| {
                        if let Some(v_id) = a.vehicle_id
                            && let Some(v_code) = vehicle_map.get(&v_id)
                        {
                            return v_code == prio_code && a.personnel_id != w_id;
                        }
                        false
                    })
                    .map(|a| a.personnel_id);

                if let Some(r_id) = replacement_candidate
                    && let Some(r_assignment) = daily_assignments.get_mut(&r_id)
                {
                    r_assignment.vehicle_id = w_original_vehicle_id;
                    replacement_found = true;
                }
            }
        }

        let final_list: Vec<DutyAssignment> = daily_assignments.into_values().collect();
        self.roster_repo
            .batch_insert_assignments(&final_list)
            .await
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    fn create_assignment(
        &self,
        p_id: &Uuid,
        shift: &Shift,
        base: &DutyAssignment,
        date: NaiveDate,
    ) -> DutyAssignment {
        DutyAssignment {
            id: Uuid::new_v4(),
            personnel_id: *p_id,
            shift_id: Some(shift.id),
            vehicle_id: base.vehicle_id,
            position: base.position.clone(),
            status: Some("ACTIVE".to_string()),
            assignment_date: date,
            created_at: None,
            updated_at: None,
        }
    }

    fn empty_assignment(
        &self,
        p_id: &Uuid,
        shift: &Shift,
        date: NaiveDate,
        job_title: &str,
    ) -> DutyAssignment {
        // Robust check for leaders (handling "Team Leader", "Squad Leader", "OperationTeam Leader", etc)
        let default_position = if job_title.contains("Leader") {
            "OSC"
        } else {
            "RESCUEMAN"
        };

        DutyAssignment {
            id: Uuid::new_v4(),
            personnel_id: *p_id,
            shift_id: Some(shift.id),
            vehicle_id: None,
            position: default_position.to_string(),
            status: Some("ACTIVE".to_string()),
            assignment_date: date,
            created_at: None,
            updated_at: None,
        }
    }

    pub async fn get_monthly_view(
        &self,
        month: u32,
        year: i32,
    ) -> Result<Vec<crate::domain::models::RosterView>, String> {
        let start_date = NaiveDate::from_ymd_opt(year, month, 1).ok_or("Invalid date")?;
        let num_days = self.days_in_month(month, year);
        let end_date = NaiveDate::from_ymd_opt(year, month, num_days).ok_or("Invalid date")?;

        self.roster_repo
            .get_monthly_view(start_date, end_date)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn update_assignment(
        &self,
        id: Uuid,
        vehicle_id: Option<Uuid>,
        position: String,
    ) -> Result<(), String> {
        self.roster_repo
            .update_assignment(id, vehicle_id, position)
            .await
            .map_err(|e| e.to_string())
    }

    fn days_in_month(&self, month: u32, year: i32) -> u32 {
        match month {
            1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
            4 | 6 | 9 | 11 => 30,
            2 => {
                if (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0) {
                    29
                } else {
                    28
                }
            }
            _ => 30,
        }
    }
}

#[cfg(test)]
mod tests {
    use chrono::NaiveDate;

    #[test]
    fn test_rotation_cycle() {
        let baseline_date = NaiveDate::from_ymd_opt(2026, 4, 12).unwrap();

        println!("\n=== BUKTI ROTASI SHIFT (Mulai 12 April 2026) ===");
        println!(
            "{:<12} | {:<7} | {:<7} | {:<7}",
            "Tanggal", "Pagi", "Malam", "Libur"
        );
        println!("{:-<45}", "");

        for day_idx in 12..=26 {
            // Test for 15 days
            let current_date = NaiveDate::from_ymd_opt(2026, 4, day_idx).unwrap();
            let delta = (current_date - baseline_date).num_days();

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

            let off_team = match (m_team, n_team) {
                ("Alpha", "Charlie") => "Bravo",
                ("Bravo", "Alpha") => "Charlie",
                ("Charlie", "Bravo") => "Alpha",
                _ => "Unknown",
            };

            println!(
                "{:<12} | {:<7} | {:<7} | {:<7}",
                current_date.format("%Y-%m-%d").to_string(),
                m_team,
                n_team,
                off_team
            );
        }
        println!("================================================\n");
    }
}
