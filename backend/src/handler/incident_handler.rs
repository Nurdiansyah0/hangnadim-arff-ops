use crate::{domain::models::Incident, handler::middleware::RequireAuth, state::AppState};
use axum::{extract::{State, Path}, http::StatusCode, routing::{get, put}, Json, Router};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateIncidentPayload {
    pub description: String,
    pub location: Option<String>,
    pub severity: Option<String>,
}

pub fn incident_routes(state: AppState) -> Router {
    Router::new()
        .route("/", get(list_incidents).post(create_incident))
        .route("/:id/arrive", put(mark_arrived))
        .route("/:id/resolve", put(resolve_incident))
        .with_state(state)
}

async fn list_incidents(
    State(state): State<AppState>,
    RequireAuth(_): RequireAuth,
) -> Result<Json<Vec<Incident>>, (StatusCode, String)> {
    match state.incident_service.get_all_incidents().await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn create_incident(
    State(state): State<AppState>,
    RequireAuth(_): RequireAuth, // TODO: Extract user info for commander_id
    Json(payload): Json<CreateIncidentPayload>,
) -> Result<Json<Incident>, (StatusCode, String)> {
    match state.incident_service.create_incident(&payload.description, payload.location.as_deref(), payload.severity.as_deref()).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((StatusCode::BAD_REQUEST, e)),
    }
}

async fn mark_arrived(
    State(state): State<AppState>,
    RequireAuth(_): RequireAuth,
    Path(id): Path<Uuid>,
) -> Result<Json<Incident>, (StatusCode, String)> {
    match state.incident_service.mark_arrived(id).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn resolve_incident(
    State(state): State<AppState>,
    RequireAuth(_): RequireAuth,
    Path(id): Path<Uuid>,
) -> Result<Json<Incident>, (StatusCode, String)> {
    match state.incident_service.resolve_incident(id).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
