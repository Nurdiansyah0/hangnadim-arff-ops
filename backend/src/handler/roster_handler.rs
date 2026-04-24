use crate::{handler::middleware::RequireAuth, state::AppState};
use axum::{
    Json, Router,
    extract::{Query, State},
    http::StatusCode,
    routing::{get, post},
};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct GenerateRosterPayload {
    pub month: u32,
    pub year: i32,
}

#[derive(Deserialize)]
pub struct QueryParams {
    pub month: u32,
    pub year: i32,
}

#[derive(Deserialize)]
pub struct UpdateAssignmentPayload {
    pub vehicle_id: Option<uuid::Uuid>,
    pub position: String,
}

pub fn roster_routes(state: AppState) -> Router {
    Router::new()
        .route("/generate-monthly", post(generate_monthly))
        .route("/view", get(get_roster_view))
        .route("/assignments/{id}", axum::routing::patch(update_assignment))
        .with_state(state)
}

async fn update_assignment(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    axum::extract::Path(id): axum::extract::Path<uuid::Uuid>,
    Json(payload): Json<UpdateAssignmentPayload>,
) -> Result<StatusCode, (StatusCode, String)> {
    let role_id = claims.role_id.unwrap_or(0);
    if role_id != 1 && role_id != 3 && role_id != 5 {
        return Err((
            StatusCode::FORBIDDEN,
            "Unauthorized role for assignment update".to_string(),
        ));
    }

    match state
        .roster_service
        .update_assignment(id, payload.vehicle_id, payload.position)
        .await
    {
        Ok(_) => Ok(StatusCode::OK),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn get_roster_view(
    State(state): State<AppState>,
    Query(params): Query<QueryParams>,
) -> Result<Json<Vec<crate::domain::models::RosterView>>, (StatusCode, String)> {
    match state
        .roster_service
        .get_monthly_view(params.month, params.year)
        .await
    {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn generate_monthly(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Json(payload): Json<GenerateRosterPayload>,
) -> Result<StatusCode, (StatusCode, String)> {
    // Only Managers or Superusers (Role 1 or 3) should be able to trigger manual generation
    let role_id = claims.role_id.unwrap_or(0);
    if role_id != 1 && role_id != 3 && role_id != 5 {
        return Err((
            StatusCode::FORBIDDEN,
            "Unauthorized role for roster generation".to_string(),
        ));
    }

    match state
        .roster_service
        .generate_monthly_roster(payload.month, payload.year)
        .await
    {
        Ok(_) => Ok(StatusCode::CREATED),
        Err(e) => Err((StatusCode::BAD_REQUEST, e)),
    }
}
