use async_trait::async_trait;
use sqlx::{Pool, Postgres, Error};
use uuid::Uuid;

#[async_trait]
pub trait ApprovalRepoTrait: Send + Sync {
    async fn update_inspection_status(
        &self,
        inspection_id: Uuid,
        new_status: &str,
    ) -> Result<(), Error>;
}

#[derive(Clone)]
pub struct ApprovalRepository {
    db: Pool<Postgres>,
}

impl ApprovalRepository {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }
}

#[async_trait]
impl ApprovalRepoTrait for ApprovalRepository {
    async fn update_inspection_status(
        &self,
        inspection_id: Uuid,
        new_status: &str,
    ) -> Result<(), Error> {
        sqlx::query(
            "UPDATE inspections SET status = $1::approval_status_enum WHERE id = $2"
        )
        .bind(new_status)
        .bind(inspection_id)
        .execute(&self.db)
        .await?;
        Ok(())
    }
}
