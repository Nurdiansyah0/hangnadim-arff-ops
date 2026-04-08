use crate::domain::models::MaintenanceRecord;
use async_trait::async_trait;
use sqlx::{Error, PgPool};
use uuid::Uuid;
use bigdecimal::BigDecimal;

#[async_trait]
pub trait MaintenanceRepository: Send + Sync {
    async fn create_record(
        &self,
        vehicle_id: Uuid,
        maintenance_type: Option<&str>,
        description: &str,
        performed_by: Uuid,
        performed_at: Option<chrono::NaiveDate>,
        cost: Option<BigDecimal>,
        next_due: Option<chrono::NaiveDate>,
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
        vehicle_id: Uuid,
        maintenance_type: Option<&str>,
        description: &str,
        performed_by: Uuid,
        performed_at: Option<chrono::NaiveDate>,
        cost: Option<BigDecimal>,
        next_due: Option<chrono::NaiveDate>,
    ) -> Result<MaintenanceRecord, Error> {
        sqlx::query_as::<_, MaintenanceRecord>(
            r#"
            INSERT INTO maintenance_records (vehicle_id, maintenance_type, description, performed_by, performed_at, cost, next_due)
            VALUES ($1, $2::maintenance_type_enum, $3, $4, $5, $6, $7)
            RETURNING id, vehicle_id, maintenance_type::TEXT, description, performed_by, performed_at, cost, next_due, status::TEXT, created_at, updated_at, NULL as vehicle_code, NULL as personnel_name
            "#
        )
        .bind(vehicle_id)
        .bind(maintenance_type)
        .bind(description)
        .bind(performed_by)
        .bind(performed_at)
        .bind(cost)
        .bind(next_due)
        .fetch_one(&self.db)
        .await
    }

    async fn get_by_vehicle_id(&self, vehicle_id: Uuid) -> Result<Vec<MaintenanceRecord>, Error> {
        sqlx::query_as::<_, MaintenanceRecord>(
            r#"
            SELECT 
                mr.id, mr.vehicle_id, mr.maintenance_type::TEXT, mr.description, 
                mr.performed_by, mr.performed_at, mr.cost, mr.next_due, mr.status::TEXT, mr.created_at, mr.updated_at,
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
                mr.id, mr.vehicle_id, mr.maintenance_type::TEXT, mr.description, 
                mr.performed_by, mr.performed_at, mr.cost, mr.next_due, mr.status::TEXT, mr.created_at, mr.updated_at,
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

