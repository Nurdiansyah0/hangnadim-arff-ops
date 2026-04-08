use crate::domain::models::Vehicle;
use async_trait::async_trait;
use bigdecimal::BigDecimal;
use sqlx::{Pool, Postgres, Error};
use uuid::Uuid;

#[async_trait]
pub trait VehicleRepoTrait: Send + Sync {
    async fn get_all_vehicles(&self) -> Result<Vec<Vehicle>, Error>;
    async fn create_vehicle(
        &self,
        code: &str,
        name: &str,
        vehicle_type: Option<&str>,
        status: &str,
        water_capacity_l: Option<&BigDecimal>,
        foam_capacity_l: Option<&BigDecimal>,
        powder_capacity_kg: Option<&BigDecimal>,
        last_service_date: Option<&chrono::NaiveDate>,
        next_service_due: Option<&chrono::NaiveDate>,
    ) -> Result<Vehicle, Error>;
    async fn update_vehicle(
        &self,
        id: Uuid,
        code: Option<&str>,
        name: Option<&str>,
        vehicle_type: Option<&str>,
        status: Option<&str>,
        water_capacity_l: Option<&BigDecimal>,
        foam_capacity_l: Option<&BigDecimal>,
        powder_capacity_kg: Option<&BigDecimal>,
        last_service_date: Option<&chrono::NaiveDate>,
        next_service_due: Option<&chrono::NaiveDate>,
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
            "SELECT id, code, name, vehicle_type, status::TEXT, water_capacity_l, foam_capacity_l, powder_capacity_kg, last_service_date, next_service_due, created_at, updated_at FROM vehicles"
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
        water_capacity_liters: Option<&BigDecimal>,
        foam_capacity_liters: Option<&BigDecimal>,
        dcp_capacity_kg: Option<&BigDecimal>,
        last_service_date: Option<&chrono::NaiveDate>,
        next_service_due: Option<&chrono::NaiveDate>,
    ) -> Result<Vehicle, Error> {
        sqlx::query_as::<_, Vehicle>(
            r#"
            INSERT INTO vehicles (code, name, vehicle_type, status, water_capacity_l, foam_capacity_l, powder_capacity_kg, last_service_date, next_service_due)
            VALUES ($1, $2, $3, $4::vehicle_status_enum, $5, $6, $7, $8, $9)
            RETURNING id, code, name, vehicle_type, status::TEXT, water_capacity_l, foam_capacity_l, powder_capacity_kg, last_service_date, next_service_due, created_at, updated_at
            "#
        )
        .bind(code)
        .bind(name)
        .bind(vehicle_type)
        .bind(status)
        .bind(water_capacity_liters)
        .bind(foam_capacity_liters)
        .bind(dcp_capacity_kg)
        .bind(last_service_date)
        .bind(next_service_due)
        .fetch_one(&self.db)
        .await
    }

    async fn update_vehicle(
        &self,
        id: Uuid,
        code: Option<&str>,
        name: Option<&str>,
        vehicle_type: Option<&str>,
        status: Option<&str>,
        water_capacity_liters: Option<&BigDecimal>,
        foam_capacity_liters: Option<&BigDecimal>,
        dcp_capacity_kg: Option<&BigDecimal>,
        last_service_date: Option<&chrono::NaiveDate>,
        next_service_due: Option<&chrono::NaiveDate>,
    ) -> Result<Vehicle, Error> {
        sqlx::query_as::<_, Vehicle>(
            r#"
            UPDATE vehicles SET
                code = COALESCE($2, code),
                name = COALESCE($3, name),
                vehicle_type = COALESCE($4, vehicle_type),
                status = COALESCE($5::vehicle_status_enum, status),
                water_capacity_l = COALESCE($6, water_capacity_l),
                foam_capacity_l = COALESCE($7, foam_capacity_l),
                powder_capacity_kg = COALESCE($8, powder_capacity_kg),
                last_service_date = COALESCE($9, last_service_date),
                next_service_due = COALESCE($10, next_service_due)
            WHERE id = $1
            RETURNING id, code, name, vehicle_type, status::TEXT, water_capacity_l, foam_capacity_l, powder_capacity_kg, last_service_date, next_service_due, created_at, updated_at
            "#
        )
        .bind(id)
        .bind(code)
        .bind(name)
        .bind(vehicle_type)
        .bind(status)
        .bind(water_capacity_liters)
        .bind(foam_capacity_liters)
        .bind(dcp_capacity_kg)
        .bind(last_service_date)
        .bind(next_service_due)
        .fetch_one(&self.db)
        .await
    }
}
