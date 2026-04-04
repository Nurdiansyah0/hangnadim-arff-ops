use crate::{domain::models::User, handler::middleware::RequireAuth, state::AppState};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, put},
    Json, Router,
};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct CreateUserPayload {
    pub name: String,
    pub nik: String,
    pub email: String,
    pub password: String,
    pub role_id: i32,
}

#[derive(Deserialize)]
pub struct UpdateUserPayload {
    pub name: String,
    pub role_id: i32,
}

pub fn users_routes(state: AppState) -> Router {
    Router::new()
        .route("/", get(list_users).post(create_user))
        .route("/{id}", put(update_user).delete(delete_user))
        .with_state(state)
}

async fn list_users(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
) -> Result<Json<Vec<User>>, (StatusCode, String)> {
    if claims.role_id != 1 && claims.role_id != 7 && claims.role_id != 2 {
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }

    match state.user_service.get_all_users().await {
        Ok(users) => Ok(Json(users)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn create_user(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Json(payload): Json<CreateUserPayload>,
) -> Result<Json<User>, (StatusCode, String)> {
    if claims.role_id != 1 && claims.role_id != 7 {
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }

    match state
        .user_service
        .create_user(
            &payload.name,
            &payload.nik,
            &payload.email,
            &payload.password,
            payload.role_id,
        )
        .await
    {
        Ok(user) => Ok(Json(user)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn update_user(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Path(id): Path<uuid::Uuid>,
    Json(payload): Json<UpdateUserPayload>,
) -> Result<Json<User>, (StatusCode, String)> {
    if claims.role_id != 1 && claims.role_id != 7 {
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }

    match state
        .user_service
        .update_user(id, &payload.name, payload.role_id)
        .await
    {
        Ok(user) => Ok(Json(user)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn delete_user(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Path(id): Path<uuid::Uuid>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    if claims.role_id != 1 && claims.role_id != 7 {
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }

    match state.user_service.delete_user(id).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT.into_response()),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
