use crate::domain::models::Shift;
use sqlx::{Pool, Postgres, Error};

#[derive(Clone)]
pub struct ShiftRepository {
    db: Pool<Postgres>,
}

impl ShiftRepository {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }

    pub async fn get_all_shifts(&self) -> Result<Vec<Shift>, Error> {
        sqlx::query_as::<_, Shift>("SELECT id, name, start_time, end_time FROM shifts")
            .fetch_all(&self.db)
            .await
    }

    pub async fn create_shift(
        &self,
        name: &str,
        start_time: chrono::NaiveTime,
        end_time: chrono::NaiveTime,
    ) -> Result<Shift, Error> {
        sqlx::query_as::<_, Shift>(
            r#"
            INSERT INTO shifts (name, start_time, end_time) 
            VALUES ($1, $2, $3) 
            RETURNING id, name, start_time, end_time
            "#
        )
        .bind(name)
        .bind(start_time)
        .bind(end_time)
        .fetch_one(&self.db)
        .await
    }
}
