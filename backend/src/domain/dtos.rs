use crate::domain::status::AssetStatus;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct CreateVehicleDto {
    #[validate(length(min = 1, message = "Name is required"))]
    pub name: String,
    pub status: Option<AssetStatus>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct UpdateVehicleDto {
    pub name: Option<String>,
    pub status: Option<AssetStatus>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct CreateFireEquipmentDto {
    #[validate(length(min = 1, message = "Name is required"))]
    pub name: String,
    #[validate(length(min = 1, message = "Type is required"))]
    pub r#type: String,
    pub status: Option<AssetStatus>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct UpdateFireEquipmentDto {
    pub name: Option<String>,
    pub r#type: Option<String>,
    pub status: Option<AssetStatus>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct CreateHydrantDto {
    #[validate(length(min = 1, message = "Location is required"))]
    pub location: String,
    pub pressure: f64,
    pub status: Option<AssetStatus>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct UpdateHydrantDto {
    pub location: Option<String>,
    pub pressure: Option<f64>,
    pub status: Option<AssetStatus>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct CreateFoamSystemDto {
    #[validate(length(min = 1, message = "Name is required"))]
    pub name: String,
    pub capacity: f64,
    pub status: Option<AssetStatus>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct UpdateFoamSystemDto {
    pub name: Option<String>,
    pub capacity: Option<f64>,
    pub status: Option<AssetStatus>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateAssetStatusDto {
    pub status: AssetStatus,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct AssignPersonnelDto {
    pub user_id: Uuid,
}
