use axum::{
    extract::State,
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use crate::state::AppState;
use crate::domain::models::{AuthContextResponse, FullProfileResponse, OperationalContextResponse};
use crate::handler::middleware::RequireAuth;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct AuthPayload {
    pub ident: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct AuthError {
    pub message: String,
}

#[derive(Serialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub token_type: String,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub ident: String,
    pub password: String,
}

pub fn auth_routes(state: AppState) -> Router {
    Router::new()
        .route("/login", post(login))
        .route("/me", get(get_me))
        .route("/profile/me", get(get_full_profile))
        .route("/me/context", get(get_ops_context))
        .with_state(state)
}

async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, (StatusCode, Json<AuthError>)> {
    match state.auth_service.login(&payload.ident, &payload.password).await {
        Ok(token) => Ok(Json(AuthResponse {
            access_token: token,
            token_type: "Bearer".to_string(),
        })),
        Err(e) => {
            let code = if e.contains("salah") { StatusCode::UNAUTHORIZED } else { StatusCode::INTERNAL_SERVER_ERROR };
            Err((code, Json(AuthError { message: e })))
        }
    }
}

async fn get_me(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
) -> Result<Json<AuthContextResponse>, (StatusCode, Json<AuthError>)> {
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| (StatusCode::BAD_REQUEST, Json(AuthError { message: "Invalid user ID".to_string() })))?;

    match state.auth_service.get_auth_context(user_id).await {
        Ok(context) => Ok(Json(context)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, Json(AuthError { message: e })))
    }
}

async fn get_full_profile(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
) -> Result<Json<FullProfileResponse>, (StatusCode, Json<AuthError>)> {
    let personnel_id = claims.personnel_id
        .ok_or_else(|| (StatusCode::BAD_REQUEST, Json(AuthError { message: "User has no personnel record".to_string() })))?;

    match state.auth_service.get_full_profile(personnel_id).await {
        Ok(profile) => Ok(Json(profile)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, Json(AuthError { message: e })))
    }
}

async fn get_ops_context(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
) -> Result<Json<OperationalContextResponse>, (StatusCode, Json<AuthError>)> {
    let personnel_id = claims.personnel_id
        .ok_or_else(|| (StatusCode::BAD_REQUEST, Json(AuthError { message: "User has no personnel record".to_string() })))?;

    match state.auth_service.get_operational_context(personnel_id).await {
        Ok(context) => Ok(Json(context)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, Json(AuthError { message: e })))
    }
}
