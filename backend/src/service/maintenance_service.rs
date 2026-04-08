use crate::domain::models::MaintenanceRecord;
use crate::repository::maintenance_repository::MaintenanceRepository;
use crate::repository::vehicle_repository::VehicleRepoTrait;
use std::sync::Arc;
use uuid::Uuid;
use bigdecimal::BigDecimal;

#[derive(Clone)]
pub struct MaintenanceService {
    repo: Arc<dyn MaintenanceRepository>,
    vehicle_repo: Arc<dyn VehicleRepoTrait>,
}

impl MaintenanceService {
    pub fn new(repo: Arc<dyn MaintenanceRepository>, vehicle_repo: Arc<dyn VehicleRepoTrait>) -> Self {
        Self { repo, vehicle_repo }
    }

    pub async fn create_maintenance_record(
        &self,
        vehicle_id: Uuid,
        maintenance_type: Option<String>,
        description: &str,
        performed_by: Uuid,
        performed_at: Option<chrono::NaiveDate>,
        cost: Option<BigDecimal>,
        next_due: Option<chrono::NaiveDate>,
    ) -> Result<MaintenanceRecord, String> {
        // 1. Create maintenance record
        let record = self.repo
            .create_record(vehicle_id, maintenance_type.as_deref(), description, performed_by, performed_at, cost, next_due)
            .await
            .map_err(|e| e.to_string())?;

        // 2. Automatically update vehicle status if it's REPAIR or SCHEDULED
        // If it's just a request from staff, maintenance_type is None, so this doesn't fire.
        if let Some(m_type) = &maintenance_type {
            if m_type == "REPAIR" || m_type == "SCHEDULED" {
                self.vehicle_repo
                    .update_vehicle(
                        vehicle_id, 
                        None, None, None, 
                        Some("MAINTENANCE"), 
                        None, None, None, None, None
                    )
                    .await
                    .map_err(|e| format!("Failed to update vehicle status: {}", e))?;
            }
        }

        Ok(record)
    }

    pub async fn get_vehicle_maintenance_history(&self, vehicle_id: Uuid) -> Result<Vec<MaintenanceRecord>, String> {
        self.repo.get_by_vehicle_id(vehicle_id).await.map_err(|e| e.to_string())
    }

    pub async fn get_maintenance_record_by_id(&self, id: Uuid) -> Result<MaintenanceRecord, String> {
        self.repo.get_by_id(id).await.map_err(|e| e.to_string())
    }
}
