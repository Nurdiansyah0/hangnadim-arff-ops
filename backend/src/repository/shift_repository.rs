use crate::domain::models::{Shift, ShiftPersonnel};
use sqlx::{Pool, Postgres, Error};
use uuid::Uuid;
use async_trait::async_trait;

#[async_trait]
pub trait ShiftRepository: Send + Sync {
    async fn get_all_shifts(&self) -> Result<Vec<Shift>, Error>;
    async fn get_shift_by_id(&self, id: i32) -> Result<Option<Shift>, Error>;
    async fn get_personnel_by_shift(&self, shift_id: i32) -> Result<Vec<Uuid>, Error>;
    async fn assign_personnel(&self, shift_id: i32, user_id: Uuid) -> Result<ShiftPersonnel, Error>;
    async fn remove_personnel(&self, shift_id: i32, user_id: Uuid) -> Result<(), Error>;
}

#[derive(Clone)]
pub struct ShiftRepositoryImpl {
    db: Pool<Postgres>,
}

impl ShiftRepositoryImpl {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }
}

#[async_trait]
impl ShiftRepository for ShiftRepositoryImpl {
    async fn get_all_shifts(&self) -> Result<Vec<Shift>, Error> {
        sqlx::query_as::<_, Shift>("SELECT id, name FROM shifts")
            .fetch_all(&self.db)
            .await
    }

    async fn get_shift_by_id(&self, id: i32) -> Result<Option<Shift>, Error> {
        sqlx::query_as::<_, Shift>("SELECT id, name FROM shifts WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.db)
            .await
    }

    async fn get_personnel_by_shift(&self, shift_id: i32) -> Result<Vec<Uuid>, Error> {
        sqlx::query_scalar::<_, Uuid>("SELECT user_id FROM shift_personnel WHERE shift_id = $1")
            .bind(shift_id)
            .fetch_all(&self.db)
            .await
    }

    async fn assign_personnel(&self, shift_id: i32, user_id: Uuid) -> Result<ShiftPersonnel, Error> {
        sqlx::query_as::<_, ShiftPersonnel>(
            "INSERT INTO shift_personnel (shift_id, user_id) VALUES ($1, $2) RETURNING shift_id, user_id, created_at"
        )
        .bind(shift_id)
        .bind(user_id)
        .fetch_one(&self.db)
        .await
    }

    async fn remove_personnel(&self, shift_id: i32, user_id: Uuid) -> Result<(), Error> {
        sqlx::query("DELETE FROM shift_personnel WHERE shift_id = $1 AND user_id = $2")
            .bind(shift_id)
            .bind(user_id)
            .execute(&self.db)
            .await
            .map(|_| ())
    }
}
