use sqlx::{Pool, Postgres};
use uuid::Uuid;

#[derive(Clone)]
pub struct LeaveRepository {
    pool: Pool<Postgres>,
}

impl LeaveRepository {
    pub fn new(pool: Pool<Postgres>) -> Self {
        Self { pool }
    }

    pub async fn create_leave_request(&self, personnel_id: Uuid, start_date: chrono::NaiveDate, end_date: chrono::NaiveDate, reason: &str) -> Result<Uuid, String> {
        let id = Uuid::new_v4();
        sqlx::query!(
            "INSERT INTO leave_requests (id, personnel_id, start_date, end_date, reason) VALUES ($1, $2, $3, $4, $5)",
            id, personnel_id, start_date, end_date, reason
        )
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;
        Ok(id)
    }

    pub async fn get_all_requests(&self) -> Result<Vec<serde_json::Value>, String> {
        let rows = sqlx::query!(
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

        let data = rows.into_iter().map(|r| {
            serde_json::json!({
                "id": r.id,
                "personnel_id": r.personnel_id,
                "personnel_name": r.personnel_name,
                "start_date": r.start_date,
                "end_date": r.end_date,
                "reason": r.reason,
                "status": format!("{:?}", r.status)
            })
        }).collect();

        Ok(data)
    }

    pub async fn update_status(&self, id: Uuid, status: &str) -> Result<(), String> {
        sqlx::query!(
            "UPDATE leave_requests SET status = $1::text::leave_status_enum, updated_at = NOW() WHERE id = $2",
            status, id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| e.to_string())?;
        Ok(())
    }
}
