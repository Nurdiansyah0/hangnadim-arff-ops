use crate::{domain::models::Vehicle, handler::middleware::RequireAuth, state::AppState};
use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct CreateVehiclePayload {
    pub code: String,
    pub name: String,
    pub vehicle_type: Option<String>,
    pub status: String,
}

pub fn vehicle_routes(state: AppState) -> Router {
    Router::new()
        .route("/", get(list_vehicles).post(create_vehicle))
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
    // Role 1 (Admin), role 5 (TL), role 7 (HR) -> sementara dibolehkan
    if rid != 1 && rid != 5 && rid != 7 {
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }

    match state.vehicle_service.create_vehicle(
        &payload.code, 
        &payload.name, 
        payload.vehicle_type.as_deref(),
        &payload.status
    ).await {
        Ok(v) => Ok(Json(v)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
