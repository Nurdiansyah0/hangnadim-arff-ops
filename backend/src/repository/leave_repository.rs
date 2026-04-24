use sqlx::{Pool, Postgres, Row};
use uuid::Uuid;

#[derive(Clone)]
pub struct LeaveRepository {
    pool: Pool<Postgres>,
}

impl LeaveRepository {
    pub fn new(pool: Pool<Postgres>) -> Self {
        Self { pool }
    }

    pub async fn create_leave_request(
        &self,
        personnel_id: Uuid,
        start_date: chrono::NaiveDate,
        end_date: chrono::NaiveDate,
        reason: &str,
    ) -> Result<Uuid, String> {
        let id = Uuid::new_v4();
        sqlx::query(
            "INSERT INTO leave_requests (id, personnel_id, start_date, end_date, reason) VALUES ($1, $2, $3, $4, $5)"
        )
        .bind(id)
        .bind(personnel_id)
        .bind(start_date)
        .bind(end_date)
        .bind(reason)
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;
        Ok(id)
    }

    pub async fn get_all_requests(&self) -> Result<Vec<serde_json::Value>, String> {
        let rows = sqlx::query(
            r#"
            SELECT lr.id, lr.personnel_id, lr.start_date, lr.end_date, lr.reason, lr.status::text as status, lr.created_at, lr.updated_at, p.full_name as personnel_name 
            FROM leave_requests lr
            JOIN personnels p ON lr.personnel_id = p.id
            ORDER BY lr.created_at DESC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        let data = rows
            .into_iter()
            .map(|r| {
                serde_json::json!({
                    "id": r.get::<Uuid, _>("id"),
                    "personnel_id": r.get::<Uuid, _>("personnel_id"),
                    "personnel_name": r.get::<String, _>("personnel_name"),
                    "start_date": r.get::<chrono::NaiveDate, _>("start_date"),
                    "end_date": r.get::<chrono::NaiveDate, _>("end_date"),
                    "reason": r.get::<String, _>("reason"),
                    "status": r.get::<String, _>("status")
                })
            })
            .collect();

        Ok(data)
    }

    pub async fn count_overlapping_requests_by_team(
        &self,
        team: &str,
        date: chrono::NaiveDate,
    ) -> Result<i64, String> {
        let count: (i64,) = sqlx::query_as(
            r#"
            SELECT COUNT(*) 
            FROM leave_requests lr
            JOIN personnels p ON lr.personnel_id = p.id
            WHERE p.shift::TEXT = $1
            AND $2 BETWEEN lr.start_date AND lr.end_date
            AND lr.status::TEXT IN ('PENDING', 'APPROVED')
            "#,
        )
        .bind(team)
        .bind(date)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        Ok(count.0)
    }

    pub async fn get_request_by_id(&self, id: Uuid) -> Result<serde_json::Value, String> {
        let r = sqlx::query(
            r#"
            SELECT lr.id, lr.personnel_id, lr.start_date, lr.end_date, lr.reason, lr.status::text as status
            FROM leave_requests lr
            WHERE lr.id = $1
            "#
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| e.to_string())?;

        Ok(serde_json::json!({
            "id": r.get::<Uuid, _>("id"),
            "personnel_id": r.get::<Uuid, _>("personnel_id"),
            "start_date": r.get::<chrono::NaiveDate, _>("start_date"),
            "end_date": r.get::<chrono::NaiveDate, _>("end_date"),
            "reason": r.get::<String, _>("reason"),
            "status": r.get::<String, _>("status")
        }))
    }

    pub async fn update_status(&self, id: Uuid, status: &str) -> Result<(), String> {
        sqlx::query(
            "UPDATE leave_requests SET status = $1::text::leave_status_enum, updated_at = NOW() WHERE id = $2"
        )
        .bind(status)
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;
        Ok(())
    }
}
