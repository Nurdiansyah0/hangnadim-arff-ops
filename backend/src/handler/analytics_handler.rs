use crate::{handler::middleware::RequireAuth, state::AppState};
use axum::{extract::State, http::StatusCode, routing::get, Json, Router};

pub fn analytics_routes(state: AppState) -> Router {
    Router::new()
        .route("/performance", get(get_performance))
        .with_state(state)
}

async fn get_performance(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    // Analytics biasanya untuk Admin (1) atau Kasubsie (6)
    let rid = claims.role_id.unwrap_or(0);
    if rid != 1 && rid != 6 {
        return Err((StatusCode::FORBIDDEN, "Hanya Administrator atau Kasubsie yang bisa melihat performa".to_string()));
    }

    match state.analytics_service.get_performance().await {
        Ok(metrics) => Ok(Json(serde_json::json!(metrics))),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
