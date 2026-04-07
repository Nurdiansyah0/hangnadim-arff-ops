use crate::{domain::models::{Personnel, Position}, handler::middleware::RequireAuth, state::AppState};
use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct CreatePersonnelPayload {
    pub nip_nik: String,
    pub full_name: String,
    pub position_id: Option<i32>,
    pub status: String,
    pub employment_status: Option<String>,
}

pub fn personnel_routes(state: AppState) -> Router {
    Router::new()
        .route("/", get(list_personnels).post(create_personnel))
        .route("/positions", get(list_positions))
        .with_state(state)
}

async fn list_positions(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
) -> Result<Json<Vec<Position>>, (StatusCode, String)> {
    if claims.role_id.is_none() { return Err((StatusCode::FORBIDDEN, "Forbidden".to_string())); }
    match state.personnel_service.get_all_positions().await {
        Ok(pos) => Ok(Json(pos)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn list_personnels(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
) -> Result<Json<Vec<Personnel>>, (StatusCode, String)> {
    if claims.role_id.is_none() { return Err((StatusCode::FORBIDDEN, "Forbidden".to_string())); }
    match state.personnel_service.get_all_personnels().await {
        Ok(p) => Ok(Json(p)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn create_personnel(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Json(payload): Json<CreatePersonnelPayload>,
) -> Result<Json<Personnel>, (StatusCode, String)> {
    let rid = claims.role_id.unwrap_or(0);
    if rid != 1 && rid != 7 { // Hanya Admin(1) atau HR(7)
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }
    match state.personnel_service.create_personnel(
        &payload.nip_nik, 
        &payload.full_name, 
        payload.position_id, 
        &payload.status,
        payload.employment_status.as_deref()
    ).await {
        Ok(p) => Ok(Json(p)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
