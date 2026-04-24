use crate::{handler::middleware::RequireAuth, state::AppState};
use axum::{
    Json, Router,
    extract::{Query, State},
    http::StatusCode,
    routing::get,
};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct AuditQuery {
    pub limit: Option<i64>,
}

pub fn compliance_routes(state: AppState) -> Router {
    Router::new()
        .route("/audit", get(list_audit_logs))
        .route("/sops", get(list_sops))
        .with_state(state)
}

async fn list_audit_logs(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Query(query): Query<AuditQuery>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    // Audit logs hanya untuk Admin (1)
    if claims.role_id != Some(1) {
        return Err((
            StatusCode::FORBIDDEN,
            "Hanya Administrator yang bisa melihat log audit".to_string(),
        ));
    }

    let limit = query.limit.unwrap_or(50);
    match state.compliance_service.get_audit_logs(limit).await {
        Ok(logs) => Ok(Json(serde_json::json!(logs))),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn list_sops(
    State(state): State<AppState>,
    RequireAuth(_): RequireAuth,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    match state.compliance_service.get_sops().await {
        Ok(sops) => Ok(Json(serde_json::json!(sops))),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
