use crate::{
    domain::dtos::AssignPersonnelDto,
    handler::middleware::RequireAuth,
    state::AppState
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use validator::Validate;

pub fn shift_routes(state: AppState) -> Router {
    Router::new()
        .route("/", get(list_shifts))
        .route("/{id}", get(get_shift))
        .route("/{id}/personnel", get(list_personnel).post(assign_personnel).delete(remove_personnel))
        .with_state(state)
}

async fn list_shifts(State(state): State<AppState>, _auth: RequireAuth) -> impl IntoResponse {
    match state.shift_service.get_all_shifts().await {
        Ok(s) => (StatusCode::OK, Json(s)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn get_shift(State(state): State<AppState>, _auth: RequireAuth, Path(id): Path<i32>) -> impl IntoResponse {
    match state.shift_service.get_shift_by_id(id).await {
        Ok(s) => (StatusCode::OK, Json(s)).into_response(),
        Err(e) => (StatusCode::NOT_FOUND, e).into_response(),
    }
}

async fn list_personnel(State(state): State<AppState>, _auth: RequireAuth, Path(id): Path<i32>) -> impl IntoResponse {
    match state.shift_service.get_personnel_by_shift(id).await {
        Ok(p) => (StatusCode::OK, Json(p)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn assign_personnel(State(state): State<AppState>, _auth: RequireAuth, Path(id): Path<i32>, Json(payload): Json<AssignPersonnelDto>) -> impl IntoResponse {
    if let Err(e) = payload.validate() {
        return (StatusCode::BAD_REQUEST, e.to_string()).into_response();
    }
    match state.shift_service.assign_personnel(id, payload.user_id).await {
        Ok(sp) => (StatusCode::CREATED, Json(sp)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, e).into_response(),
    }
}

async fn remove_personnel(State(state): State<AppState>, _auth: RequireAuth, Path(id): Path<i32>, Json(payload): Json<AssignPersonnelDto>) -> impl IntoResponse {
    match state.shift_service.remove_personnel(id, payload.user_id).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}
