use crate::domain::models::MaintenanceRecord;
use crate::repository::maintenance_repository::{CreateMaintenanceParams, MaintenanceRepository};
use crate::repository::vehicle_repository::{UpdateVehicleParams, VehicleRepoTrait};
use std::sync::Arc;
use uuid::Uuid;

#[derive(Clone)]
pub struct MaintenanceService {
    repo: Arc<dyn MaintenanceRepository>,
    vehicle_repo: Arc<dyn VehicleRepoTrait>,
}

impl MaintenanceService {
    pub fn new(
        repo: Arc<dyn MaintenanceRepository>,
        vehicle_repo: Arc<dyn VehicleRepoTrait>,
    ) -> Self {
        Self { repo, vehicle_repo }
    }

    pub async fn create_maintenance_record(
        &self,
        params: CreateMaintenanceParams<'_>,
    ) -> Result<MaintenanceRecord, String> {
        let is_repair_or_scheduled = params
            .maintenance_type
            .is_some_and(|m_type| m_type == "REPAIR" || m_type == "SCHEDULED");
        let vehicle_id = params.vehicle_id;

        // 1. Create maintenance record
        let record = self
            .repo
            .create_record(params)
            .await
            .map_err(|e| e.to_string())?;

        // 2. Automatically update vehicle status if it's REPAIR or SCHEDULED
        // If it's just a request from staff, maintenance_type is None, so this doesn't fire.
        if is_repair_or_scheduled {
            self.vehicle_repo
                .update_vehicle(UpdateVehicleParams {
                    id: vehicle_id,
                    code: None,
                    name: None,
                    vehicle_type: None,
                    status: Some("MAINTENANCE"),
                    water_capacity_l: None,
                    foam_capacity_l: None,
                    powder_capacity_kg: None,
                    last_service_date: None,
                    next_service_due: None,
                })
                .await
                .map_err(|e| format!("Failed to update vehicle status: {}", e))?;
        }

        Ok(record)
    }

    pub async fn get_vehicle_maintenance_history(
        &self,
        vehicle_id: Uuid,
    ) -> Result<Vec<MaintenanceRecord>, String> {
        self.repo
            .get_by_vehicle_id(vehicle_id)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn get_maintenance_record_by_id(
        &self,
        id: Uuid,
    ) -> Result<MaintenanceRecord, String> {
        self.repo.get_by_id(id).await.map_err(|e| e.to_string())
    }
}
