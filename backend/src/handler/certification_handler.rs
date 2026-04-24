use crate::{handler::middleware::RequireAuth, state::AppState};
use axum::{
    Json, Router,
    extract::{Query, State},
    http::StatusCode,
    routing::get,
};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct CertQuery {
    pub days: Option<i32>,
}

pub fn certification_routes(state: AppState) -> Router {
    Router::new()
        .route("/expiring", get(list_expiring))
        .with_state(state)
}

async fn list_expiring(
    State(state): State<AppState>,
    RequireAuth(_): RequireAuth,
    Query(query): Query<CertQuery>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let days = query.days.unwrap_or(30);

    match state.certification_service.get_expiring_soon(days).await {
        Ok(certs) => Ok(Json(serde_json::json!(certs))),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
