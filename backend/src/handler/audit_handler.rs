use crate::domain::models::AuditLogResponse;
use crate::{handler::middleware::RequireAuth, state::AppState};
use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{delete, get, post},
};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct PaginationQuery {
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

pub fn audit_routes(state: AppState) -> Router {
    Router::new()
        .route("/", get(get_audit_logs))
        .route("/{id}/rollback", post(rollback_audit_log))
        .route("/{id}", delete(delete_audit_log))
        .with_state(state)
}

async fn get_audit_logs(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Query(pagination): Query<PaginationQuery>,
) -> Result<Json<AuditLogResponse>, (StatusCode, String)> {
    // Only Admin can see audit logs
    if claims.role_id.unwrap_or(0) != 1 {
        return Err((
            StatusCode::FORBIDDEN,
            "Access denied. Admins only.".to_string(),
        ));
    }

    let page = pagination.page.unwrap_or(1);
    let limit = pagination.limit.unwrap_or(20);
    let offset = (page - 1) * limit;

    match state.audit_repo.get_logs(offset, limit).await {
        Ok((logs, total)) => Ok(Json(AuditLogResponse { logs, total })),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to fetch logs: {}", e),
        )),
    }
}

async fn rollback_audit_log(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    if claims.role_id.unwrap_or(0) != 1 {
        return Err((
            StatusCode::FORBIDDEN,
            "Access denied. Admins only.".to_string(),
        ));
    }

    match state.audit_repo.rollback_log(id).await {
        Ok(_) => Ok(StatusCode::OK),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Rollback failed: {}", e),
        )),
    }
}

async fn delete_audit_log(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    if claims.role_id.unwrap_or(0) != 1 {
        return Err((
            StatusCode::FORBIDDEN,
            "Access denied. Admins only.".to_string(),
        ));
    }

    match state.audit_repo.delete_log(id).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Deletion failed: {}", e),
        )),
    }
}
