use crate::domain::models::Vehicle;
use async_trait::async_trait;
use bigdecimal::BigDecimal;
use sqlx::{Error, Pool, Postgres};
use uuid::Uuid;

pub struct CreateVehicleParams<'a> {
    pub code: &'a str,
    pub name: &'a str,
    pub vehicle_type: Option<&'a str>,
    pub status: &'a str,
    pub water_capacity_l: Option<&'a BigDecimal>,
    pub foam_capacity_l: Option<&'a BigDecimal>,
    pub powder_capacity_kg: Option<&'a BigDecimal>,
    pub last_service_date: Option<&'a chrono::NaiveDate>,
    pub next_service_due: Option<&'a chrono::NaiveDate>,
}

pub struct UpdateVehicleParams<'a> {
    pub id: Uuid,
    pub code: Option<&'a str>,
    pub name: Option<&'a str>,
    pub vehicle_type: Option<&'a str>,
    pub status: Option<&'a str>,
    pub water_capacity_l: Option<&'a BigDecimal>,
    pub foam_capacity_l: Option<&'a BigDecimal>,
    pub powder_capacity_kg: Option<&'a BigDecimal>,
    pub last_service_date: Option<&'a chrono::NaiveDate>,
    pub next_service_due: Option<&'a chrono::NaiveDate>,
}

#[async_trait]
pub trait VehicleRepoTrait: Send + Sync {
    async fn get_all_vehicles(&self) -> Result<Vec<Vehicle>, Error>;
    async fn create_vehicle(&self, params: CreateVehicleParams<'_>) -> Result<Vehicle, Error>;
    async fn update_vehicle(&self, params: UpdateVehicleParams<'_>) -> Result<Vehicle, Error>;
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

    async fn create_vehicle(&self, params: CreateVehicleParams<'_>) -> Result<Vehicle, Error> {
        sqlx::query_as::<_, Vehicle>(
            r#"
            INSERT INTO vehicles (code, name, vehicle_type, status, water_capacity_l, foam_capacity_l, powder_capacity_kg, last_service_date, next_service_due)
            VALUES ($1, $2, $3, $4::vehicle_status_enum, $5, $6, $7, $8, $9)
            RETURNING id, code, name, vehicle_type, status::TEXT, water_capacity_l, foam_capacity_l, powder_capacity_kg, last_service_date, next_service_due, created_at, updated_at
            "#
        )
        .bind(params.code)
        .bind(params.name)
        .bind(params.vehicle_type)
        .bind(params.status)
        .bind(params.water_capacity_l)
        .bind(params.foam_capacity_l)
        .bind(params.powder_capacity_kg)
        .bind(params.last_service_date)
        .bind(params.next_service_due)
        .fetch_one(&self.db)
        .await
    }

    async fn update_vehicle(&self, params: UpdateVehicleParams<'_>) -> Result<Vehicle, Error> {
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
        .bind(params.id)
        .bind(params.code)
        .bind(params.name)
        .bind(params.vehicle_type)
        .bind(params.status)
        .bind(params.water_capacity_l)
        .bind(params.foam_capacity_l)
        .bind(params.powder_capacity_kg)
        .bind(params.last_service_date)
        .bind(params.next_service_due)
        .fetch_one(&self.db)
        .await
    }
}
