use crate::{domain::models::Shift, handler::middleware::RequireAuth, state::AppState};
use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct CreateShiftPayload {
    pub name: String,
    pub start_time: chrono::NaiveTime, // Ex JSON: "07:00:00"
    pub end_time: chrono::NaiveTime,
}

pub fn shift_routes(state: AppState) -> Router {
    Router::new()
        .route("/", get(list_shifts).post(create_shift))
        .with_state(state)
}

async fn list_shifts(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
) -> Result<Json<Vec<Shift>>, (StatusCode, String)> {
    if claims.role_id.is_none() { 
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string())); 
    }

    match state.shift_service.get_all_shifts().await {
        Ok(shifts) => Ok(Json(shifts)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn create_shift(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Json(payload): Json<CreateShiftPayload>,
) -> Result<Json<Shift>, (StatusCode, String)> {
    let rid = claims.role_id.unwrap_or(0);
    // Role 1 (Admin) atau 5 (TL Shift) / 7 (HR) yang bisa akses
    if rid != 1 && rid != 7 && rid != 5 {
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }

    match state.shift_service.create_shift(
        &payload.name, 
        payload.start_time, 
        payload.end_time
    ).await {
        Ok(s) => Ok(Json(s)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
