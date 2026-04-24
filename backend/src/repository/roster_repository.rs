use crate::domain::models::DutyAssignment;
use chrono::NaiveDate;
use sqlx::{Error, Pool, Postgres};
use uuid::Uuid;

#[derive(Clone)]
pub struct RosterRepository {
    db: Pool<Postgres>,
}

impl RosterRepository {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }

    /// Fetches the last assigned roster to use as a baseline for vehicle continuity.
    pub async fn get_last_roster_baseline(&self) -> Result<Vec<DutyAssignment>, Error> {
        sqlx::query_as::<_, DutyAssignment>(
            r#"
            SELECT DISTINCT ON (personnel_id) 
                id, personnel_id, shift_id, vehicle_id, position::TEXT, status, assignment_date, created_at, updated_at
            FROM duty_assignments
            ORDER BY personnel_id, assignment_date DESC
            "#
        )
        .fetch_all(&self.db)
        .await
    }

    /// Fetches personnel IDs and their employment status (PNS/PKWT) for a specific Team (e.g., Alpha, Bravo, Charlie).
    pub async fn get_personnel_by_team(
        &self,
        team_name: &str,
    ) -> Result<Vec<(Uuid, String, String)>, Error> {
        let rows = sqlx::query!(
            r#"
            SELECT 
                p.id, 
                p.employment_status::TEXT as "employment_status?",
                pos.name as "position_name?"
            FROM personnels p
            LEFT JOIN positions pos ON p.position_id = pos.id
            WHERE p.shift::TEXT = $1 AND p.status::TEXT = 'ACTIVE'
            "#,
            team_name
        )
        .fetch_all(&self.db)
        .await?;

        Ok(rows
            .into_iter()
            .map(|r| {
                (
                    r.id,
                    r.employment_status.unwrap_or_else(|| "PKWT".to_string()),
                    r.position_name.unwrap_or_else(|| "Rescue Officer".to_string()),
                )
            })
            .collect())
    }

    /// Checks if a personnel is on approved leave for a specific date.
    pub async fn is_on_leave(&self, personnel_id: Uuid, date: NaiveDate) -> Result<bool, Error> {
        let row = sqlx::query!(
            r#"
            SELECT EXISTS (
                SELECT 1 FROM leave_requests 
                WHERE personnel_id = $1 
                AND $2 BETWEEN start_date AND end_date 
                AND status::TEXT = 'APPROVED'
            )
            "#,
            personnel_id,
            date
        )
        .fetch_one(&self.db)
        .await?;

        Ok(row.exists.unwrap_or(false))
    }

    pub async fn batch_insert_assignments(
        &self,
        assignments: &[DutyAssignment],
    ) -> Result<(), Error> {
        if assignments.is_empty() {
            return Ok(());
        }

        let mut tx = self.db.begin().await?;

        for assignment in assignments {
            sqlx::query(
                r#"
                INSERT INTO duty_assignments (personnel_id, shift_id, vehicle_id, position, assignment_date, status)
                VALUES ($1, $2, $3, $4::duty_position_enum, $5, 'ACTIVE')
                ON CONFLICT (personnel_id, assignment_date) 
                DO UPDATE SET vehicle_id = EXCLUDED.vehicle_id, position = EXCLUDED.position
                "#
            )
            .bind(assignment.personnel_id)
            .bind(assignment.shift_id)
            .bind(assignment.vehicle_id)
            .bind(&assignment.position)
            .bind(assignment.assignment_date)
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;
        Ok(())
    }

    pub async fn update_assignment(
        &self,
        id: Uuid,
        vehicle_id: Option<Uuid>,
        position: String,
    ) -> Result<(), Error> {
        sqlx::query(
            "UPDATE duty_assignments SET vehicle_id = $1, position = $2::duty_position_enum, updated_at = NOW() WHERE id = $3"
        )
        .bind(vehicle_id)
        .bind(position)
        .bind(id)
        .execute(&self.db)
        .await?;
        Ok(())
    }

    /// Fetches a high-fidelity view of the roster for a given range.
    pub async fn get_monthly_view(
        &self,
        start_date: NaiveDate,
        end_date: NaiveDate,
    ) -> Result<Vec<crate::domain::models::RosterView>, Error> {
        sqlx::query_as::<_, crate::domain::models::RosterView>(
            r#"
            SELECT 
                da.id,
                da.assignment_date,
                da.personnel_id,
                p.full_name as personnel_name,
                p.shift::TEXT as team_name,
                s.name as shift_name,
                da.vehicle_id,
                v.code as vehicle_code,
                da.position::TEXT,
                da.status::TEXT
            FROM duty_assignments da
            JOIN personnels p ON da.personnel_id = p.id
            JOIN shifts s ON da.shift_id = s.id
            LEFT JOIN vehicles v ON da.vehicle_id = v.id
            WHERE da.assignment_date BETWEEN $1 AND $2
            ORDER BY da.assignment_date ASC, s.name ASC, p.full_name ASC
            "#,
        )
        .bind(start_date)
        .bind(end_date)
        .fetch_all(&self.db)
        .await
    }
}
