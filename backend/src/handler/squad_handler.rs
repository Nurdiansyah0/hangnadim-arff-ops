use axum::{extract::{State, Query}, http::StatusCode, routing::get, Json, Router};
use serde::Deserialize;
use chrono::NaiveDate;
use crate::{state::AppState, handler::middleware::RequireAuth, domain::models::SquadSummaryResponse};

#[derive(Deserialize)]
pub struct SquadQuery {
    pub shift_id: i32,
    pub date: NaiveDate,
}

pub fn squad_routes(state: AppState) -> Router {
    Router::new()
        .route("/summary", get(get_squad_summary))
        .with_state(state)
}

async fn get_squad_summary(
    State(state): State<AppState>,
    RequireAuth(_): RequireAuth,
    Query(params): Query<SquadQuery>,
) -> Result<Json<SquadSummaryResponse>, (StatusCode, String)> {
    let summary = state.task_service.get_squad_summary(params.shift_id, params.date)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(Json(summary))
}
