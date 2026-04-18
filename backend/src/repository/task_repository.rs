use sqlx::PgPool;
use uuid::Uuid;
use chrono::NaiveDate;
use crate::domain::models::{DailyTaskView, ShiftReport};

#[derive(Clone)]
pub struct TaskRepository {
    db: PgPool,
}

impl TaskRepository {
    pub fn new(db: PgPool) -> Self {
        Self { db }
    }

    /// Automatically generate tasks for all duty assignments on a specific date.
    pub async fn generate_daily_tasks(&self, target_date: NaiveDate) -> Result<(), sqlx::Error> {
        // We use a complex INSERT ... SELECT structure that joins duty_assignments with task_templates
        // based on the POSITION string (DRIVER, RESCUEMAN, etc.).
        sqlx::query(
            r#"
            INSERT INTO daily_tasks (assignment_id, task_name, description, status)
            SELECT da.id, tt.task_name, tt.description, 'PENDING'
            FROM duty_assignments da
            JOIN task_templates tt ON da.position::TEXT = tt.position
            WHERE da.assignment_date = $1
            ON CONFLICT (assignment_id, task_name) DO NOTHING
            "#
        )
        .bind(target_date)
        .execute(&self.db)
        .await?;

        Ok(())
    }

    /// Get tasks for a specific personnel on a specific date
    pub async fn get_my_tasks(&self, personnel_id: Uuid, target_date: NaiveDate) -> Result<Vec<DailyTaskView>, sqlx::Error> {
        sqlx::query_as::<_, DailyTaskView>(
            r#"
            SELECT 
                dt.id as task_id, dt.task_name, dt.description as task_description, dt.status, dt.completed_at, dt.completed_notes,
                da.id as assignment_id, da.assignment_date, da.personnel_id, da.position::TEXT,
                p.full_name as personnel_name, p.shift::TEXT as team_name,
                s.name as shift_name,
                v.code as vehicle_code
            FROM daily_tasks dt
            JOIN duty_assignments da ON dt.assignment_id = da.id
            JOIN personnels p ON da.personnel_id = p.id
            JOIN shifts s ON da.shift_id = s.id
            LEFT JOIN vehicles v ON da.vehicle_id = v.id
            WHERE da.personnel_id = $1 AND da.assignment_date = $2
            ORDER BY dt.status DESC, dt.task_name ASC
            "#
        )
        .bind(personnel_id)
        .bind(target_date)
        .fetch_all(&self.db)
        .await
    }

    /// Submit a task (mark as COMPLETED)
    pub async fn submit_task(&self, task_id: Uuid, notes: Option<String>) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            UPDATE daily_tasks 
            SET status = 'COMPLETED', completed_at = NOW(), completed_notes = $1, updated_at = NOW()
            WHERE id = $2 AND status = 'PENDING'
            "#
        )
        .bind(notes)
        .bind(task_id)
        .execute(&self.db)
        .await?;
        Ok(())
    }

    /// Fetch all tasks for a specific shift and date, typically used by Team Leader for approval.
    pub async fn get_shift_tasks_for_approval(&self, shift_id: i32, target_date: NaiveDate) -> Result<Vec<DailyTaskView>, sqlx::Error> {
        sqlx::query_as::<_, DailyTaskView>(
            r#"
            SELECT 
                dt.id as task_id, dt.task_name, dt.description as task_description, dt.status, dt.completed_at, dt.completed_notes,
                da.id as assignment_id, da.assignment_date, da.personnel_id, da.position::TEXT,
                p.full_name as personnel_name, p.shift::TEXT as team_name,
                s.name as shift_name,
                v.code as vehicle_code
            FROM daily_tasks dt
            JOIN duty_assignments da ON dt.assignment_id = da.id
            JOIN personnels p ON da.personnel_id = p.id
            JOIN shifts s ON da.shift_id = s.id
            LEFT JOIN vehicles v ON da.vehicle_id = v.id
            WHERE da.shift_id = $1 AND da.assignment_date = $2
            ORDER BY p.full_name ASC, dt.task_name ASC
            "#
        )
        .bind(shift_id)
        .bind(target_date)
        .fetch_all(&self.db)
        .await
    }

    /// Approves all COMPLETED tasks for a shift and generates the summary report
    pub async fn approve_shift_report(&self, leader_id: Uuid, shift_id: i32, target_date: NaiveDate, notes: Option<String>) -> Result<ShiftReport, sqlx::Error> {
        let mut tx = self.db.begin().await?;

        // 1. Bulk update tasks to APPROVED
        sqlx::query(
            r#"
            UPDATE daily_tasks dt
            SET status = 'APPROVED', updated_at = NOW()
            FROM duty_assignments da
            WHERE dt.assignment_id = da.id AND da.shift_id = $1 AND da.assignment_date = $2 AND dt.status = 'COMPLETED'
            "#
        )
        .bind(shift_id)
        .bind(target_date)
        .execute(&mut *tx)
        .await?;

        // 2. Insert Shift Report
        let report = sqlx::query_as::<_, ShiftReport>(
            r#"
            INSERT INTO shift_reports (report_date, shift_id, team_leader_id, status, approval_notes)
            VALUES ($1, $2, $3, 'FINALIZED', $4)
            ON CONFLICT (report_date, shift_id) DO UPDATE SET approval_notes = EXCLUDED.approval_notes, status = 'FINALIZED'
            RETURNING *
            "#
        )
        .bind(target_date)
        .bind(shift_id)
        .bind(leader_id)
        .bind(notes)
        .fetch_one(&mut *tx)
        .await?;

        tx.commit().await?;
        Ok(report)
    }

    /// Get summary stats for a squad (based on personnel's shift)
    pub async fn get_squad_summary(&self, shift_id: i32, date: NaiveDate) -> Result<crate::domain::models::SquadSummaryResponse, sqlx::Error> {
        let stats = sqlx::query!(
            r#"
            SELECT 
                COUNT(DISTINCT personnel_id) as total_personnel,
                COUNT(*) FILTER (WHERE dt.status = 'PENDING') as pending,
                COUNT(*) FILTER (WHERE dt.status = 'COMPLETED' OR dt.status = 'APPROVED') as done,
                COALESCE(
                    (COUNT(*) FILTER (WHERE dt.status = 'COMPLETED' OR dt.status = 'APPROVED'))::float / NULLIF(COUNT(*), 0), 
                    0
                ) as readiness
            FROM daily_tasks dt
            JOIN duty_assignments da ON dt.assignment_id = da.id
            WHERE da.shift_id = $1 AND da.assignment_date = $2
            "#,
            shift_id,
            date
        )
        .fetch_one(&self.db)
        .await?;

        Ok(crate::domain::models::SquadSummaryResponse {
            active_personnel: stats.total_personnel.unwrap_or(0),
            pending_tasks: stats.pending.unwrap_or(0),
            completed_tasks: stats.done.unwrap_or(0),
            readiness_percentage: stats.readiness.unwrap_or(0.0) * 100.0,
        })
    }

    pub async fn get_operation_summary(&self, date: NaiveDate) -> Result<serde_json::Value, sqlx::Error> {
        let personnel_count: i64 = sqlx::query_scalar(
            r#"
            SELECT COUNT(*) 
            FROM duty_assignments da
            JOIN shifts s ON da.shift_id = s.id
            WHERE da.assignment_date = $1
            AND (
                (s.start_time <= s.end_time AND CURRENT_TIME BETWEEN s.start_time AND s.end_time)
                OR
                (s.start_time > s.end_time AND (CURRENT_TIME >= s.start_time OR CURRENT_TIME <= s.end_time))
            )
            "#
        )
        .bind(date)
        .fetch_one(&self.db)
        .await?;

        let pending_approvals: i64 = sqlx::query_scalar(
            r#"
            SELECT COUNT(*) 
            FROM daily_tasks dt
            JOIN duty_assignments da ON dt.assignment_id = da.id
            JOIN shifts s ON da.shift_id = s.id
            WHERE da.assignment_date = $1 
            AND dt.status = 'COMPLETED'
            AND (
                (s.start_time <= s.end_time AND CURRENT_TIME BETWEEN s.start_time AND s.end_time)
                OR
                (s.start_time > s.end_time AND (CURRENT_TIME >= s.start_time OR CURRENT_TIME <= s.end_time))
            )
            "#
        )
        .bind(date)
        .fetch_one(&self.db)
        .await?;

        let flight_count: i64 = sqlx::query_scalar("SELECT COUNT(id) FROM flight_routes WHERE actual_time::DATE = $1")
            .bind(date)
            .fetch_one(&self.db)
            .await?;

        let readiness: f64 = sqlx::query_scalar(
            r#"
            SELECT (COALESCE(
                (COUNT(*) FILTER (WHERE dt.status = 'COMPLETED' OR dt.status = 'APPROVED'))::float8 / NULLIF(COUNT(*), 0)::float8,
                1.0::float8
            ) * 100.0::float8)::float8
            FROM daily_tasks dt
            JOIN duty_assignments da ON dt.assignment_id = da.id
            JOIN shifts s ON da.shift_id = s.id
            WHERE da.assignment_date = $1
            AND (
                (s.start_time <= s.end_time AND CURRENT_TIME BETWEEN s.start_time AND s.end_time)
                OR
                (s.start_time > s.end_time AND (CURRENT_TIME >= s.start_time OR CURRENT_TIME <= s.end_time))
            )
            "#
        )
        .bind(date)
        .fetch_one(&self.db)
        .await?;

        Ok(serde_json::json!({
            "active_personnel": personnel_count,
            "pending_approvals": pending_approvals,
            "active_flights": flight_count,
            "overall_readiness": readiness
        }))
    }

    pub async fn get_recent_activities(&self) -> Result<serde_json::Value, sqlx::Error> {
        use sqlx::Row;
        
        // Union shift reports and watchroom logs for a combined feed
        // Using non-macro query to avoid potential type inference issues with complex UNIONs
        let rows = sqlx::query(
            r#"
            (
                SELECT 
                    sr.id::text as id,
                    p.full_name as user_name,
                    'Approved shift report for ' || s.name as action,
                    sr.created_at as time,
                    'approval' as activity_type
                FROM shift_reports sr
                JOIN personnels p ON sr.team_leader_id = p.id
                JOIN shifts s ON sr.shift_id = s.id
                ORDER BY sr.created_at DESC
                LIMIT 5
            )
            UNION ALL
            (
                SELECT 
                    wl.id::text as id,
                    p.full_name as user_name,
                    wl.description as action,
                    wl.created_at as time,
                    CASE 
                        WHEN wl.entry_type = 'FLIGHT' THEN 'flight'
                        WHEN wl.entry_type = 'INCIDENT' THEN 'alert'
                        ELSE 'alert'
                    END as activity_type
                FROM watchroom_logs wl
                JOIN personnels p ON wl.personnel_id = p.id
                ORDER BY wl.created_at DESC
                LIMIT 5
            )
            ORDER BY time DESC
            LIMIT 10
            "#
        )
        .fetch_all(&self.db)
        .await?;

        let list: Vec<serde_json::Value> = rows.into_iter().map(|row| {
            serde_json::json!({
                "id": row.get::<String, _>("id"),
                "user": row.get::<String, _>("user_name"),
                "action": row.get::<String, _>("action"),
                "time": row.get::<chrono::DateTime<chrono::Utc>, _>("time"),
                "type": row.get::<String, _>("activity_type")
            })
        }).collect();

        Ok(serde_json::json!(list))
    }
}
