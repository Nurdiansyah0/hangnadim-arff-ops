use crate::{
    domain::models::Vehicle,
    handler::middleware::RequireAuth,
    repository::vehicle_repository::{CreateVehicleParams, UpdateVehicleParams},
    state::AppState,
};
use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    routing::{get, put},
};
use bigdecimal::BigDecimal;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct CreateVehiclePayload {
    pub code: String,
    pub name: String,
    pub vehicle_type: Option<String>,
    pub status: String,
    pub water_capacity_liters: Option<BigDecimal>,
    pub foam_capacity_liters: Option<BigDecimal>,
    pub dcp_capacity_kg: Option<BigDecimal>,
    pub last_service_date: Option<chrono::NaiveDate>,
    pub next_service_due: Option<chrono::NaiveDate>,
}

#[derive(Deserialize)]
pub struct UpdateVehiclePayload {
    pub code: Option<String>,
    pub name: Option<String>,
    pub vehicle_type: Option<String>,
    pub status: Option<String>,
    pub water_capacity_liters: Option<BigDecimal>,
    pub foam_capacity_liters: Option<BigDecimal>,
    pub dcp_capacity_kg: Option<BigDecimal>,
    pub last_service_date: Option<chrono::NaiveDate>,
    pub next_service_due: Option<chrono::NaiveDate>,
}

pub fn vehicle_routes(state: AppState) -> Router {
    Router::new()
        .route("/", get(list_vehicles).post(create_vehicle))
        .route("/{id}", put(update_vehicle))
        .with_state(state)
}

async fn list_vehicles(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
) -> Result<Json<Vec<Vehicle>>, (StatusCode, String)> {
    if claims.role_id.is_none() {
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }

    match state.vehicle_service.get_all_vehicles().await {
        Ok(vehicles) => Ok(Json(vehicles)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn create_vehicle(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Json(payload): Json<CreateVehiclePayload>,
) -> Result<Json<Vehicle>, (StatusCode, String)> {
    let rid = claims.role_id.unwrap_or(0);
    if rid != 1 && rid != 5 && rid != 7 {
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }

    match state
        .vehicle_service
        .create_vehicle(CreateVehicleParams {
            code: &payload.code,
            name: &payload.name,
            vehicle_type: payload.vehicle_type.as_deref(),
            status: &payload.status,
            water_capacity_l: payload.water_capacity_liters.as_ref(),
            foam_capacity_l: payload.foam_capacity_liters.as_ref(),
            powder_capacity_kg: payload.dcp_capacity_kg.as_ref(),
            last_service_date: payload.last_service_date.as_ref(),
            next_service_due: payload.next_service_due.as_ref(),
        })
        .await
    {
        Ok(v) => Ok(Json(v)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn update_vehicle(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Path(id): Path<uuid::Uuid>,
    Json(payload): Json<UpdateVehiclePayload>,
) -> Result<Json<Vehicle>, (StatusCode, String)> {
    let rid = claims.role_id.unwrap_or(0);
    if rid != 1 && rid != 5 && rid != 7 {
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }

    match state
        .vehicle_service
        .update_vehicle(UpdateVehicleParams {
            id,
            code: payload.code.as_deref(),
            name: payload.name.as_deref(),
            vehicle_type: payload.vehicle_type.as_deref(),
            status: payload.status.as_deref(),
            water_capacity_l: payload.water_capacity_liters.as_ref(),
            foam_capacity_l: payload.foam_capacity_liters.as_ref(),
            powder_capacity_kg: payload.dcp_capacity_kg.as_ref(),
            last_service_date: payload.last_service_date.as_ref(),
            next_service_due: payload.next_service_due.as_ref(),
        })
        .await
    {
        Ok(v) => Ok(Json(v)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
