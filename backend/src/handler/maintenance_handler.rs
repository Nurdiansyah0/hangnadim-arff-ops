use crate::{repository::maintenance_repository::CreateMaintenanceParams, state::AppState};
use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
};
use bigdecimal::BigDecimal;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateMaintenancePayload {
    pub vehicle_id: Uuid,
    pub maintenance_type: Option<String>, // SCHEDULED, UNSCHEDULED, REPAIR
    pub description: String,
    pub performed_by: Uuid,
    pub performed_at: Option<chrono::NaiveDate>,
    pub cost: Option<BigDecimal>,
    pub next_due: Option<chrono::NaiveDate>,
    pub photo_url: Option<String>,
}

pub fn maintenance_routes(state: AppState) -> Router {
    Router::new()
        .route("/", post(create_maintenance))
        .route("/vehicle/{vehicle_id}", get(get_vehicle_maintenance))
        .route("/{id}", get(get_maintenance_record))
        .with_state(Arc::new(state))
}

pub async fn create_maintenance(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateMaintenancePayload>,
) -> impl IntoResponse {
    match state
        .maintenance_service
        .create_maintenance_record(CreateMaintenanceParams {
            vehicle_id: payload.vehicle_id,
            maintenance_type: payload.maintenance_type.as_deref(),
            description: &payload.description,
            performed_by: payload.performed_by,
            performed_at: payload.performed_at,
            cost: payload.cost,
            next_due: payload.next_due,
            photo_url: payload.photo_url.as_deref(),
        })
        .await
    {
        Ok(record) => (StatusCode::CREATED, Json(record)).into_response(),
        Err(e) => {
            eprintln!("MAINTENANCE_ERROR: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, e).into_response()
        }
    }
}

pub async fn get_vehicle_maintenance(
    State(state): State<Arc<AppState>>,
    Path(vehicle_id): Path<Uuid>,
) -> impl IntoResponse {
    match state
        .maintenance_service
        .get_vehicle_maintenance_history(vehicle_id)
        .await
    {
        Ok(history) => (StatusCode::OK, Json(history)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

pub async fn get_maintenance_record(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state
        .maintenance_service
        .get_maintenance_record_by_id(id)
        .await
    {
        Ok(record) => (StatusCode::OK, Json(record)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}
