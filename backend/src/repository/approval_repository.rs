use async_trait::async_trait;
use sqlx::{Error, Pool, Postgres};
use uuid::Uuid;

#[async_trait]
pub trait ApprovalRepoTrait: Send + Sync {
    async fn update_inspection_status(
        &self,
        inspection_id: Uuid,
        new_status: &str,
        user_id: Option<Uuid>,
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
        user_id: Option<Uuid>,
    ) -> Result<(), Error> {
        let is_final = new_status == "APPROVED" || new_status == "REJECTED";
        if is_final {
            sqlx::query(
                "UPDATE inspections SET status = $1::approval_status_enum, approved_by = $2, approved_at = NOW(), updated_at = NOW() WHERE id = $3"
            )
            .bind(new_status)
            .bind(user_id)
            .bind(inspection_id)
            .execute(&self.db)
            .await?;
        } else {
            sqlx::query(
                "UPDATE inspections SET status = $1::approval_status_enum, updated_at = NOW() WHERE id = $2"
            )
            .bind(new_status)
            .bind(inspection_id)
            .execute(&self.db)
            .await?;
        }
        Ok(())
    }
}
