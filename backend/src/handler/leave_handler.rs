use crate::{handler::middleware::RequireAuth, state::AppState};
use axum::{
    Json, Router, extract::Path, extract::State as AxumState, http::StatusCode, routing::get,
};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateLeavePayload {
    pub start_date: chrono::NaiveDate,
    pub end_date: chrono::NaiveDate,
    pub reason: String,
}

#[derive(Deserialize)]
pub struct StatusPayload {
    pub status: String, // APPROVED, REJECTED
}

pub fn leave_routes(state: AppState) -> Router {
    Router::new()
        .route("/", get(list_leaves).post(submit_leave))
        .route("/{id}/status", axum::routing::patch(update_leave_status))
        .with_state(state)
}

async fn list_leaves(
    AxumState(state): AxumState<AppState>,
    RequireAuth(_): RequireAuth,
) -> Result<Json<Vec<serde_json::Value>>, (StatusCode, String)> {
    match state.leave_service.list_requests().await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn submit_leave(
    AxumState(state): AxumState<AppState>,
    RequireAuth(claims): RequireAuth,
    Json(payload): Json<CreateLeavePayload>,
) -> Result<Json<Uuid>, (StatusCode, String)> {
    let pid = claims.personnel_id.ok_or((
        StatusCode::BAD_REQUEST,
        "User tidak terikat dengan personil".to_string(),
    ))?;
    match state
        .leave_service
        .submit_request(
            pid,
            payload.start_date,
            payload.end_date,
            &payload.reason,
            &state.personnel_service.repo,
        )
        .await
    {
        Ok(id) => Ok(Json(id)),
        Err(e) => Err((StatusCode::BAD_REQUEST, e)),
    }
}

async fn update_leave_status(
    AxumState(state): AxumState<AppState>,
    RequireAuth(claims): RequireAuth,
    Path(id): Path<Uuid>,
    Json(payload): Json<StatusPayload>,
) -> Result<StatusCode, (StatusCode, String)> {
    let rid = claims.role_id.unwrap_or(0);
    if rid != 1 && rid != 2 {
        return Err((
            StatusCode::FORBIDDEN,
            "Access Denied: Admin only".to_string(),
        ));
    }

    match state
        .leave_service
        .process_request(id, &payload.status, &state.personnel_service.repo)
        .await
    {
        Ok(_) => Ok(StatusCode::OK),
        Err(e) => Err((StatusCode::BAD_REQUEST, e)),
    }
}
