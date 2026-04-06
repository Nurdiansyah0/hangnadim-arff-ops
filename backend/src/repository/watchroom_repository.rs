use crate::domain::models::WatchroomLog;
use async_trait::async_trait;
use sqlx::{Pool, Postgres, Error};
use uuid::Uuid;
use serde_json::Value;

#[async_trait]
pub trait WatchroomRepoTrait: Send + Sync {
    async fn get_all_logs(&self) -> Result<Vec<WatchroomLog>, Error>;
    async fn create_log(
        &self,
        actor_id: Option<Uuid>,
        entry_type: Option<&str>,
        description: &str,
        payload: Option<Value>,
        photo_url: Option<&str>,
    ) -> Result<WatchroomLog, Error>;
}

#[derive(Clone)]
pub struct WatchroomRepository {
    db: Pool<Postgres>,
}

impl WatchroomRepository {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }
}

#[async_trait]
impl WatchroomRepoTrait for WatchroomRepository {
    async fn get_all_logs(&self) -> Result<Vec<WatchroomLog>, Error> {
        sqlx::query_as::<_, WatchroomLog>(
            "SELECT id, actor_id, entry_type, description, payload, created_at, photo_url FROM watchroom_logs ORDER BY created_at DESC"
        )
        .fetch_all(&self.db)
        .await
    }

    async fn create_log(
        &self,
        actor_id: Option<Uuid>,
        entry_type: Option<&str>,
        description: &str,
        payload: Option<Value>,
        photo_url: Option<&str>,
    ) -> Result<WatchroomLog, Error> {
        sqlx::query_as::<_, WatchroomLog>(
            r#"
            INSERT INTO watchroom_logs (actor_id, entry_type, description, payload, photo_url) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING id, actor_id, entry_type, description, payload, created_at, photo_url
            "#
        )
        .bind(actor_id)
        .bind(entry_type)
        .bind(description)
        .bind(payload)
        .bind(photo_url)
        .fetch_one(&self.db)
        .await
    }
}
