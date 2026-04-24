use crate::domain::models::MaintenanceRecord;
use async_trait::async_trait;
use bigdecimal::BigDecimal;
use sqlx::{Error, PgPool};
use uuid::Uuid;

pub struct CreateMaintenanceParams<'a> {
    pub vehicle_id: Uuid,
    pub maintenance_type: Option<&'a str>,
    pub description: &'a str,
    pub performed_by: Uuid,
    pub performed_at: Option<chrono::NaiveDate>,
    pub cost: Option<BigDecimal>,
    pub next_due: Option<chrono::NaiveDate>,
    pub photo_url: Option<&'a str>,
}

#[async_trait]
pub trait MaintenanceRepository: Send + Sync {
    async fn create_record(
        &self,
        params: CreateMaintenanceParams<'_>,
    ) -> Result<MaintenanceRecord, Error>;

    async fn get_by_vehicle_id(&self, vehicle_id: Uuid) -> Result<Vec<MaintenanceRecord>, Error>;
    async fn get_by_id(&self, id: Uuid) -> Result<MaintenanceRecord, Error>;
}

pub struct PostgresMaintenanceRepository {
    db: PgPool,
}

impl PostgresMaintenanceRepository {
    pub fn new(db: PgPool) -> Self {
        Self { db }
    }
}

#[async_trait]
impl MaintenanceRepository for PostgresMaintenanceRepository {
    async fn create_record(
        &self,
        params: CreateMaintenanceParams<'_>,
    ) -> Result<MaintenanceRecord, Error> {
        sqlx::query_as::<_, MaintenanceRecord>(
            r#"
            INSERT INTO maintenance_records (vehicle_id, maintenance_type, description, performed_by, performed_at, cost, next_due, photo_url)
            VALUES ($1, $2::maintenance_type_enum, $3, $4, $5, $6, $7, $8)
            RETURNING id, vehicle_id, maintenance_type::TEXT AS maintenance_type, description, performed_by, performed_at, cost, next_due, status::TEXT AS status, photo_url, created_at, updated_at, NULL::TEXT as vehicle_code, NULL::TEXT as personnel_name
            "#
        )
        .bind(params.vehicle_id)
        .bind(params.maintenance_type)
        .bind(params.description)
        .bind(params.performed_by)
        .bind(params.performed_at)
        .bind(params.cost)
        .bind(params.next_due)
        .bind(params.photo_url)
        .fetch_one(&self.db)
        .await
    }

    async fn get_by_vehicle_id(&self, vehicle_id: Uuid) -> Result<Vec<MaintenanceRecord>, Error> {
        sqlx::query_as::<_, MaintenanceRecord>(
            r#"
            SELECT 
                mr.id, mr.vehicle_id, mr.maintenance_type::TEXT AS maintenance_type, mr.description, 
                mr.performed_by, mr.performed_at, mr.cost, mr.next_due, mr.status::TEXT AS status, 
                mr.photo_url, mr.created_at, mr.updated_at,
                v.code as vehicle_code,
                p.full_name as personnel_name
            FROM maintenance_records mr
            JOIN vehicles v ON v.id = mr.vehicle_id
            JOIN personnels p ON p.id = mr.performed_by
            WHERE mr.vehicle_id = $1
            ORDER BY mr.created_at DESC
            "#
        )
        .bind(vehicle_id)
        .fetch_all(&self.db)
        .await
    }

    async fn get_by_id(&self, id: Uuid) -> Result<MaintenanceRecord, Error> {
        sqlx::query_as::<_, MaintenanceRecord>(
            r#"
            SELECT 
                mr.id, mr.vehicle_id, mr.maintenance_type::TEXT AS maintenance_type, mr.description, 
                mr.performed_by, mr.performed_at, mr.cost, mr.next_due, mr.status::TEXT AS status, 
                mr.photo_url, mr.created_at, mr.updated_at,
                v.code as vehicle_code,
                p.full_name as personnel_name
            FROM maintenance_records mr
            JOIN vehicles v ON v.id = mr.vehicle_id
            JOIN personnels p ON p.id = mr.performed_by
            WHERE mr.id = $1
            "#
        )
        .bind(id)
        .fetch_one(&self.db)
        .await
    }
}
