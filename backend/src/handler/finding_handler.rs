use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, patch},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use std::sync::Arc;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct FindingQuery {
    pub status: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct UpdateFindingPayload {
    pub severity: Option<String>,
    pub assigned_to: Option<Uuid>,
    pub status: Option<String>,
    pub resolution_notes: Option<String>,
}

pub fn finding_routes(state: AppState) -> Router {
    Router::new()
        .route("/", get(get_all_findings))
        .route("/open", get(get_open_findings))
        .route("/{id}", get(get_finding_by_id))
        .route("/{id}/resolve", patch(resolve_finding))
        .route("/{id}", patch(update_finding))
        .with_state(Arc::new(state))
}

pub async fn get_all_findings(
    State(state): State<Arc<AppState>>,
    Query(query): Query<FindingQuery>,
) -> impl IntoResponse {
    match state.finding_service.get_all_findings(query.status).await {
        Ok(findings) => (StatusCode::OK, Json(findings)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

pub async fn get_open_findings(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    match state.finding_service.get_open_findings().await {
        Ok(findings) => (StatusCode::OK, Json(findings)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

pub async fn get_finding_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.finding_service.get_finding_by_id(id).await {
        Ok(finding) => (StatusCode::OK, Json(finding)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

pub async fn update_finding(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateFindingPayload>,
) -> impl IntoResponse {
    match state.finding_service.update_finding(
        id,
        payload.severity,
        payload.assigned_to,
        payload.status,
        payload.resolution_notes
    ).await {
        Ok(finding) => (StatusCode::OK, Json(finding)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

pub async fn resolve_finding(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateFindingPayload>,
) -> impl IntoResponse {
    match state.finding_service.update_finding(
        id,
        payload.severity,
        payload.assigned_to,
        Some("RESOLVED".to_string()),
        payload.resolution_notes
    ).await {
        Ok(finding) => (StatusCode::OK, Json(finding)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}
