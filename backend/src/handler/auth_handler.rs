use crate::state::AppState;
use axum::{extract::State, http::StatusCode, routing::post, Json, Router};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct AuthPayload {
    pub ident: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct AuthBody {
    pub access_token: String,
    pub token_type: String,
}

#[derive(Serialize)]
pub struct AuthError {
    pub message: String,
}

pub fn auth_routes(state: AppState) -> Router {
    Router::new()
        .route("/login", post(login))
        .with_state(state)
}

async fn login(
    State(state): State<AppState>,
    Json(payload): Json<AuthPayload>,
) -> Result<Json<AuthBody>, (StatusCode, Json<AuthError>)> {
    match state.auth_service.login(&payload.ident, &payload.password).await {
        Ok(token) => Ok(Json(AuthBody {
            access_token: token,
            token_type: "Bearer".to_string(),
        })),
        Err(e) => {
            let code = if e.contains("salah") || e == "Invalid credentials" {
                StatusCode::UNAUTHORIZED
            } else {
                StatusCode::INTERNAL_SERVER_ERROR
            };
            Err((code, Json(AuthError { message: e })))
        }
    }
}
