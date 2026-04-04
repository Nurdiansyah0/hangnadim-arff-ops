use crate::domain::models::{Vehicle, FireEquipment, Hydrant, FoamSystem};
use crate::domain::status::AssetStatus;
use crate::domain::dtos::{CreateVehicleDto, CreateFireEquipmentDto, CreateHydrantDto, CreateFoamSystemDto, UpdateVehicleDto, UpdateFireEquipmentDto, UpdateHydrantDto, UpdateFoamSystemDto};
use crate::repository::asset_repository::AssetRepository;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Clone)]
pub struct AssetService {
    pub repo: Arc<dyn AssetRepository>,
}

impl AssetService {
    pub fn new(repo: Arc<dyn AssetRepository>) -> Self {
        Self { repo }
    }

    // Vehicles
    pub async fn get_all_vehicles(&self) -> Result<Vec<Vehicle>, String> {
        self.repo.get_all_vehicles().await.map_err(|e| e.to_string())
    }

    pub async fn create_vehicle(&self, dto: CreateVehicleDto) -> Result<Vehicle, String> {
        let status = dto.status.unwrap_or(AssetStatus::Available);
        self.repo.create_vehicle(&dto.name, status).await.map_err(|e| e.to_string())
    }

    pub async fn get_vehicle_by_id(&self, id: Uuid) -> Result<Vehicle, String> {
        self.repo.get_vehicle_by_id(id).await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "Vehicle not found".to_string())
    }

    pub async fn update_vehicle(&self, id: Uuid, dto: UpdateVehicleDto) -> Result<Vehicle, String> {
        self.repo.update_vehicle(id, dto.name.as_deref(), dto.status).await.map_err(|e| e.to_string())
    }

    pub async fn update_vehicle_status(&self, id: Uuid, status: AssetStatus) -> Result<Vehicle, String> {
        self.repo.update_vehicle_status(id, status).await.map_err(|e| e.to_string())
    }

    pub async fn delete_vehicle(&self, id: Uuid) -> Result<(), String> {
        self.repo.delete_vehicle(id).await.map_err(|e| e.to_string())
    }

    // Fire Equipments
    pub async fn get_all_equipments(&self) -> Result<Vec<FireEquipment>, String> {
        self.repo.get_all_equipments().await.map_err(|e| e.to_string())
    }

    pub async fn create_equipment(&self, dto: CreateFireEquipmentDto) -> Result<FireEquipment, String> {
        let status = dto.status.unwrap_or(AssetStatus::Available);
        self.repo.create_equipment(&dto.name, &dto.r#type, status).await.map_err(|e| e.to_string())
    }

    pub async fn get_equipment_by_id(&self, id: Uuid) -> Result<FireEquipment, String> {
        self.repo.get_equipment_by_id(id).await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "Fire equipment not found".to_string())
    }

    pub async fn update_equipment(&self, id: Uuid, dto: UpdateFireEquipmentDto) -> Result<FireEquipment, String> {
        self.repo.update_equipment(id, dto.name.as_deref(), dto.r#type.as_deref(), dto.status).await.map_err(|e| e.to_string())
    }

    pub async fn update_equipment_status(&self, id: Uuid, status: AssetStatus) -> Result<FireEquipment, String> {
        self.repo.update_equipment_status(id, status).await.map_err(|e| e.to_string())
    }

    pub async fn delete_equipment(&self, id: Uuid) -> Result<(), String> {
        self.repo.delete_equipment(id).await.map_err(|e| e.to_string())
    }

    // Hydrants
    pub async fn get_all_hydrants(&self) -> Result<Vec<Hydrant>, String> {
        self.repo.get_all_hydrants().await.map_err(|e| e.to_string())
    }

    pub async fn create_hydrant(&self, dto: CreateHydrantDto) -> Result<Hydrant, String> {
        let status = dto.status.unwrap_or(AssetStatus::Available);
        self.repo.create_hydrant(&dto.location, dto.pressure, status).await.map_err(|e| e.to_string())
    }

    pub async fn get_hydrant_by_id(&self, id: Uuid) -> Result<Hydrant, String> {
        self.repo.get_hydrant_by_id(id).await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "Hydrant not found".to_string())
    }

    pub async fn update_hydrant(&self, id: Uuid, dto: UpdateHydrantDto) -> Result<Hydrant, String> {
        self.repo.update_hydrant(id, dto.location.as_deref(), dto.pressure, dto.status).await.map_err(|e| e.to_string())
    }

    pub async fn update_hydrant_status(&self, id: Uuid, status: AssetStatus) -> Result<Hydrant, String> {
        self.repo.update_hydrant_status(id, status).await.map_err(|e| e.to_string())
    }

    pub async fn delete_hydrant(&self, id: Uuid) -> Result<(), String> {
        self.repo.delete_hydrant(id).await.map_err(|e| e.to_string())
    }

    // Foam Systems
    pub async fn get_all_foam_systems(&self) -> Result<Vec<FoamSystem>, String> {
        self.repo.get_all_foam_systems().await.map_err(|e| e.to_string())
    }

    pub async fn create_foam_system(&self, dto: CreateFoamSystemDto) -> Result<FoamSystem, String> {
        let status = dto.status.unwrap_or(AssetStatus::Available);
        self.repo.create_foam_system(&dto.name, dto.capacity, status).await.map_err(|e| e.to_string())
    }

    pub async fn get_foam_system_by_id(&self, id: Uuid) -> Result<FoamSystem, String> {
        self.repo.get_foam_system_by_id(id).await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "Foam system not found".to_string())
    }

    pub async fn update_foam_system(&self, id: Uuid, dto: UpdateFoamSystemDto) -> Result<FoamSystem, String> {
        self.repo.update_foam_system(id, dto.name.as_deref(), dto.capacity, dto.status).await.map_err(|e| e.to_string())
    }

    pub async fn update_foam_system_status(&self, id: Uuid, status: AssetStatus) -> Result<FoamSystem, String> {
        self.repo.update_foam_system_status(id, status).await.map_err(|e| e.to_string())
    }

    pub async fn delete_foam_system(&self, id: Uuid) -> Result<(), String> {
        self.repo.delete_foam_system(id).await.map_err(|e| e.to_string())
    }
}
