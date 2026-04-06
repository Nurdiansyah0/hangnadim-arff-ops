use crate::domain::models::Inspection;
use async_trait::async_trait;
use sqlx::{Pool, Postgres, Error};
use uuid::Uuid;

#[async_trait]
pub trait InspectionRepoTrait: Send + Sync {
    async fn get_all_inspections(&self) -> Result<Vec<Inspection>, Error>;
    async fn create_inspection(
        &self,
        vehicle_id: Uuid,
        personnel_id: Option<Uuid>,
        tanggal: chrono::NaiveDate,
        status: &str,
    ) -> Result<Inspection, Error>;
}

#[derive(Clone)]
pub struct InspectionRepository {
    db: Pool<Postgres>,
}

impl InspectionRepository {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }
}

#[async_trait]
impl InspectionRepoTrait for InspectionRepository {
    async fn get_all_inspections(&self) -> Result<Vec<Inspection>, Error> {
        sqlx::query_as::<_, Inspection>(
            "SELECT id, vehicle_id, personnel_id, tanggal, status::TEXT, created_at FROM inspections"
        )
        .fetch_all(&self.db)
        .await
    }

    async fn create_inspection(
        &self,
        vehicle_id: Uuid,
        personnel_id: Option<Uuid>,
        tanggal: chrono::NaiveDate,
        status: &str,
    ) -> Result<Inspection, Error> {
        sqlx::query_as::<_, Inspection>(
            r#"
            INSERT INTO inspections (vehicle_id, personnel_id, tanggal, status) 
            VALUES ($1, $2, $3, $4::approval_status_enum) 
            RETURNING id, vehicle_id, personnel_id, tanggal, status::TEXT, created_at
            "#
        )
        .bind(vehicle_id)
        .bind(personnel_id)
        .bind(tanggal)
        .bind(status)
        .fetch_one(&self.db)
        .await
    }
}
