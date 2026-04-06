use crate::{handler::middleware::RequireAuth, state::AppState};
use axum::{extract::State, http::StatusCode, routing::post, Json, Router};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct RawSqlQuery {
    pub query: String,
}

pub fn superuser_routes(state: AppState) -> Router {
    Router::new()
        .route("/sql", post(execute_sql))
        .with_state(state)
}

async fn execute_sql(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Json(payload): Json<RawSqlQuery>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    // SECURITY: Hanya Super Admin (Role 1) yang diizinkan!
    if claims.role_id != Some(1) {
        return Err((StatusCode::FORBIDDEN, "Akses Ditolak! Hanya System Administrator yang dapat mengeksekusi raw SQL.".to_string()));
    }

    match state.superuser_service.execute_raw_sql(&payload.query).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
