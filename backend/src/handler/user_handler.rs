use crate::{domain::models::User, handler::middleware::RequireAuth, state::AppState};
use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateUserPayload {
    pub username: String,
    pub email: String,
    pub password: String,
    pub personnel_id: Option<Uuid>,
}

pub fn users_routes(state: AppState) -> Router {
    Router::new()
        .route("/", get(list_users).post(create_user))
        .route("/{id}", get(list_users).delete(delete_user)) // Update dipisah nanti
        .with_state(state)
}

async fn list_users(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
) -> Result<Json<Vec<User>>, (StatusCode, String)> {
    // Gunakan .unwrap_or(0) karena role_id sekarang Option
    let rid = claims.role_id.unwrap_or(0);
    if rid != 1 && rid != 7 && rid != 2 {
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
    let rid = claims.role_id.unwrap_or(0);
    if rid != 1 && rid != 7 {
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }

    let personnel_id = payload.personnel_id.ok_or((
        StatusCode::BAD_REQUEST,
        "personnel_id is required".to_string(),
    ))?;

    match state
        .user_service
        .create_user(
            personnel_id,
            &payload.username,
            &payload.email,
            &payload.password,
        )
        .await
    {
        Ok(user) => Ok(Json(user)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn delete_user(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let rid = claims.role_id.unwrap_or(0);
    if rid != 1 && rid != 7 {
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }

    match state.user_service.delete_user(id).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT.into_response()),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
