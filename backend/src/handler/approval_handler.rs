use crate::{handler::middleware::RequireAuth, state::AppState};
use axum::{extract::State, http::StatusCode, routing::post, Json, Router};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct TransitionPayload {
    pub entity_id: Uuid,
    pub current_status: String,
    pub target_status: String,
}

pub fn approval_routes(state: AppState) -> Router {
    Router::new()
        .route("/inspections", post(approve_inspection))
        .with_state(state)
}

async fn approve_inspection(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Json(payload): Json<TransitionPayload>,
) -> Result<StatusCode, (StatusCode, String)> {
    let role_id = claims.role_id.ok_or((StatusCode::FORBIDDEN, "Role ID missing".to_string()))?;

    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| (StatusCode::BAD_REQUEST, "Invalid user ID".to_string()))?;

    match state.approval_service.transition_inspection(
        payload.entity_id, 
        &payload.current_status, 
        &payload.target_status, 
        role_id,
        Some(user_id)
    ).await {
        Ok(_) => Ok(StatusCode::OK),
        Err(e) => Err((StatusCode::BAD_REQUEST, e)),
    }
}
