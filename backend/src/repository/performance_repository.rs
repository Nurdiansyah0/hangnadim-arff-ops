use async_trait::async_trait;
use sqlx::{Pool, Postgres, Error};
use uuid::Uuid;
use crate::domain::models::VehiclePerformanceTest;

#[async_trait]
pub trait PerformanceRepoTrait: Send + Sync {
    async fn get_vehicle_tests(&self, vehicle_id: Option<Uuid>) -> Result<Vec<VehiclePerformanceTest>, Error>;
    async fn create_vehicle_test(&self, test: VehiclePerformanceTest) -> Result<VehiclePerformanceTest, Error>;
}

#[derive(Clone)]
pub struct PerformanceRepository {
    db: Pool<Postgres>,
}

impl PerformanceRepository {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }
}

#[async_trait]
impl PerformanceRepoTrait for PerformanceRepository {
    async fn get_vehicle_tests(&self, vehicle_id: Option<Uuid>) -> Result<Vec<VehiclePerformanceTest>, Error> {
        let query = if let Some(vid) = vehicle_id {
            sqlx::query_as::<_, VehiclePerformanceTest>(
                r#"
                SELECT t.*, v.code as vehicle_code, p.full_name as inspector_name
                FROM vehicle_performance_tests t
                JOIN vehicles v ON t.vehicle_id = v.id
                LEFT JOIN personnels p ON t.inspector_id = p.id
                WHERE t.vehicle_id = $1
                ORDER BY t.test_date DESC
                "#
            ).bind(vid)
        } else {
            sqlx::query_as::<_, VehiclePerformanceTest>(
                r#"
                SELECT t.*, v.code as vehicle_code, p.full_name as inspector_name
                FROM vehicle_performance_tests t
                JOIN vehicles v ON t.vehicle_id = v.id
                LEFT JOIN personnels p ON t.inspector_id = p.id
                ORDER BY t.test_date DESC
                "#
            )
        };

        query.fetch_all(&self.db).await
    }

    async fn create_vehicle_test(&self, test: VehiclePerformanceTest) -> Result<VehiclePerformanceTest, Error> {
        sqlx::query_as::<_, VehiclePerformanceTest>(
            r#"
            INSERT INTO vehicle_performance_tests (
                vehicle_id, inspector_id, test_date, 
                top_speed_kmh, discharge_range_m, discharge_rate_lpm, stopping_distance_m,
                remarks, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
            "#
        )
        .bind(test.vehicle_id)
        .bind(test.inspector_id)
        .bind(test.test_date)
        .bind(test.top_speed_kmh)
        .bind(test.discharge_range_m)
        .bind(test.discharge_rate_lpm)
        .bind(test.stopping_distance_m)
        .bind(test.remarks)
        .bind(test.status)
        .fetch_one(&self.db)
        .await
    }
}
