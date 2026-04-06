use crate::domain::models::Vehicle;
use async_trait::async_trait;
use sqlx::{Pool, Postgres, Error};

#[async_trait]
pub trait VehicleRepoTrait: Send + Sync {
    async fn get_all_vehicles(&self) -> Result<Vec<Vehicle>, Error>;
    async fn create_vehicle(
        &self,
        code: &str,
        name: &str,
        vehicle_type: Option<&str>,
        status: &str,
    ) -> Result<Vehicle, Error>;
}

#[derive(Clone)]
pub struct VehicleRepository {
    db: Pool<Postgres>,
}

impl VehicleRepository {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }
}

#[async_trait]
impl VehicleRepoTrait for VehicleRepository {
    async fn get_all_vehicles(&self) -> Result<Vec<Vehicle>, Error> {
        sqlx::query_as::<_, Vehicle>(
            "SELECT id, code, name, vehicle_type, status::TEXT, created_at, updated_at FROM vehicles"
        )
        .fetch_all(&self.db)
        .await
    }

    async fn create_vehicle(
        &self,
        code: &str,
        name: &str,
        vehicle_type: Option<&str>,
        status: &str,
    ) -> Result<Vehicle, Error> {
        sqlx::query_as::<_, Vehicle>(
            r#"
            INSERT INTO vehicles (code, name, vehicle_type, status) 
            VALUES ($1, $2, $3, $4::vehicle_status_enum) 
            RETURNING id, code, name, vehicle_type, status::TEXT, created_at, updated_at
            "#
        )
        .bind(code)
        .bind(name)
        .bind(vehicle_type)
        .bind(status)
        .fetch_one(&self.db)
        .await
    }
}
