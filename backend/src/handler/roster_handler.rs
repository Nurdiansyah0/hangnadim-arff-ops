use crate::{handler::middleware::RequireAuth, state::AppState};
use axum::{extract::State, http::StatusCode, routing::post, Json, Router};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct GenerateRosterPayload {
    pub month: u32,
    pub year: i32,
}

pub fn roster_routes(state: AppState) -> Router {
    Router::new()
        .route("/generate-monthly", post(generate_monthly))
        .with_state(state)
}

async fn generate_monthly(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Json(payload): Json<GenerateRosterPayload>,
) -> Result<StatusCode, (StatusCode, String)> {
    // Only Managers or Superusers (Role 1 or 3) should be able to trigger manual generation
    let role_id = claims.role_id.unwrap_or(0);
    if role_id != 1 && role_id != 3 {
        return Err((StatusCode::FORBIDDEN, "Only Managers can generate rosters".to_string()));
    }

    match state.roster_service.generate_monthly_roster(payload.month, payload.year).await {
        Ok(_) => Ok(StatusCode::CREATED),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
