use crate::domain::models::PhysicalFitnessTest;
use async_trait::async_trait;
use sqlx::{Error, PgPool};
use uuid::Uuid;

#[async_trait]
pub trait FitnessRepository: Send + Sync {
    async fn get_history_by_personnel_id(&self, personnel_id: Uuid, limit: i64) -> Result<Vec<PhysicalFitnessTest>, Error>;
}

pub struct PostgresFitnessRepository {
    db: PgPool,
}

impl PostgresFitnessRepository {
    pub fn new(db: PgPool) -> Self {
        Self { db }
    }
}

#[async_trait]
impl FitnessRepository for PostgresFitnessRepository {
    async fn get_history_by_personnel_id(&self, personnel_id: Uuid, limit: i64) -> Result<Vec<PhysicalFitnessTest>, Error> {
        sqlx::query_as::<_, PhysicalFitnessTest>(
            r#"
            SELECT 
                id, personnel_id, test_date, run_12min_meters, shuttle_run_seconds, 
                pull_ups, sit_ups, push_ups, score, created_at, updated_at
            FROM physical_fitness_tests
            WHERE personnel_id = $1
            ORDER BY test_date DESC
            LIMIT $2
            "#
        )
        .bind(personnel_id)
        .bind(limit)
        .fetch_all(&self.db)
        .await
    }
}
