use crate::{domain::models::Inspection, handler::middleware::RequireAuth, state::AppState};
use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateInspectionPayload {
    pub vehicle_id: Uuid,
    pub tanggal: chrono::NaiveDate, // Format JSON: "2026-04-06"
    pub status: String,
}

pub fn inspection_routes(state: AppState) -> Router {
    Router::new()
        .route("/", get(list_inspections).post(create_inspection))
        .with_state(state)
}

async fn list_inspections(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
) -> Result<Json<Vec<Inspection>>, (StatusCode, String)> {
    if claims.role_id.is_none() { 
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string())); 
    }

    match state.inspection_service.get_all_inspections().await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn create_inspection(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Json(payload): Json<CreateInspectionPayload>,
) -> Result<Json<Inspection>, (StatusCode, String)> {
    let rid = claims.role_id.unwrap_or(0);
    // Role 1 (Admin), 5 (TL), 4 (Petugas)
    if rid != 1 && rid != 5 && rid != 4 {
        return Err((StatusCode::FORBIDDEN, "Role tidak memiliki izin melakukan inspeksi".to_string()));
    }

    // Mengambil ID personil dari JWT milik pemanggil endpoint
    // Hal ini guna menegakkan keamanan Audit (Tidak bisa memalsukan siapa yang inspeksi)
    match state.inspection_service.create_inspection(
        payload.vehicle_id, 
        claims.personnel_id, 
        payload.tanggal, 
        &payload.status
    ).await {
        Ok(v) => Ok(Json(v)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
