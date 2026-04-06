use crate::{domain::models::WatchroomLog, handler::middleware::RequireAuth, state::AppState};
use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use serde::Deserialize;
use serde_json::Value;

#[derive(Deserialize)]
pub struct CreateLogPayload {
    pub entry_type: Option<String>,
    pub description: String,
    pub payload: Option<Value>,
}

pub fn watchroom_routes(state: AppState) -> Router {
    Router::new()
        .route("/", get(list_logs).post(create_log))
        .with_state(state)
}

async fn list_logs(
    State(state): State<AppState>,
    RequireAuth(_): RequireAuth,
) -> Result<Json<Vec<WatchroomLog>>, (StatusCode, String)> {
    match state.watchroom_service.get_all_logs().await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn create_log(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Json(payload): Json<CreateLogPayload>,
) -> Result<Json<WatchroomLog>, (StatusCode, String)> {
    // Watchroom Log biasanya bisa diisi oleh siapapun yang login (Petugas/TL/Admin)
    match state.watchroom_service.create_log(
        claims.personnel_id, 
        payload.entry_type.as_deref(), 
        &payload.description, 
        payload.payload
    ).await {
        Ok(log) => Ok(Json(log)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
