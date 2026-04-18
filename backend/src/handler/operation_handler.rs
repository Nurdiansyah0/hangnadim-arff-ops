use crate::{handler::middleware::RequireAuth, state::AppState};
use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use serde_json::{json, Value};

pub fn operation_routes(state: AppState) -> Router {
    Router::new()
        .route("/summary", get(get_operation_summary))
        .with_state(state)
}

async fn get_operation_summary(
    State(state): State<AppState>,
    RequireAuth(_): RequireAuth,
) -> Result<Json<Value>, (StatusCode, String)> {
    let today = chrono::Local::now().naive_local().date();
    
    let summary = state.task_service.get_operation_summary(today)
        .await
        .map_err(|e| {
            eprintln!("Operation Summary Error (Metrics): {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, e)
        })?;

    let activities = state.task_service.get_recent_activities()
        .await
        .map_err(|e| {
            eprintln!("Operation Summary Error (Activities): {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, e)
        })?;

    Ok(Json(json!({
        "summary": summary,
        "activities": activities
    })))
}
